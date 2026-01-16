import { fetchRepoCard } from './cards/repos.js';
import { fetchDayCard } from './cards/day.js';
import { fetchHourCard } from './cards/hour.js';
import { fetchSingleRepoCard } from './cards/repo.js';
import { makeErrorSvg, makeBadgeSvg } from './common/utils.js';
import { renderHomePage } from './pages/home.js';

async function trackUser(env, username) {
	if (!username) return;
	try {
		const userKey = `user:${username.toLowerCase()}`;
		const exists = await env.stats.get(userKey);
		if (!exists) {
			await env.stats.put(userKey, new Date().toISOString());
			let count = await env.stats.get('global:unique-users');
			count = parseInt(count || '0') + 1;
			await env.stats.put('global:unique-users', count.toString());
		}
	} catch (e) {
		console.error('Tracking error', e);
	}
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (!url.searchParams.has('type') && !url.searchParams.has('username')) {
			return await renderHomePage(env);
		}

		const type = url.searchParams.get('type') || 'repos'; // Default to 'repos'
		const username = url.searchParams.get('username');

		// Track usage asynchronously
		if (username) {
			ctx.waitUntil(trackUser(env, username));
		}

		// Route the traffic
		switch (type) {
			case 'repos':
				return await fetchRepoCard(request, env);

			case 'day':
				return await fetchDayCard(request, env);
				
			case 'repo':
    			return await fetchSingleRepoCard(request, env);

			case 'hour':
				return await fetchHourCard(request, env);

			case 'usage':
			case 'stats':
				const count = (await env.stats.get('global:unique-users')) || '0';
				return new Response(makeBadgeSvg('Users', count), {
					headers: {
						'Content-Type': 'image/svg+xml',
						'Cache-Control': 'max-age=60', // Cache for 1 minute
					},
				});

			default:
				return new Response(makeErrorSvg('Invalid type parameter. Use ?type=repos, ?type=day, ?type=hour or ?type=stats'), {
					headers: { 'Content-Type': 'image/svg+xml' },
				});
		}
	},
};
