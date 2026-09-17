import { handleCheck } from './lib/check';

type Env = {
	SEARCHES: {
		writeDataPoint(point: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
	};
};

export default {
	async fetch(request: Request, env: Env) {
		const url = new URL(request.url);
		if (url.pathname === '/api/check') return handleCheck(url);
		if (url.pathname !== '/api/search') return new Response(null, { status: 404 });

		const handle = (url.searchParams.get('handle') ?? '').trim().replace(/^@+/, '').toLowerCase();
		if (handle) {
			const country = (request as { cf?: { country?: string } }).cf?.country ?? 'unknown';
			env.SEARCHES.writeDataPoint({
				blobs: [handle, country],
				doubles: [1],
				indexes: [handle],
			});
		}

		return new Response(null, { status: 204 });
	},
};
