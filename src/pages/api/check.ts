import type { APIRoute } from 'astro';
import { checkPlatform, checkTld, PLATFORMS, TLDS, type Platform, type Tld } from '../../lib/check';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const handle = (url.searchParams.get('handle') ?? '').trim().replace(/^@+/, '').toLowerCase();
	const platform = url.searchParams.get('platform');
	const tld = url.searchParams.get('tld');

	const data = TLDS.includes(tld as Tld)
		? await checkTld(handle, tld as Tld)
		: PLATFORMS.includes(platform as Platform)
			? await checkPlatform(handle, platform as Platform)
			: { status: 'unknown', url: '' };

	return new Response(JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
		},
	});
};
