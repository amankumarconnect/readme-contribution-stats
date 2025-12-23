export function escapeXml(unsafe) {
	return unsafe.replace(/[<>&'"]/g, (c) => {
		switch (c) {
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '&':
				return '&amp;';
			case "'":
				return '&apos;';
			case '"':
				return '&quot;';
		}
	});
}

export function makeErrorSvg(message) {
	return `
  <svg width="400" height="60" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f8d7da" rx="5"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="#721c24">${escapeXml(
			message
		)}</text>
  </svg>`;
}

export function kFormatter(num) {
	return Math.abs(num) > 999 ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + 'k' : Math.sign(num) * Math.abs(num);
}

export function makeBadgeSvg(label, value) {
	const labelWidth = label.length * 7 + 20;
	const valueWidth = String(value).length * 7 + 20;
	const totalWidth = labelWidth + valueWidth;

	return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
    <linearGradient id="b" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <mask id="a">
      <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
    </mask>
    <g mask="url(#a)">
      <path fill="#555" d="M0 0h${labelWidth}v20H0z"/>
      <path fill="#4c1" d="M${labelWidth} 0h${valueWidth}v20H${labelWidth}z"/>
      <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
      <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
      <text x="${labelWidth / 2}" y="14">${label}</text>
      <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
      <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
    </g>
  </svg>`;
}

export async function fetchUser(username, env) {
	const headers = {
		'User-Agent': 'readme-contribution-stats',
		Authorization: `Bearer ${env.GITHUB_TOKEN}`,
	};
	const res = await fetch(`https://api.github.com/users/${username}`, { headers });
	if (!res.ok) return null;
	return await res.json();
}
