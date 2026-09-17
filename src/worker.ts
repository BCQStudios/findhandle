import { handleCheck } from './lib/check';

export default {
	async fetch(request: Request) {
		const url = new URL(request.url);
		if (url.pathname === '/api/check') return handleCheck(url);
		if (url.pathname !== '/api/search') return new Response(null, { status: 404 });

		const handle = (url.searchParams.get('handle') ?? '').trim().replace(/^@+/, '').toLowerCase();
		if (handle) {
			const country = (request as { cf?: { country?: string } }).cf?.country ?? 'unknown';
			console.log({ event: 'search', handle, country });
		}

		return new Response(null, { status: 204 });
	},
};
