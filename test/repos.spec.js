import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import worker from '../src';

describe('Repo Card', () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		globalThis.fetch = vi.fn();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('respects subrequest limits when limit is high', async () => {
		const limit = 10;
		const username = 'testuser';

		// Mock Search Response
		const searchItems = Array.from({ length: 60 }, (_, i) => ({
			repository_url: `https://api.github.com/repos/owner${i}/repo${i}`,
			title: `PR ${i}`,
			labels: [],
			created_at: new Date().toISOString(),
		}));

		globalThis.fetch.mockImplementation(async (url) => {
			const urlStr = url.toString();
			if (urlStr.includes('users/testuser')) {
				return {
					ok: true,
					json: async () => ({ name: 'Test User' }),
				};
			}
			if (urlStr.includes('search/issues')) {
				return {
					ok: true,
					json: async () => ({ items: searchItems }),
				};
			}
			if (urlStr.includes('api.github.com/graphql')) {
				const data = {};
				for (let i = 0; i < 60; i++) {
					data[`repo${i}`] = {
						stargazerCount: 100 + i,
						owner: { avatarUrl: `https://avatars.githubusercontent.com/u/${i}?v=4` },
					};
				}
				return {
					ok: true,
					json: async () => ({ data }),
				};
			}
			if (urlStr.includes('.png')) {
				return {
					ok: true,
					arrayBuffer: async () => new ArrayBuffer(10),
				};
			}
			return { ok: false };
		});

		const request = new Request(`http://example.com/?type=repos&username=${username}&limit=${limit}`);
		const ctx = createExecutionContext();
		await worker.fetch(request, env, ctx);

		const calls = globalThis.fetch.mock.calls.length;
		console.log(`Total fetch calls: ${calls}`);

		// 1 (user) + 1 (search) + 1 (graphql) + limit (10) = 13
		expect(calls).toBeLessThanOrEqual(20);
	});

	it('fetches both PRs and issues when both parameters are set', async () => {
		const username = 'testuser';

		const prItems = [
			{
				repository_url: 'https://api.github.com/repos/owner1/repo1',
				title: 'Fix bug',
				labels: [],
			},
		];

		const issueItems = [
			{
				repository_url: 'https://api.github.com/repos/owner2/repo2',
				title: 'Feature request',
				labels: [],
			},
		];

		let searchCallCount = 0;
		globalThis.fetch.mockImplementation(async (url) => {
			const urlStr = url.toString();
			if (urlStr.includes('users/testuser')) {
				return {
					ok: true,
					json: async () => ({ name: 'Test User' }),
				};
			}
			if (urlStr.includes('search/issues')) {
				searchCallCount++;
				if (urlStr.includes('is:pr')) {
					return { ok: true, json: async () => ({ items: prItems }) };
				}
				if (urlStr.includes('is:issue')) {
					return { ok: true, json: async () => ({ items: issueItems }) };
				}
			}
			if (urlStr.includes('api.github.com/graphql')) {
				return {
					ok: true,
					json: async () => ({
						data: {
							repo0: { stargazerCount: 100, owner: { avatarUrl: 'https://example.com/avatar.png' } },
							repo1: { stargazerCount: 50, owner: { avatarUrl: 'https://example.com/avatar.png' } },
						},
					}),
				};
			}
			if (urlStr.includes('.png')) {
				return { ok: true, arrayBuffer: async () => new ArrayBuffer(10) };
			}
			return { ok: false };
		});

		const request = new Request(`http://example.com/?type=repos&username=${username}&prs=true&issues=true`);
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);

		// Should make 2 search calls: one for PRs, one for issues
		expect(searchCallCount).toBe(2);
		expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
	});

	it('fetches only issues when issues=true and prs is not set', async () => {
		const username = 'testuser';

		const issueItems = [
			{
				repository_url: 'https://api.github.com/repos/owner1/repo1',
				title: 'Bug report',
				labels: [],
			},
		];

		let prSearchCalled = false;
		let issueSearchCalled = false;

		globalThis.fetch.mockImplementation(async (url) => {
			const urlStr = url.toString();
			if (urlStr.includes('users/testuser')) {
				return { ok: true, json: async () => ({ name: 'Test User' }) };
			}
			if (urlStr.includes('search/issues')) {
				if (urlStr.includes('is:pr')) {
					prSearchCalled = true;
					return { ok: true, json: async () => ({ items: [] }) };
				}
				if (urlStr.includes('is:issue')) {
					issueSearchCalled = true;
					return { ok: true, json: async () => ({ items: issueItems }) };
				}
			}
			if (urlStr.includes('api.github.com/graphql')) {
				return {
					ok: true,
					json: async () => ({
						data: {
							repo0: { stargazerCount: 100, owner: { avatarUrl: 'https://example.com/avatar.png' } },
						},
					}),
				};
			}
			if (urlStr.includes('.png')) {
				return { ok: true, arrayBuffer: async () => new ArrayBuffer(10) };
			}
			return { ok: false };
		});

		const request = new Request(`http://example.com/?type=repos&username=${username}&issues=true`);
		const ctx = createExecutionContext();
		await worker.fetch(request, env, ctx);

		expect(prSearchCalled).toBe(false);
		expect(issueSearchCalled).toBe(true);
	});
});
