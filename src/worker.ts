import { handleCheck } from './lib/check';

export default {
	async fetch(request: Request) {
		const url = new URL(request.url);
		if (url.pathname === '/api/check') return handleCheck(url);
		return new Response(null, { status: 404 });
	},
};
