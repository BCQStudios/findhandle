import { handleCheck } from './lib/check';

export default {
	async fetch(request: Request) {
		const url = new URL(request.url);
		if (url.pathname === '/api/check') return handleCheck(url);
		if (url.pathname === '/api/search') {
			const handle = (url.searchParams.get('handle') ?? '').trim().replace(/^@+/, '').toLowerCase();
			if (handle) {
				console.log(handle, {
					event: 'search',
					country: (request as { cf?: { country?: string } }).cf?.country ?? 'unknown',
				});
			}
			return new Response(null, { status: 204 });
		}
		return new Response(null, { status: 404 });
	},
};
