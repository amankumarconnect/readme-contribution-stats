import { makeErrorSvg, kFormatter, fetchUser, escapeXml } from '../common/utils.js';

/**
 * Generate an SVG card summarizing a user's external repository contributions.
 *
 * Parses query parameters from the incoming request (username required; optional title, limit, sort, exclude),
 * queries GitHub REST and GraphQL APIs to collect merged PR counts, star counts, and owner avatars,
 * applies exclusions and sorting, fetches avatar images as base64, and renders an SVG card via generateCardSvg.
 *
 * @param {Request} request - Incoming HTTP request whose URL provides query parameters:
 *                            `username` (required), `title` (optional), `limit` (optional, defaults to 6),
 *                            `sort` (optional; "stars" or "contributions"), and `exclude` (optional CSV of repo names or full names).
 * @param {Object} env - Environment bindings containing `GITHUB_TOKEN` used for GitHub API requests.
 * @returns {Response} An HTTP Response whose body is SVG markup. On success the SVG card is returned with Content-Type "image/svg+xml"
 *                     and caching headers; on error an error SVG is returned (unexpected errors produce a 500 Response).
 */
export async function fetchRepoCard(request, env) {
	const url = new URL(request.url);
	const username = url.searchParams.get('username');
	let title = url.searchParams.get('title');
	const limit = parseInt(url.searchParams.get('limit')) || 6;
	const sort = url.searchParams.get('sort');
	const excludeParam = url.searchParams.get('exclude');
	const excludeList = excludeParam ? excludeParam.split(',').map(e => e.trim().toLowerCase()) : [];

	if (!username) {
		return new Response(makeErrorSvg('Missing parameter: ?type=repos&username=yourname&limit=6'), {
			headers: { 'Content-Type': 'image/svg+xml' },
		});
	}

	if (!title) {
		const user = await fetchUser(username, env);
		const name = user && user.name ? user.name.split(' ')[0] : username;
		title = `${name}'s Open Source Contributions`;
	}

	const headers = {
		'User-Agent': 'readme-contribution-stats',
		Authorization: `Bearer ${env.GITHUB_TOKEN}`,
		Accept: 'application/vnd.github.v3+json',
	};

	const query = `is:pr is:merged is:public author:${username} -user:${username} sort:created-desc`;
	const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=100`;

	try {
		const searchRes = await fetch(searchUrl, { headers });
		if (!searchRes.ok) throw new Error(`GitHub API Error: ${searchRes.status}`);
		const searchData = await searchRes.json();

		const repoMap = new Map();

		for (const item of searchData.items) {
			const repoUrl = item.repository_url;
			// Safer parsing of repo URL
			const repoFullName = new URL(repoUrl).pathname.split('/').slice(2).join('/');
			const [owner, name] = repoFullName.split('/');

			// Exclude if in excludeList (by name or fullName)
			if (
				excludeList.includes(name.toLowerCase()) ||
				excludeList.includes(repoFullName.toLowerCase())
			) continue;

			if (owner.toLowerCase() === username.toLowerCase()) continue;

			let type = 'Code';
			const textToCheck = (item.title + (item.labels || []).map((l) => l.name).join(' ')).toLowerCase();

			if (textToCheck.includes('doc') || textToCheck.includes('readme') || textToCheck.includes('typo') || textToCheck.includes('edit')) {
				type = 'Docs';
			}

			if (!repoMap.has(repoFullName)) {
				repoMap.set(repoFullName, {
					fullName: repoFullName,
					name: name,
					owner: owner,
					apiUrl: repoUrl,
					prCount: 1,
					types: new Set([type]),
					ownerAvatar: `https://github.com/${owner}.png?size=64`,
				});
			} else {
				const repo = repoMap.get(repoFullName);
				repo.prCount += 1;
				repo.types.add(type);
			}
		}

		// Limit the number of repositories to check.
		// With GraphQL, we can fetch details for many repos in 1 request.
		// We still need to be mindful of the total subrequests for avatars (limit).
		// 1 search + 1 user + 1 graphql + limit avatars.
		// If limit is 20, total is 23. Safe.
		// We can check up to 100 repos from search results, but let's cap at 60 to be safe with query size.
		let reposToCheck = Array.from(repoMap.values()).slice(0, 60);

		// Fetch details (stars) using GraphQL to save requests
		const queryParts = reposToCheck.map((repo, index) => {
			// GitHub usernames/repo names are generally safe for unescaped GraphQL string interpolation
			// but let's be safe against quotes
			const safeOwner = repo.owner.replace(/"/g, '\\"');
			const safeName = repo.name.replace(/"/g, '\\"');
			return `repo${index}: repository(owner: "${safeOwner}", name: "${safeName}") { stargazerCount, owner { avatarUrl(size: 64) } }`;
		});

		const graphqlQuery = `query { ${queryParts.join('\n')} }`;

		let repoDetails = {};
		try {
			const graphqlRes = await fetch('https://api.github.com/graphql', {
				method: 'POST',
				headers: {
					'User-Agent': 'readme-contribution-stats',
					Authorization: `Bearer ${env.GITHUB_TOKEN}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ query: graphqlQuery }),
			});

			if (graphqlRes.ok) {
				const graphqlData = await graphqlRes.json();
				repoDetails = graphqlData.data || {};
			}
		} catch (e) {
			console.error('GraphQL fetch failed', e);
			// Fallback or continue with 0 stars?
		}

		let enrichedRepos = reposToCheck.map((repo, index) => {
			const details = repoDetails[`repo${index}`];
			const stars = details ? details.stargazerCount : 0;
			const avatarUrl = details && details.owner ? details.owner.avatarUrl : repo.ownerAvatar;

			const typeArray = Array.from(repo.types);
			let finalType = typeArray[0];
			if (typeArray.includes('Code') && typeArray.includes('Docs')) finalType = 'Code + Docs';

			return {
				...repo,
				stars: stars,
				ownerAvatar: avatarUrl,
				contributionType: finalType,
			};
		});

		enrichedRepos.sort((a, b) => {
			if (sort === 'stars') {
				return b.stars - a.stars;
			}
			if (sort === 'contributions') {
				return b.prCount - a.prCount;
			}
			const starDiff = b.stars - a.stars;
			if (starDiff !== 0) return starDiff;
			return b.prCount - a.prCount;
		});

		enrichedRepos = enrichedRepos.slice(0, limit);

		// Fetch avatars only for the final list
		const avatarPromises = enrichedRepos.map(async (repo) => {
			try {
				const imgRes = await fetch(repo.ownerAvatar);
				const imgBuf = await imgRes.arrayBuffer();
				const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)));
				return { ...repo, base64 };
			} catch (e) {
				return { ...repo, base64: '' };
			}
		});

		enrichedRepos = await Promise.all(avatarPromises);

		if (enrichedRepos.length === 0) {
			return new Response(makeErrorSvg('No external contributions found'), { headers: { 'Content-Type': 'image/svg+xml' } });
		}

		const svg = generateCardSvg(enrichedRepos, title);

		return new Response(svg, {
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=14400',
			},
		});
	} catch (err) {
		return new Response(makeErrorSvg(err.message), { status: 500 });
	}
}

function generateCardSvg(repos, title) {
	const cardWidth = 400;
	const cardHeight = 60;
	const gap = 15;
	const columns = 2;
	const padding = 20;
	const headerHeight = 40;

	const totalWidth = columns * cardWidth + (columns - 1) * gap + padding * 2;
	const rows = Math.ceil(repos.length / columns);
	const totalHeight = headerHeight + rows * cardHeight + (rows - 1) * gap + padding * 2;

	const iconCode = `<path d="M4.72 3.22a.75.75 0 011.06 1.06L2.06 8l3.72 3.72a.75.75 0 11-1.06 1.06L.47 8.53a.75.75 0 010-1.06l4.25-4.25zm11.56 0a.75.75 0 10-1.06 1.06L18.94 8l-3.72 3.72a.75.75 0 101.06 1.06l4.25-4.25a.75.75 0 000-1.06l-4.25-4.25z" transform="translate(0, -6) scale(0.7)"/>`;
	const iconDocs = `<path d="M0 1.75A.75.75 0 01.75 1h4.253c1.227 0 2.317.59 3 1.501A3.744 3.744 0 0111.006 1h4.245a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-4.507a2.25 2.25 0 00-1.591.659l-.622.621a.75.75 0 01-1.06 0l-.622-.621A2.25 2.25 0 005.258 13H.75a.75.75 0 01-.75-.75V1.75zm8.755 3a2.25 2.25 0 012.25-2.25H14.5v9h-3.757c-.71 0-1.4.201-1.992.572l.004-7.322zm-1.504 7.324l.004-5.073-.002-2.253A2.25 2.25 0 005.003 2.5H1.5v9h3.757a3.676 3.676 0 011.997.574z" transform="translate(0, -6) scale(0.7)"/>`;

	let content = repos
		.map((repo, i) => {
			const col = i % columns;
			const row = Math.floor(i / columns);
			const x = padding + col * (cardWidth + gap);
			const y = headerHeight + padding + row * (cardHeight + gap);

			let typeIcon = iconCode;
			if (repo.contributionType === 'Docs') typeIcon = iconDocs;

			return `
      <g transform="translate(${x}, ${y})">
        <rect width="${cardWidth}" height="${cardHeight}" rx="8" fill="#ffffff" stroke="#e1e4e8" class="card-bg" />
        
        <image x="15" y="13" width="34" height="34" href="data:image/png;base64,${repo.base64}" clip-path="inset(0% round 50%)" />
        
        <text x="60" y="24" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-weight="600" font-size="14" fill="#0969da" class="repo-name">${escapeXml(
					repo.name
				)}</text>

        <g transform="translate(60, 44)" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="11" fill="#586069" class="stats-text">
           
           <g transform="translate(0, 0)">
              ${typeIcon}
              <text x="16" y="0" dominant-baseline="middle">${escapeXml(repo.contributionType)}</text>
           </g>

           <g transform="translate(100, 0)">
              <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.719-4.192-3.046-2.97a.75.75 0 01.416-1.28l4.21-.612L7.327.668A.75.75 0 018 .25z" 
                transform="translate(0, -6) scale(0.7)"/>
              <text x="14" y="0" dominant-baseline="middle">${kFormatter(repo.stars)}</text>
              
              <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.25 2.25 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.25 2.25 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z" 
                transform="translate(65, -6) scale(0.6)"/>
              <text x="80" y="0" dominant-baseline="middle">${repo.prCount} merged</text>
           </g>
        </g>
      </g>
    `;
		})
		.join('');

	return `
    <svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .card-bg { fill: #ffffff; stroke: #e1e4e8; }
        .repo-name { fill: #0969da; }
        .stats-text { fill: #586069; }
        .title { fill: #08872B; }
        path { fill: #586069; }
        
        @media (prefers-color-scheme: dark) {
          .card-bg { fill: #0d1117; stroke: #30363d; }
          .repo-name { fill: #58a6ff; }
          .stats-text { fill: #8b949e; }
          path { fill: #8b949e; }
        }
        
        .fade-in { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      </style>

      <g transform="translate(25, 30)">
        <text class="title fade-in" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-weight="bold" font-size="22">${escapeXml(
					title
				)}</text>
      </g>

      ${content}
    </svg>
  `;
}