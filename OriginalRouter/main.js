/**
 * Admin Panel Worker
 * Handles the admin interface for managing campaigns, templates, and Shopify stores
 */

// Main request handler
addEventListener('fetch', event => {
  event.respondWith(
    handleRequest(event.request)
      .catch(err => {
        console.error('Unhandled error:', err);
        return renderErrorPage(`Server Error: ${err.message}`, 500);
      })
  );
});

/**
 * Main request router - Updated with no double confirmation
 */
async function handleRequest(request) {
  try {
    const url = new URL(request.url);
    
    // Log request
    console.log(`Request: ${url.pathname} [${request.method}]`);
    
    // Initialize system if needed
    if (url.pathname === '/init') {
      return await initializeSystem(request);
    }
    
    // Check auth for all routes except assets and health
    const requiresAuth = 
      !url.pathname.endsWith('.css') && 
      !url.pathname.endsWith('.js') && 
      url.pathname !== '/health';
    
    if (requiresAuth && !await isAuthenticated(request)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' }
      });
    }
    
    // Route to appropriate handler
    if (url.pathname === '/health') {
      return createJsonResponse({ status: 'ok', service: 'admin-panel' });
    }
    else if (url.pathname === '/' || url.pathname === '') {
      return await renderDashboard();
    }
    // Campaign routes
    else if (url.pathname === '/campaigns' || url.pathname === '/campaigns/') {
      return await renderCampaignsList();
    }
    else if (url.pathname === '/campaigns/create') {
      return await handleCampaignCreate(request);
    }
    else if (url.pathname === '/campaigns/edit') {
      return await handleCampaignEdit(request);
    }
    else if (url.pathname === '/campaigns/delete') {
      return await handleCampaignDelete(request);
    }
    else if (url.pathname === '/campaigns/stats') {
      return await renderCampaignStats(request);
    }
    else if (url.pathname === '/campaigns/update-threshold') {
      return await handleCampaignThresholdUpdate(request);
    }
    else if (url.pathname === '/campaigns/refresh-link') {
      return await handleCampaignRefreshLink(request);
    }
    // Template routes
    else if (url.pathname === '/templates' || url.pathname === '/templates/') {
      return await renderTemplatesList();
    }
    else if (url.pathname === '/templates/create') {
      return await handleTemplateCreate(request);
    }
    else if (url.pathname === '/templates/edit') {
      return await handleTemplateEdit(request);
    }
    else if (url.pathname === '/templates/delete') {
      return await handleTemplateDelete(request);
    }
    // Shopify routes
    else if (url.pathname === '/shopify' || url.pathname === '/shopify/') {
      return await renderShopifyStoresList();
    }
    else if (url.pathname === '/shopify/add') {
      return await handleShopifyStoreAdd(request);
    }
    else if (url.pathname === '/shopify/edit') {
      return await handleShopifyStoreEdit(request);
    }
    else if (url.pathname === '/shopify/delete') {
      return await handleShopifyStoreDelete(request);
    }
    else if (url.pathname === '/shopify/test') {
      return await handleShopifyStoreTest(request);
    }
    // Settings routes
    else if (url.pathname === '/settings') {
      return await renderSettings();
    }
    else if (url.pathname === '/settings/update') {
      return await handleSettingsUpdate(request);
    }
    // Asset routes
    else if (url.pathname === '/admin.css') {
      return serveAdminCSS();
    }
    else if (url.pathname === '/admin.js') {
      return serveAdminJS();
    }
    // Default - not found
    else {
      return renderErrorPage('Page not found', 404);
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return renderErrorPage(`Error: ${error.message}`, 500);
  }
}