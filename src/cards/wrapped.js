import { makeErrorSvg } from '../common/utils.js';

export async function fetchWrappedCard(request, env) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  const timezone = url.searchParams.get("timezone") || "UTC"; 

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

  // FETCH UPGRADE: Fetch 3 pages (300 events) in parallel
  // This is the maximum history GitHub's 'events' API allows.
  const urls = [
    `https://api.github.com/users/${username}/events?per_page=100&page=1`,
    `https://api.github.com/users/${username}/events?per_page=100&page=2`,
    `https://api.github.com/users/${username}/events?per_page=100&page=3`
  ];

  try {
    const responses = await Promise.all(urls.map(u => fetch(u, { headers })));
    
    // Check if at least the first request succeeded
    if (!responses[0].ok) {
       throw new Error(`GitHub API Error: ${responses[0].status}`);
    }

    // Combine all JSON results
    let events = [];
    for (const res of responses) {
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          events = events.concat(data);
        }
      }
    }

    if (events.length === 0) {
      return new Response(makeErrorSvg("No recent activity found"), {
        headers: { "Content-Type": "image/svg+xml" }
      });
    }

    // --- ANALYSIS LOGIC ---
    const dayCounts = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    const hourCounts = new Array(24).fill(0);
    
    const fmt = new Intl.DateTimeFormat('en-US', { 
      timeZone: timezone, 
      hour: 'numeric', 
      hour12: false 
    });

    const validTypes = ['PushEvent', 'PullRequestEvent', 'CreateEvent'];
    let validCount = 0;

    for (const event of events) {
      if (!validTypes.includes(event.type)) continue;
      validCount++;

      const date = new Date(event.created_at);
      
      // 1. Get Hour in User's Timezone
      const parts = fmt.formatToParts(date);
      const hourPart = parts.find(p => p.type === 'hour').value;
      const hour = parseInt(hourPart); 
      
      // 2. Get Day Index (0-6)
      const localDateStr = date.toLocaleString("en-US", { timeZone: timezone });
      const localDate = new Date(localDateStr);
      const dayIndex = localDate.getDay();

      if (dayCounts[dayIndex] !== undefined) dayCounts[dayIndex]++;
      if (hourCounts[hour] !== undefined) hourCounts[hour]++;
    }

    if (validCount === 0) {
       return new Response(makeErrorSvg("No coding activity found in last 300 events"), {
        headers: { "Content-Type": "image/svg+xml" }
      });
    }

    // A. Find Max Day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const maxDayIndex = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);
    const maxDay = days[maxDayIndex];

    // B. Find Max Hour (Peak Time)
    let maxHourIndex = 0;
    let maxHourCount = -1;
    hourCounts.forEach((count, idx) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        maxHourIndex = idx;
      }
    });

    const peakTimeDate = new Date();
    peakTimeDate.setHours(maxHourIndex);
    const peakTimeStr = peakTimeDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

    // Generate SVG
    const svg = generateWrappedSvg(username, maxDay, peakTimeStr, validCount, timezone);

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

function generateWrappedSvg(username, maxDay, peakTime, totalEvents, timezone) {
  return `
    <svg width="400" height="150" viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg">
      <style>
        .bg { fill: #0d1117; stroke: #30363d; }
        .title { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; font-weight: 800; font-size: 18px; fill: #58a6ff; }
        .label { font-family: sans-serif; font-size: 12px; fill: #8b949e; }
        .value { font-family: sans-serif; font-weight: 600; font-size: 14px; fill: #c9d1d9; }
        .highlight { font-size: 24px; font-weight: bold; fill: #ffffff; }
        
        @media (prefers-color-scheme: light) {
          .bg { fill: #ffffff; stroke: #e1e4e8; }
          .title { fill: #0969da; }
          .label { fill: #57606a; }
          .value { fill: #24292f; }
          .highlight { fill: #24292f; }
        }
      </style>

      <rect width="100%" height="100%" rx="10" class="bg" />
      
      <text x="25" y="35" class="title">GitHub Activity Snapshot</text>
      
      <g transform="translate(25, 70)">
        <text x="0" y="0" class="label">MOST ACTIVE DAY</text>
        <text x="0" y="25" class="value" font-size="20">${maxDay}</text>
      </g>

      <g transform="translate(200, 70)">
        <text x="0" y="0" class="label">PEAK PRODUCTIVITY</text>
        <text x="0" y="25" class="highlight">${peakTime}</text>
      </g>

      <line x1="25" y1="115" x2="375" y2="115" stroke="#30363d" stroke-width="1" opacity="0.5" />
      <text x="25" y="135" class="label" font-size="10">Based on last ${totalEvents} events in ${timezone.split('/')[1] || timezone}</text>
    </svg>
  `;
}