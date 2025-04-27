import { handleClicksRequest, handleConversionsRequest, handleSubaffiliateSummaryRequest } from './affluentEndpoint.js';
import { handleSQLRequest, handleRawSQLRequest, handleOptions } from './SQL.js';
import { 
  handleCampaignsList, 
  handleCampaignRefreshLink, 
  handleCampaignStats, 
  handleCampaignThresholdUpdate,
  handleCampaignCreate,
  handleCampaignEdit,
  handleCampaignDelete
} from './campaignHandler.js';
import {
  handleTemplatesList,
  handleTemplateDetail,
  handleTemplateCreate,
  handleTemplateEdit,
  handleTemplateDelete,
  handleTemplateUsageCheck
} from './templatesHandler.js';
import {
  handleShopifyStoresList,
  handleShopifyStoreDetail,
  handleShopifyStoreTest,
  handleShopifyStoreAdd,
  handleShopifyStoreEdit,
  handleShopifyStoreDelete,
  handleShopifyStoreUsageCheck
} from './shopifyHandler.js';
import {
  handleDashboardData,
  handleSettingsUpdate
} from './dashboardHandler.js';

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		
		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return handleOptions();
		}

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
		
		// Handle SQL CRUD operations
		if (url.pathname.startsWith('/api/sql/')) {
			return handleSQLRequest(request, env.DB);
		}
		
		// Handle raw SQL queries
		if (url.pathname === '/api/rawsql') {
			return handleRawSQLRequest(request, env.DB);
		}
		
		// Dashboard routes
		if (url.pathname === '/api/dashboard') {
			return handleDashboardData(request, env);
		}
		
		if (url.pathname === '/api/settings/update') {
			return handleSettingsUpdate(request, env);
		}
		
		// Campaign management routes
		if (url.pathname === '/api/campaigns') {
			return handleCampaignsList(request, env);
		}

		if (url.pathname === '/api/campaigns/refresh') {
			return handleCampaignRefreshLink(request, env);
		}

		if (url.pathname === '/api/campaigns/stats') {
			return handleCampaignStats(request, env);
		}

		if (url.pathname === '/api/campaigns/update-threshold') {
			return handleCampaignThresholdUpdate(request, env);
		}

		if (url.pathname === '/api/campaigns/create') {
			return handleCampaignCreate(request, env);
		}

		if (url.pathname === '/api/campaigns/edit') {
			return handleCampaignEdit(request, env);
		}

		if (url.pathname === '/api/campaigns/delete') {
			return handleCampaignDelete(request, env);
		}
		
		// Template management routes
		if (url.pathname === '/api/templates') {
			return handleTemplatesList(request, env);
		}
		
		if (url.pathname === '/api/templates/detail') {
			return handleTemplateDetail(request, env);
		}
		
		if (url.pathname === '/api/templates/create') {
			return handleTemplateCreate(request, env);
		}
		
		if (url.pathname === '/api/templates/edit') {
			return handleTemplateEdit(request, env);
		}
		
		if (url.pathname === '/api/templates/delete') {
			return handleTemplateDelete(request, env);
		}
		
		if (url.pathname === '/api/templates/usage') {
			return handleTemplateUsageCheck(request, env);
		}
		
		// Shopify store management routes
		if (url.pathname === '/api/shopify') {
			return handleShopifyStoresList(request, env);
		}
		
		if (url.pathname === '/api/shopify/detail') {
			return handleShopifyStoreDetail(request, env);
		}
		
		if (url.pathname === '/api/shopify/test') {
			return handleShopifyStoreTest(request, env);
		}
		
		if (url.pathname === '/api/shopify/add') {
			return handleShopifyStoreAdd(request, env);
		}
		
		if (url.pathname === '/api/shopify/edit') {
			return handleShopifyStoreEdit(request, env);
		}
		
		if (url.pathname === '/api/shopify/delete') {
			return handleShopifyStoreDelete(request, env);
		}
		
		if (url.pathname === '/api/shopify/usage') {
			return handleShopifyStoreUsageCheck(request, env);
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