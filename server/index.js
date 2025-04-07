import { handleClicksRequest } from './affluentEndpoint.js';

export default {
	async fetch(request) {
		const url = new URL(request.url);

		// Handle Affluent API clicks endpoint
		if (url.pathname === '/api/clicks') {
			return handleClicksRequest(request);
		}
		
		// Original API endpoint
		if (url.pathname.startsWith('/api/')) {
			return Response.json({
				name: 'Cloudflare',
			});
		}

		// Handle 404 for any other routes
		return new Response('Not Found', { status: 404 });
	},
};