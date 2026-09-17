// @ts-check
import { defineConfig } from 'astro/config';
import { handleCheck } from './src/lib/check.ts';

export default defineConfig({
	site: 'https://www.findhandle.com',
	integrations: [
		{
			name: 'api-check',
			hooks: {
				'astro:server:setup'({ server }) {
					server.middlewares.use(async (req, res, next) => {
						const href = 'url' in req && typeof req.url === 'string' ? req.url : '/';
						const url = new URL(href, 'http://dev.local');
						if (url.pathname === '/api/search') {
							res.statusCode = 204;
							res.end();
							return;
						}

						if (url.pathname !== '/api/check') {
							next();
							return;
						}

						const response = await handleCheck(url);
						res.statusCode = response.status;
						for (const [key, value] of response.headers) res.setHeader(key, value);
						res.end(await response.text());
					});
				},
			},
		},
	],
});
