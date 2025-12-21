import { makeErrorSvg } from '../common/utils.js';

export async function fetchHourCard(request, env) {
	const url = new URL(request.url);
	const username = url.searchParams.get('username');
	const offset = parseFloat(url.searchParams.get('offset') || '0'); // Timezone offset in hours

	if (!username) {
		return new Response(makeErrorSvg('Missing parameter: ?username=yourname'), {
			headers: { 'Content-Type': 'image/svg+xml' },
		});
	}

	const headers = {
		'User-Agent': 'readme-contribution-stats',
		Authorization: `Bearer ${env.GITHUB_TOKEN}`,
		'Content-Type': 'application/json',
	};

	const now = new Date();
	const toDate = new Date(now);
	const fromDate = new Date(now);
	fromDate.setFullYear(now.getFullYear() - 1);

	const fetchContributions = async (from, to) => {
		const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          startedAt
          endedAt
          commitContributionsByRepository(maxRepositories: 100) {
            contributions(first: 100) {
              nodes {
                occurredAt
              }
            }
          }
          issueContributions(first: 100) {
            nodes {
              occurredAt
            }
          }
          pullRequestContributions(first: 100) {
            nodes {
              occurredAt
            }
          }
          pullRequestReviewContributions(first: 100) {
            nodes {
              occurredAt
            }
          }
        }
      }
    }
  `;

		const response = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers,
			body: JSON.stringify({ query, variables: { username, from, to } }),
		});

		if (!response.ok) {
			throw new Error(`GitHub API Error: ${response.status}`);
		}

		const resJson = await response.json();
		if (resJson.errors) {
			throw new Error(`GitHub GraphQL Error: ${resJson.errors[0].message}`);
		}

		return resJson.data.user.contributionsCollection;
	};

	try {
		// Split the year into 4 chunks (3 months each) to avoid hitting the 100-item limit
		const chunks = [];
		let current = new Date(fromDate);
		const end = new Date(toDate);

		while (current < end) {
			let next = new Date(current);
			next.setMonth(next.getMonth() + 3);
			if (next > end) next = end;
			chunks.push({ from: current.toISOString(), to: next.toISOString() });
			current = next;
		}

		const results = await Promise.all(chunks.map((chunk) => fetchContributions(chunk.from, chunk.to)));

		const hours = new Array(24).fill(0);

		const processNodes = (nodes) => {
			nodes.forEach((node) => {
				const date = new Date(node.occurredAt);
				// Apply offset using UTC methods to avoid local timezone confusion
				date.setUTCHours(date.getUTCHours() + offset);
				const hour = date.getUTCHours();
				hours[hour]++;
			});
		};

		results.forEach((data) => {
			// Process Commits
			data.commitContributionsByRepository.forEach((repo) => {
				processNodes(repo.contributions.nodes);
			});

			// Process Issues, PRs, Reviews
			processNodes(data.issueContributions.nodes);
			processNodes(data.pullRequestContributions.nodes);
			processNodes(data.pullRequestReviewContributions.nodes);
		});

		const maxVal = Math.max(...hours);

		// Format Date Range
		const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		const dateRange = `${formatDate(fromDate)} - ${formatDate(toDate)}`;

		const svg = generateCurveChartSvg(hours, maxVal, dateRange);

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

function generateCurveChartSvg(counts, maxVal, footerText) {
	const width = 400;
	const height = 260; // Increased height for bottom text
	const chartHeight = 120;
	const padding = { top: 20, right: 20, bottom: 80, left: 20 };

	const chartWidth = width - padding.left - padding.right;
	const stepX = chartWidth / (counts.length - 1);

	// Points for the line
	const points = counts.map((count, i) => {
		const x = padding.left + i * stepX;
		const ratio = maxVal > 0 ? count / maxVal : 0;
		const y = height - padding.bottom - ratio * chartHeight;
		return [x, y];
	});

	const pathData = getSmoothPath(points);

	// Area path (close the loop)
	const areaPathData = `${pathData} L ${width - padding.right} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

	// X-Axis Labels (0, 1, 2, ... 23)
	const labels = counts
		.map((_, h) => {
			const x = padding.left + h * stepX;
			return `<text x="${x}" y="${height - padding.bottom + 15}" text-anchor="middle" class="axis-label">${h}</text>`;
		})
		.join('');

	return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .bg { fill: #0d1117; stroke: #30363d; }
        .title { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; }
        .axis-label { font-family: monospace; font-size: 9px; font-weight: 600; }
        .footer-text { font-family: sans-serif; font-size: 10px; fill: #8b949e; opacity: 0.6; }

        /* Palette */
        /* 
           Blue 1: #9EECFF
           Blue 2: #3094FF
           Blue 4: #0527FC
           Blue 6: #001C4D
        */

        /* Dark Mode */
        .bg { fill: #0d1117; stroke: #30363d; }
        .chart-line { stroke: #3094FF; stroke-width: 2; fill: none; } /* Blue 2 */
        .chart-area { fill: url(#gradientDark); opacity: 0.5; }
        .axis-label { fill: #8b949e; }
        .title { fill: #e6edf3; }

        /* Light Mode */
        @media (prefers-color-scheme: light) {
          .bg { fill: #ffffff; stroke: #e1e4e8; }
          .chart-line { stroke: #0527FC; stroke-width: 2; fill: none; } /* Blue 4 */
          .chart-area { fill: url(#gradientLight); opacity: 0.3; }
          .axis-label { fill: #57606a; }
          .title { fill: #24292f; }
        }

        .fade-in { opacity: 0; animation: fadeIn 0.6s forwards ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      </style>

      <defs>
        <linearGradient id="gradientDark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#3094FF" />
          <stop offset="100%" stop-color="#3094FF" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="gradientLight" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#0527FC" />
          <stop offset="100%" stop-color="#0527FC" stop-opacity="0" />
        </linearGradient>
      </defs>

      <rect width="100%" height="100%" rx="10" class="bg" />
      
      <g class="fade-in">
        <path d="${areaPathData}" class="chart-area" />
        <path d="${pathData}" class="chart-line" stroke-linecap="round" stroke-linejoin="round" />
      </g>

      ${labels}

      <text x="50%" y="${height - 45}" text-anchor="middle" class="title">Commits by Hour</text>
      <text x="50%" y="${height - 25}" text-anchor="middle" class="footer-text">${footerText}</text>

    </svg>
  `;
}

// Helper to create smooth path
function getSmoothPath(points) {
	if (points.length === 0) return '';
	if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

	let d = `M ${points[0][0]} ${points[0][1]}`;

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = i > 0 ? points[i - 1] : points[0];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = i < points.length - 2 ? points[i + 2] : p2;

		const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
		const cp1y = p1[1] + (p2[1] - p0[1]) / 6;

		const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
		const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

		d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
	}

	return d;
}
