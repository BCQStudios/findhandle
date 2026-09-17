import type { APIRoute } from 'astro';
import { checkPlatforms, isPlatformId, normalizeHandle, PLATFORM_IDS } from '../../lib/check';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const handle = normalizeHandle(url.searchParams.get('handle') ?? '');
	const platform = url.searchParams.get('platform') ?? '';

	if (!handle) {
		return json({ error: 'Enter a handle.' }, 400);
	}

	if (!/^[a-z0-9._-]+$/.test(handle)) {
		return json({ error: 'Use letters, numbers, periods, underscores, or hyphens.' }, 400);
	}

	if (platform && !isPlatformId(platform)) {
		return json({ error: 'Unknown platform.' }, 400);
	}

	const results = await checkPlatforms(handle, isPlatformId(platform) ? [platform] : [...PLATFORM_IDS]);
	return json({ handle, results });
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
