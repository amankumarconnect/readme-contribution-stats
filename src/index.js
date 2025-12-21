export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");

    // 1. Validation
    if (!username) {
      return new Response(makeErrorSvg("Missing parameter: ?username=yourname"), {
        headers: { "Content-Type": "image/svg+xml" }
      });
    }

    const headers = {
      "User-Agent": "readme-contribution-stats",
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json"
    };

    // 2. Fetch all merged PRs (public)
    const query = `is:pr is:merged is:public author:${username} -user:${username}`;
    const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=100`;

    try {
      const searchRes = await fetch(searchUrl, { headers });
      if (!searchRes.ok) throw new Error(`GitHub API Error: ${searchRes.status}`);
      const searchData = await searchRes.json();

      // 3. Aggregate Data
      const repoMap = new Map();

      for (const item of searchData.items) {
        const repoUrl = item.repository_url;
        const repoFullName = repoUrl.split("/repos/")[1]; 
        const [owner, name] = repoFullName.split("/");

        if (owner.toLowerCase() === username.toLowerCase()) continue;

        if (!repoMap.has(repoFullName)) {
          repoMap.set(repoFullName, {
            fullName: repoFullName,
            name: name,
            owner: owner,
            apiUrl: repoUrl,
            prCount: 1,
            ownerAvatar: `https://github.com/${owner}.png?size=64`
          });
        } else {
          repoMap.get(repoFullName).prCount += 1;
        }
      }

      // 4. Fetch Details (Stars)
      let repos = Array.from(repoMap.values())
        .sort((a, b) => b.prCount - a.prCount)
        .slice(0, 15);

      const detailsPromises = repos.map(async (repo) => {
        try {
          const res = await fetch(repo.apiUrl, { headers });
          if(!res.ok) return null;
          const data = await res.json();
          
          const imgRes = await fetch(repo.ownerAvatar);
          const imgBuf = await imgRes.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)));

          return {
            ...repo,
            stars: data.stargazers_count,
            base64: base64
          };
        } catch (e) {
          return null;
        }
      });

      let enrichedRepos = (await Promise.all(detailsPromises)).filter(r => r !== null);

      // 5. Sort by Stars
      enrichedRepos.sort((a, b) => b.stars - a.stars);
      enrichedRepos = enrichedRepos.slice(0, 8); 

      if (enrichedRepos.length === 0) {
        return new Response(makeErrorSvg("No external contributions found"), { headers: { "Content-Type": "image/svg+xml" } });
      }

      // 6. Generate SVG
      const svg = generateCardSvg(enrichedRepos);

      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=14400"
        }
      });

    } catch (err) {
      return new Response(makeErrorSvg(err.message), { status: 500 });
    }
  }
};

// --- Helper Functions ---

function kFormatter(num) {
  return Math.abs(num) > 999 
    ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' 
    : Math.sign(num)*Math.abs(num);
}

function makeErrorSvg(message) {
  return `
  <svg width="400" height="60" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f8d7da" rx="5"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="#721c24">${message}</text>
  </svg>`;
}

function generateCardSvg(repos) {
  const cardWidth = 350; 
  const cardHeight = 50;
  const gap = 10;
  const columns = 2; 
  const padding = 10;

  const totalWidth = (columns * cardWidth) + ((columns - 1) * gap) + (padding * 2);
  const rows = Math.ceil(repos.length / columns);
  const totalHeight = (rows * cardHeight) + ((rows - 1) * gap) + (padding * 2);

  let content = repos.map((repo, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = padding + (col * (cardWidth + gap));
    const y = padding + (row * (cardHeight + gap));

    return `
      <g transform="translate(${x}, ${y})">
        <rect width="${cardWidth}" height="${cardHeight}" rx="6" fill="#ffffff" stroke="#e1e4e8" class="card-bg" />
        
        <image x="10" y="8" width="34" height="34" href="data:image/png;base64,${repo.base64}" clip-path="inset(0% round 50%)" />
        
        <text x="55" y="20" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif" font-weight="600" font-size="14" fill="#0366d6" class="repo-name">
          ${repo.name}
        </text>

        <g transform="translate(55, 38)" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif" font-size="12" fill="#586069" class="stats-text">
          
          <g transform="translate(0, 0)"> 
            <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.719-4.192-3.046-2.97a.75.75 0 01.416-1.28l4.21-.612L7.327.668A.75.75 0 018 .25z" 
              transform="translate(0, -7) scale(0.8)" />
            <text x="16" y="0" dominant-baseline="middle">${kFormatter(repo.stars)}</text>
          </g>

          <g transform="translate(65, 0)">
            <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.25 2.25 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.25 2.25 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z" 
              transform="translate(0, -7) scale(0.7)" />
            <text x="16" y="0" dominant-baseline="middle">${repo.prCount} merged</text>
          </g>

        </g>
      </g>
    `;
  }).join('');

  return `
    <svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .card-bg { fill: #ffffff; stroke: #e1e4e8; }
        .repo-name { fill: #0366d6; }
        .stats-text { fill: #586069; }
        path { fill: #586069; }
        
        @media (prefers-color-scheme: dark) {
          .card-bg { fill: #0d1117; stroke: #30363d; }
          .repo-name { fill: #58a6ff; }
          .stats-text { fill: #8b949e; }
          path { fill: #8b949e; }
        }
        
        image { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      </style>
      ${content}
    </svg>
  `;
}