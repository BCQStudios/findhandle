import type { APIRoute } from 'astro';
import { checkPlatform, checkTld, isPlatformId, isTldId } from '../../lib/check';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const handle = (url.searchParams.get('handle') ?? '').trim().replace(/^@+/, '').toLowerCase();
	const platform = url.searchParams.get('platform') ?? '';
	const tld = url.searchParams.get('tld') ?? '';

	if (!handle) {
		return json({ error: 'Enter a handle.' }, 400);
	}

	if (!/^[a-z0-9._-]+$/.test(handle)) {
		return json({ error: 'Use letters, numbers, periods, underscores, or hyphens.' }, 400);
	}

	if (isTldId(tld)) return json(await checkTld(handle, tld));
	if (isPlatformId(platform)) return json(await checkPlatform(handle, platform));
	return json({ error: tld ? 'Unknown TLD.' : 'Unknown platform.' }, 400);
};

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
		},
	});
}
