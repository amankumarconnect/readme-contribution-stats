import { makeErrorSvg, kFormatter, escapeXml } from '../common/utils.js';

export async function fetchSingleRepoCard(request, env) {
	const url = new URL(request.url);
	const username = url.searchParams.get('username');
	const repoParam = url.searchParams.get('repo');
	const transparent = url.searchParams.get('transparent') === 'true';

	if (!username || !repoParam) {
		return new Response(makeErrorSvg('Missing parameters: username and repo required'), {
			headers: { 'Content-Type': 'image/svg+xml' },
		});
	}

	let fullRepoPath = '';

	
	if (repoParam.startsWith('http')) {
		try {
			const repoUrl = new URL(repoParam);
			fullRepoPath = repoUrl.pathname.replace(/^\/|\.git$/g, '');
		} catch (e) {
			fullRepoPath = repoParam;
		}
	}

	else if (repoParam.includes('/')) {
		fullRepoPath = repoParam;
	}
	
	else {
		fullRepoPath = `${username}/${repoParam}`;
	}

	const headers = {
		'User-Agent': 'readme-contribution-stats',
		Authorization: `Bearer ${env.GITHUB_TOKEN}`,
		Accept: 'application/vnd.github.v3+json',
	};

	try {
		let repoData;

		const repoRes = await fetch(`https://api.github.com/repos/${fullRepoPath}`, { headers });

		if (repoRes.ok) {
			repoData = await repoRes.json();
		} else {
			
			const q = `${repoParam} user:${username}`;
			const searchRepoRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}`, { headers });

			if (!searchRepoRes.ok) throw new Error(`Search failed: ${searchRepoRes.status}`);

			const searchData = await searchRepoRes.json();

			if (searchData.items && searchData.items.length > 0) {
				fullRepoPath = searchData.items[0].full_name;
				const retryRes = await fetch(`https://api.github.com/repos/${fullRepoPath}`, { headers });
				if (!retryRes.ok) throw new Error(`Repo not found: ${fullRepoPath}`);
				repoData = await retryRes.json();
			} else {
				throw new Error(`Repository "${repoParam}" not found for user "${username}"`);
			}
		}

	
		const searchQuery = `is:pr is:merged is:public author:${username} repo:${fullRepoPath}`;
		const searchRes = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}`, { headers });
		const searchPrData = await searchRes.json();
		const prCount = searchPrData.total_count || 0;

		
		const imgRes = await fetch(repoData.owner.avatar_url);
		const imgBuf = await imgRes.arrayBuffer();
		
		const u8 = new Uint8Array(imgBuf);
		let binary = '';
		const chunk = 0x8000;
		for (let i = 0; i < u8.length; i += chunk) {
			binary += String.fromCharCode.apply(null, u8.subarray(i, i + chunk));
		}
		const base64Avatar = btoa(binary);

		const svg = generateSingleRepoSvg({
			name: repoData.name,
			owner: repoData.owner.login,
			stars: repoData.stargazers_count,
			prCount,
			base64: base64Avatar,
			transparent,
		});

		return new Response(svg, {
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=14400',
			},
		});
	} catch (err) {
		return new Response(makeErrorSvg(err.message), { 
			status: 200, 
			headers: { 'Content-Type': 'image/svg+xml' } 
		});
	}
}

function generateSingleRepoSvg({ name, owner, stars, prCount, base64, transparent }) {
	const bgFill = transparent ? 'none' : '#0d1117';
	const borderStroke = '#30363d';

	return `
    <svg width="400" height="100" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
      <style>
        .bg { fill: ${bgFill}; stroke: ${borderStroke}; stroke-width: 1.5; }
        .repo-name { fill: #58a6ff; font-family: sans-serif; font-weight: bold; font-size: 18px; }
        .owner { fill: #8b949e; font-family: sans-serif; font-size: 14px; }
        .stats { fill: #8b949e; font-family: sans-serif; font-size: 12px; }
        @media (prefers-color-scheme: light) {
          .bg { fill: ${transparent ? 'none' : '#ffffff'}; stroke: #e1e4e8; }
          .repo-name { fill: #0969da; }
          .owner { fill: #57606a; }
          .stats { fill: #57606a; }
        }
      </style>
      <rect width="100%" height="100%" rx="10" class="bg" />
      <image x="20" y="20" width="60" height="60" href="data:image/png;base64,${base64}" clip-path="inset(0% round 50%)" />
      <text x="95" y="40" class="repo-name">${escapeXml(name)}</text>
      <text x="95" y="60" class="owner">by ${escapeXml(owner)}</text>
      <g transform="translate(95, 80)" class="stats">
        <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.719-4.192-3.046-2.97a.75.75 0 01.416-1.28l4.21-.612L7.327.668A.75.75 0 018 .25z" fill="currentColor" transform="scale(0.8) translate(0, -12)"/>
        <text x="15" y="0">${kFormatter(stars)} stars</text>
        <text x="80" y="0">|  ${prCount} merged PRs</text>
      </g>
    </svg>`;
}