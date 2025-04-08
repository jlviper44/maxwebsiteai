import { handleClicksRequest, handleConversionsRequest, handleSubaffiliateSummaryRequest } from './affluentEndpoint.js';

export default {
	async fetch(request) {
		const url = new URL(request.url);

		// Handle Affluent API clicks endpoint
		if (url.pathname === '/api/clicks') {
			return handleClicksRequest(request);
		}
		
		// Handle Affluent API conversions endpoint
		if (url.pathname === '/api/conversions') {
			return handleConversionsRequest(request);
		}

    if (url.pathname === '/api/subaffiliatesummary') {
			return handleSubaffiliateSummaryRequest(request);
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