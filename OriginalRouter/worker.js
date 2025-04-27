/**
 * Admin Panel Worker
 * Handles the admin interface for managing campaigns, templates, and Shopify stores
 */

// Configuration
const CONFIG = {
  // Admin credentials
  ADMIN: {
    USERNAME: 'admin',
    PASSWORD: 'securepassword'  // Change this to a strong password
  },
  
  // API keys for worker communication
  API_KEYS: {
    ROUTER: 'your-router-api-key',
    SHOPIFY: 'your-shopify-api-key'
  },
  
  // Worker URLs
  WORKER_URLS: {
    ROUTER: 'https://shopifyrouter.millianfreakyads.workers.dev',
    SHOPIFY: 'https://shopifyapi.millianfreakyads.workers.dev'
  },
  
  // Available regions for targeting
  REGIONS: ['US', 'CA', 'GB', 'AU']
};

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

/**
 * Initialize system
 */
async function initializeSystem() {
  try {
    // Initialize settings
    await SETTINGS.put('tikTokRoutingEnabled', 'true');
    
    // Test KV namespaces
    try {
      await CAMPAIGNS.put('test', 'ok');
      await TEMPLATES.put('test', 'ok');
      await SETTINGS.put('test', 'ok');
    } catch (kvError) {
      return renderErrorPage(`KV initialization error: ${kvError.message}`, 500);
    }
    
    // Initialize Shopify API Worker
    try {
      const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/init`, {
        headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
      });
      
      if (!response.ok) {
        throw new Error(`Shopify API initialization failed: ${await response.text()}`);
      }
    } catch (shopifyError) {
      return renderErrorPage(`Shopify API initialization error: ${shopifyError.message}`, 500);
    }
    
    // Initialize Router Worker
    try {
      const response = await fetch(`${CONFIG.WORKER_URLS.ROUTER}/api/init`, {
        headers: { 'X-API-Key': CONFIG.API_KEYS.ROUTER }
      });
      
      if (!response.ok) {
        throw new Error(`Router initialization failed: ${await response.text()}`);
      }
    } catch (routerError) {
      return renderErrorPage(`Router initialization error: ${routerError.message}`, 500);
    }
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>System Initialized</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/admin.css">
      </head>
      <body>
        <div class="container">
          <h1>System Initialized Successfully</h1>
          
          <div class="card">
            <h2>Initialization Complete</h2>
            <p>The TikTok Campaign System has been successfully initialized.</p>
            <a href="/" class="button">Go to Dashboard</a>
          </div>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Error in initialization:', error);
    return renderErrorPage(`Error initializing system: ${error.message}`, 500);
  }
}

/**
 * Check if the request has valid authentication
 */
async function isAuthenticated(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return false;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Basic') {
    return false;
  }
  
  try {
    const decoded = atob(parts[1]);
    const [username, password] = decoded.split(':');
    
    return username === CONFIG.ADMIN.USERNAME && password === CONFIG.ADMIN.PASSWORD;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}


/**
 * Generate a CSRF token with longer expiration time (24 hours instead of 1 hour)
 */
async function generateCsrfToken() {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  const token = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
  
  await SETTINGS.put(`csrf:${token}`, JSON.stringify({
    created: Date.now(),
    expires: Date.now() + 24 * 3600 * 1000 // 24 hours instead of 1 hour
  }), { expirationTtl: 86400 }); // 24 hours in seconds
  
  return token;
}

/**
 * Validate a CSRF token - with modified validation logic to be more forgiving
 */
async function validateCsrfToken(token) {
  if (!token) return false;
  
  try {
    const tokenData = await SETTINGS.get(`csrf:${token}`);
    
    if (!tokenData) {
      return false;
    }
    
    // Parse the token data
    const data = JSON.parse(tokenData);
    
    // More lenient validation - if token exists, it's likely valid
    if (data) {
      // Only delete token if it's actually expired
      if (data.expires <= Date.now()) {
        await SETTINGS.delete(`csrf:${token}`);
        return false;
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}

/**
 * Dashboard page
 */
async function renderDashboard() {
  try {
    // Get global traffic routing status
    const tikTokRoutingEnabled = await SETTINGS.get('tikTokRoutingEnabled') === 'true';
    
    // Get stats
    const campaigns = await getAllCampaigns();
    const templates = await getAllTemplates();
    
    // Get all Shopify stores
    const stores = await fetchShopifyStores();
    
    // Generate CSRF token
    const csrfToken = await generateCsrfToken();
    
    // Calculate statistics
    const activeCampaigns = campaigns.filter(c => c.active !== false).length;
    
    // Calculate total TikTok clicks and non-TikTok clicks
    let totalTikTokClicks = 0;
    let totalNonTikTokClicks = 0;
    
    for (const campaign of campaigns) {
      if (campaign.stats) {
        totalTikTokClicks += campaign.stats.tiktok || 0;
        totalNonTikTokClicks += campaign.stats.nonTiktok || 0;
      }
    }
    
    const totalClicks = totalTikTokClicks + totalNonTikTokClicks;
    let conversionRate = 0;
    if (totalClicks > 0) {
      conversionRate = ((totalTikTokClicks / totalClicks) * 100).toFixed(1);
    }
    
    return renderPage('Dashboard', `
      <div class="grid-2">
        <div class="card">
          <h2>Global Settings</h2>
          <form action="/settings/update" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            <div class="form-group">
              <label class="toggle-label">
                TikTok Traffic Routing
                <div class="toggle-switch">
                  <input type="checkbox" name="tikTokRoutingEnabled" ${tikTokRoutingEnabled ? 'checked' : ''}>
                  <span class="slider"></span>
                </div>
                <span class="status-text ${tikTokRoutingEnabled ? 'enabled' : 'disabled'}">
                  ${tikTokRoutingEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
              <div class="form-hint">When enabled, TikTok traffic will be automatically detected and routed.</div>
            </div>
            <button type="submit" class="button">Save Settings</button>
          </form>
        </div>
        
        <div class="card">
          <h2>Quick Stats</h2>
          <div class="stats-grid">
            <div class="stats-item">
              <div class="stats-value">${campaigns.length}</div>
              <div class="stats-label">Total Campaigns</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">${activeCampaigns}</div>
              <div class="stats-label">Active Campaigns</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">${templates.length}</div>
              <div class="stats-label">Templates</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">${stores.length}</div>
              <div class="stats-label">Shopify Stores</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h2>Traffic Overview</h2>
        <div class="stats-grid">
          <div class="stats-item">
            <div class="stats-value">${totalTikTokClicks}</div>
            <div class="stats-label">TikTok Clicks</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">${totalNonTikTokClicks}</div>
            <div class="stats-label">Non-TikTok Clicks</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">${totalClicks}</div>
            <div class="stats-label">Total Clicks</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">${conversionRate}%</div>
            <div class="stats-label">TikTok Percentage</div>
          </div>
        </div>
      </div>
      
      <div class="grid-3">
        <div class="card action-card">
          <h2>Campaigns</h2>
          <p>Manage your TikTok traffic campaigns. Create new campaigns, edit existing ones, or view statistics.</p>
          <a href="/campaigns" class="button button-full">Manage Campaigns</a>
        </div>
        
        <div class="card action-card">
          <h2>Templates</h2>
          <p>Manage HTML templates or Google Form redirects that are used in your campaigns.</p>
          <a href="/templates" class="button button-full">Manage Templates</a>
        </div>
        
        <div class="card action-card">
          <h2>Shopify Stores</h2>
          <p>Connect and manage your Shopify stores to create cloaked pages automatically.</p>
          <a href="/shopify" class="button button-full">Manage Shopify Stores</a>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    return renderErrorPage(`Error: ${error.message}`, 500);
  }
}

/**
 * Render the campaigns list page - FIXED VERSION
 */
async function renderCampaignsList() {
  try {
    const campaigns = await getAllCampaigns();
    
    let campaignsContent = '';
    
    if (campaigns.length === 0) {
      campaignsContent = `
        <div class="empty-state">
          <p>No campaigns found. Create your first campaign to get started.</p>
        </div>
      `;
    } else {
      campaignsContent = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Copy   Refresh Link</th>
              <th>Redirect Domain</th>
              <th>Traffic Routing</th>
              <th>TikTok Clicks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${campaigns.map(campaign => {
              const tiktokStats = campaign.stats?.tiktok || 0;
              const nonTiktokStats = campaign.stats?.nonTiktok || 0;
              const totalClicks = tiktokStats + nonTiktokStats;
              let clickRate = 0;
              if (totalClicks > 0) {
                clickRate = ((tiktokStats / totalClicks) * 100).toFixed(1);
              }
              
              // FIXED: Get template to check if it's a Google Form
              let isGoogleForm = campaign.isDirectGoogleForm || false;
              let campaignLink = '';
              
              // If it's a Google Form, we'll use the Router's googleform endpoint
              if (isGoogleForm) {
                campaignLink = `${CONFIG.WORKER_URLS.ROUTER}/googleform/${campaign.templateId}`;
              }
              // Otherwise fall back to normal Shopify page or router URLs
              else if (campaign.shopifyPage && campaign.shopifyPage.fullUrl) {
                campaignLink = campaign.shopifyPage.fullUrl;
              } else if (campaign.redirectDomain) {
                campaignLink = `${campaign.redirectDomain}/${campaign.subid}`;
              } else {
                campaignLink = `${CONFIG.WORKER_URLS.ROUTER}/${campaign.subid}`;
              }

              // Format redirect domain
              const redirectDomain = campaign.redirectDomain ? 
                campaign.redirectDomain.replace('https://', '') : 'Random';
              
              return `
                <tr>
                  <td>${campaign.name}</td>
                  <td>
                    <span class="status-badge ${campaign.active ? 'active' : 'inactive'}">
                      ${campaign.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div class="link-actions">
                      <span class="copy-url action-btn" data-url="${campaignLink}">Copy</span>
                      <span class="refresh-link action-btn" data-campaign-id="${campaign.id}">Refresh</span>
                    </div>
                  </td>
                  <td>${redirectDomain}</td>
                  <td>
                    <span class="status-text ${campaign.tikTokRoutingEnabled ? 'enabled' : 'disabled'}">
                      ${campaign.tikTokRoutingEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>${tiktokStats} (${clickRate}%)</td>
                  <td>
                    <div class="action-buttons">
                      <a href="/campaigns/edit?id=${campaign.id}" class="action-btn edit-btn">Edit</a>
                      <a href="/campaigns/stats?id=${campaign.id}" class="action-btn stats-btn">Stats</a>
                      <a href="/campaigns/delete?id=${campaign.id}" class="action-btn delete-btn">Delete</a>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
    
    return renderPage('Campaigns', `
      <div class="button-group">
        <a href="/campaigns/create" class="button">Create New Campaign</a>
      </div>
      
      <div class="card">
        <h2>Your Campaigns</h2>
        ${campaignsContent}
      </div>
    `);
  } catch (error) {
    console.error('Error rendering campaigns list:', error);
    return renderErrorPage(`Error: ${error.message}`, 500);
  }
}

/**
 * Handle campaign refreshing - with improved error handling
 */
async function handleCampaignRefreshLink(request) {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return createJsonResponse({ 
        success: false, 
        error: 'Method not allowed' 
      }, 405);
    }
    
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('id');
    
    if (!campaignId) {
      return createJsonResponse({ 
        success: false, 
        error: 'Campaign ID is required' 
      }, 400);
    }
    
    // Get form data for CSRF token
    let csrfToken = '';
    const contentType = request.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      const requestData = await request.json();
      csrfToken = requestData.csrf_token || '';
    } else {
      try {
        const formData = await request.formData();
        csrfToken = formData.get('csrf_token') || '';
      } catch (e) {
        // If not form data or JSON, check header
        csrfToken = request.headers.get('X-CSRF-Token') || '';
      }
    }
    
    // CSRF validation can be enabled for production
    // if (!await validateCsrfToken(csrfToken)) {
    //   return createJsonResponse({ 
    //     success: false, 
    //     error: 'Invalid or expired CSRF token' 
    //   }, 403);
    // }
    
    // Get the campaign
    const campaign = await CAMPAIGNS.get(`campaign:${campaignId}`, { type: 'json' });
    
    if (!campaign) {
      return createJsonResponse({ 
        success: false, 
        error: 'Campaign not found' 
      }, 404);
    }
    
    // Generate a new subdomain or path component
    const newSubid = generateRandomString(12);
    campaign.subid = newSubid;
    
    // Update the Shopify page if it exists
    if (campaign.shopifyStoreId && campaign.shopifyPage) {
      try {
        console.log(`Attempting to update Shopify page for campaign ${campaignId}`);
        
        // Check if we can connect to the Shopify API Worker
        const healthCheck = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/health`, {
          headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
        }).catch(e => null);
        
        if (!healthCheck || !healthCheck.ok) {
          console.warn(`Shopify API Worker not available, skipping page update`);
          // Continue without trying to update the Shopify page
        } else {
          // The API is available, try to update the page
          // Get default affiliate link (for API compatibility)
          const geoLinks = campaign.geoLinks || {};
          const firstGeoRegion = Object.keys(geoLinks)[0];
          const affiliateLink = geoLinks[firstGeoRegion] || campaign.affiliateLink;
          
          const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/pages/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': CONFIG.API_KEYS.SHOPIFY
            },
            body: JSON.stringify({
              storeId: campaign.shopifyStoreId,
              campaignId: campaign.id,
              pageId: campaign.shopifyPage.id,
              subid: newSubid,
              affiliateLink: affiliateLink, // Include for API compatibility
              geoLinks: campaign.geoLinks,
              redirectDomain: campaign.redirectDomain
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Shopify page update failed: ${errorText}`);
            
            // Log the error but don't block the refresh
            // This allows the local campaign to update even if Shopify API fails
          } else {
            const responseData = await response.json();
            
            // Update the Shopify page info in the campaign
            campaign.shopifyPage = responseData.page;
            console.log(`Successfully updated Shopify page for campaign ${campaignId}`);
          }
        }
      } catch (error) {
        console.error('Error updating Shopify page:', error);
        // Log the error but don't block the refresh
        // We'll still update the local campaign data
      }
    }
    
    // Save the updated campaign
    await CAMPAIGNS.put(`campaign:${campaignId}`, JSON.stringify(campaign));
    console.log(`Campaign ${campaignId} updated with new subid: ${newSubid}`);
    
    // Return the new URL
    let newUrl = '';
    if (campaign.shopifyPage && campaign.shopifyPage.fullUrl) {
      newUrl = campaign.shopifyPage.fullUrl;
    } else if (campaign.redirectDomain) {
      newUrl = `${campaign.redirectDomain}/${newSubid}`;
    } else {
      newUrl = `/campaigns/link/${campaign.id}`;
    }
    
    return createJsonResponse({ 
      success: true, 
      message: "Campaign link refreshed successfully",
      campaign: campaignId, 
      newUrl: newUrl 
    });
  } catch (error) {
    console.error('Error refreshing campaign link:', error);
    return createJsonResponse({ 
      success: false, 
      error: `Error refreshing campaign link: ${error.message}` 
    }, 500);
  }
}


/**
 * Render the campaign statistics page with adjustable whitehat threshold
 */
async function renderCampaignStats(request) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('id');
    
    if (!campaignId) {
      return Response.redirect(getRedirectUrl(request, '/campaigns'), 302);
    }
    
    // Get the campaign
    const campaign = await CAMPAIGNS.get(`campaign:${campaignId}`, { type: 'json' });
    
    if (!campaign) {
      return renderErrorPage(`Campaign with ID ${campaignId} not found`, 404);
    }
    
    // Get campaign stats
    let stats = await CAMPAIGNS.get(`stats:${campaignId}`, { type: 'json' }).catch(() => null);
    
    // If stats don't exist, create empty stats
    if (!stats) {
      stats = {
        tiktok: 0,
        nonTiktok: 0,
        visits: 0,
        lastVisit: 0
      };
    }
    
    // Get or set the whitehat threshold for this campaign
    // Default to 1 if not set
    if (!campaign.whitehatThreshold) {
      campaign.whitehatThreshold = 1;
      // Save the default threshold
      await CAMPAIGNS.put(`campaign:${campaignId}`, JSON.stringify(campaign));
    }
    
    // Calculate percentages and other stats
    const totalClicks = stats.tiktok + stats.nonTiktok;
    let tiktokPercentage = 0;
    let nonTiktokPercentage = 0;
    
    if (totalClicks > 0) {
      tiktokPercentage = ((stats.tiktok / totalClicks) * 100).toFixed(1);
      nonTiktokPercentage = ((stats.nonTiktok / totalClicks) * 100).toFixed(1);
    }
    
    // Determine whitehat status
    const remainingWhitehatClicks = Math.max(0, campaign.whitehatThreshold - totalClicks);
    const isWhitehatActive = remainingWhitehatClicks > 0;
    
    // Format dates
    const lastVisitDate = stats.lastVisit ? new Date(stats.lastVisit).toLocaleString() : 'Never';
    const createdDate = campaign.created ? new Date(campaign.created).toLocaleString() : 'Unknown';
    
    // Get template info
    let templateName = 'Unknown';
    let templateType = 'Unknown';
    
    if (campaign.templateId) {
      const template = await getTemplate(campaign.templateId);
      if (template) {
        templateName = template.name;
        templateType = template.type;
      }
    }
    
    // Get whitehat template info if available
    let whitehatTemplateName = 'None';
    if (campaign.whitehatBehavior === 'template' && campaign.whitehatTemplateId) {
      const whitehatTemplate = await getTemplate(campaign.whitehatTemplateId);
      if (whitehatTemplate) {
        whitehatTemplateName = whitehatTemplate.name;
      }
    } else if (campaign.whitehatBehavior === 'redirect') {
      whitehatTemplateName = 'Redirect to URL';
    } else {
      whitehatTemplateName = '404 Page';
    }
    
    // Get landing page URL
    let landingPageUrl = '';
    if (campaign.shopifyPage && campaign.shopifyPage.fullUrl) {
      landingPageUrl = campaign.shopifyPage.fullUrl;
    } else if (campaign.redirectDomain) {
      landingPageUrl = `${campaign.redirectDomain}/${campaign.subid}`;
    } else {
      landingPageUrl = `${CONFIG.WORKER_URLS.ROUTER}/${campaign.subid}`;
    }
    
    // Generate CSRF token for refresh link and threshold update
    const csrfToken = await generateCsrfToken();
    
    return renderPage('Campaign Statistics', `
      <div class="card">
        <h2>Statistics for: ${campaign.name}</h2>
        
        <div class="detail-group">
          <div class="detail-label">Campaign Status</div>
          <div class="detail-value">
            <span class="status-badge ${campaign.active ? 'active' : 'inactive'}">
              ${campaign.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Campaign ID</div>
          <div class="detail-value">${campaign.id}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Landing Page</div>
          <div class="detail-value">
            <div class="link-actions">
              <span class="copy-url action-btn" data-url="${landingPageUrl}">Copy URL</span>
              <span class="refresh-link action-btn" data-campaign-id="${campaign.id}">Refresh Link</span>
            </div>
          </div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Created</div>
          <div class="detail-value">${createdDate}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Last Visit</div>
          <div class="detail-value">${lastVisitDate}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Template</div>
          <div class="detail-value">${templateName} (${templateType})</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Whitehat Template</div>
          <div class="detail-value">${whitehatTemplateName}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">TikTok Routing</div>
          <div class="detail-value">
            <span class="status-text ${campaign.tikTokRoutingEnabled ? 'enabled' : 'disabled'}">
              ${campaign.tikTokRoutingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
        
        <!-- NEW: Whitehat Threshold Setting -->
        <div class="detail-group">
          <div class="detail-label">Whitehat Threshold</div>
          <div class="detail-value">
            <form action="/campaigns/update-threshold" method="POST" class="inline-form">
              <input type="hidden" name="csrf_token" value="${csrfToken}">
              <input type="hidden" name="campaignId" value="${campaign.id}">
              <input type="number" name="whitehatThreshold" value="${campaign.whitehatThreshold}" min="0" max="1000" class="small-input" required>
              <button type="submit" class="small-button">Update</button>
              <div class="form-hint">
                First <strong>${campaign.whitehatThreshold}</strong> clicks will see whitehat content regardless of traffic source.
                <span class="status-badge ${isWhitehatActive ? 'active' : 'inactive'}">
                  ${isWhitehatActive ? `Active (${remainingWhitehatClicks} left)` : 'Inactive (threshold reached)'}
                </span>
              </div>
            </form>
          </div>
        </div>
        
        <div class="section-divider">
          <h3>Traffic Statistics</h3>
        </div>
        
        <div class="stats-grid">
          <div class="stats-item">
            <div class="stats-value">${stats.tiktok}</div>
            <div class="stats-label">TikTok Clicks</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">${stats.nonTiktok}</div>
            <div class="stats-label">Non-TikTok Clicks</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">${totalClicks}</div>
            <div class="stats-label">Total Clicks</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">${tiktokPercentage}%</div>
            <div class="stats-label">TikTok Percentage</div>
          </div>
        </div>
        
        <!-- Traffic chart visualization -->
        <div class="chart-container">
          <div class="chart">
            <div class="chart-bar tiktok-bar" style="width: ${tiktokPercentage}%;">
              <span class="chart-label">TikTok</span>
              <span class="chart-value">${stats.tiktok} (${tiktokPercentage}%)</span>
            </div>
            <div class="chart-bar non-tiktok-bar" style="width: ${nonTiktokPercentage}%;">
              <span class="chart-label">Non-TikTok</span>
              <span class="chart-value">${stats.nonTiktok} (${nonTiktokPercentage}%)</span>
            </div>
          </div>
        </div>
        
        <div class="button-group">
          <a href="/campaigns/edit?id=${campaign.id}" class="button">Edit Campaign</a>
          <a href="/campaigns" class="back-link">← Back to Campaigns</a>
        </div>
      </div>
      
      <style>
        .chart-container {
          margin: 20px 0;
        }
        
        .chart {
          width: 100%;
          background-color: #f5f5f5;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .chart-bar {
          height: 40px;
          line-height: 40px;
          color: white;
          padding: 0 10px;
          position: relative;
          min-width: 40px;
        }
        
        .tiktok-bar {
          background-color: #3498db;
        }
        
        .non-tiktok-bar {
          background-color: #e74c3c;
        }
        
        .chart-label {
          font-weight: bold;
        }
        
        .chart-value {
          position: absolute;
          right: 10px;
        }
        
        .detail-group {
          display: flex;
          margin-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 12px;
        }
        
        .detail-label {
          flex: 0 0 150px;
          font-weight: bold;
        }
        
        .detail-value {
          flex: 1;
        }
        
        .inline-form {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 5px;
        }
        
        .small-input {
          width: 70px;
          padding: 5px;
          border: 1px solid #ccc;
          border-radius: 3px;
        }
        
        .small-button {
          padding: 5px 10px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
        
        .small-button:hover {
          background-color: #2980b9;
        }
      </style>
    `);
  } catch (error) {
    console.error('Error rendering campaign stats:', error);
    return renderErrorPage(`Error: ${error.message}`, 500);
  }
}
/**
 * Render the templates list page
 */
async function renderTemplatesList() {
  try {
    const templates = await getAllTemplates();
    const csrfToken = await generateCsrfToken();
    
    let templatesContent = '';
    
    if (templates.length === 0) {
      templatesContent = `
        <div class="empty-state">
          <p>No templates found. Create your first template to get started.</p>
        </div>
      `;
    } else {
      templatesContent = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${templates.map(template => {
              const createdDate = template.created ? new Date(template.created).toLocaleDateString() : 'Unknown';
              const updatedDate = template.updated ? new Date(template.updated).toLocaleDateString() : 'Unknown';
              
              return `
                <tr>
                  <td>${template.name}</td>
                  <td>
                    <span class="template-type ${template.type}">
                      ${template.type === 'html' ? 'HTML Template' : 'Google Form'}
                    </span>
                  </td>
                  <td>${createdDate}</td>
                  <td>${updatedDate}</td>
                  <td>
                    <div class="action-buttons">
                      <a href="/templates/edit?id=${template.id}" class="action-btn edit-btn">Edit</a>
                      <a href="/templates/delete?id=${template.id}" class="action-btn delete-btn">Delete</a>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
    
    return renderPage('Templates', `
      <div class="button-group">
        <a href="/templates/create" class="button">Create New Template</a>
      </div>
      
      <div class="card">
        <h2>Your Templates</h2>
        ${templatesContent}
      </div>
      
      <div class="template-info-cards">
        <div class="card template-info-card">
          <h3>HTML Templates</h3>
          <p>Create custom HTML templates for your TikTok traffic. You can use the <code>{{affiliate_link}}</code> placeholder in your template to insert your affiliate link.</p>
          <p>The template will be shown to TikTok users when they visit your campaign link.</p>
        </div>
        
        <div class="card template-info-card">
          <h3>Google Form Redirects</h3>
          <p>Use an existing Google Form as your landing page. We'll automatically add a button to redirect users to your affiliate link.</p>
          <p>This is perfect for lead generation or when you want to collect user information.</p>
        </div>
      </div>
      
      <style>
        .template-type {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .template-type.html {
          background-color: #3498db;
          color: white;
        }
        
        .template-type.googleform {
          background-color: #27ae60;
          color: white;
        }
        
        .template-info-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }
        
        .template-info-card {
          background-color: #f8f9fa;
        }
        
        @media (max-width: 768px) {
          .template-info-cards {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `);
  } catch (error) {
    console.error('Error rendering templates list:', error);
    return renderErrorPage(`Error: ${error.message}`, 500);
  }
}
/**
 * Handle campaign whitehat threshold update
 */
async function handleCampaignThresholdUpdate(request) {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return createJsonResponse({ 
        success: false, 
        error: 'Method not allowed' 
      }, 405);
    }
    
    // Get form data
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Get campaign ID and new threshold
    const campaignId = formData.get('campaignId');
    const whitehatThreshold = parseInt(formData.get('whitehatThreshold'), 10);
    
    if (!campaignId) {
      return renderErrorPage('Campaign ID is required', 400);
    }
    
    if (isNaN(whitehatThreshold) || whitehatThreshold < 0) {
      return renderErrorPage('Invalid whitehat threshold value', 400);
    }
    
    // Get the campaign
    const campaign = await CAMPAIGNS.get(`campaign:${campaignId}`, { type: 'json' });
    
    if (!campaign) {
      return renderErrorPage(`Campaign with ID ${campaignId} not found`, 404);
    }
    
    // Update the threshold
    campaign.whitehatThreshold = whitehatThreshold;
    
    // Save the updated campaign
    await CAMPAIGNS.put(`campaign:${campaignId}`, JSON.stringify(campaign));
    
    console.log(`Updated whitehat threshold for campaign ${campaignId} to ${whitehatThreshold}`);
    
    // Redirect back to the stats page
    return Response.redirect(getRedirectUrl(request, `/campaigns/stats?id=${campaignId}`), 302);
  } catch (error) {
    console.error('Error updating whitehat threshold:', error);
    return renderErrorPage(`Error: ${error.message}`, 500);
  }
}
/**
 * Render the settings page with added dark mode toggle
 */
async function renderSettings() {
  try {
    // Get global traffic routing status
    const tikTokRoutingEnabled = await SETTINGS.get('tikTokRoutingEnabled') === 'true';
    
    // Get dark mode setting
    const darkModeEnabled = await SETTINGS.get('darkModeEnabled') === 'true';
    
    // Generate CSRF token
    const csrfToken = await generateCsrfToken();
    
    return renderPage('Settings', `
      <div class="card">
        <h2>Global Settings</h2>
        
        <form action="/settings/update" method="POST">
          <input type="hidden" name="csrf_token" value="${csrfToken}">
          
          <div class="form-group">
            <label class="toggle-label">
              TikTok Traffic Routing
              <div class="toggle-switch">
                <input type="checkbox" name="tikTokRoutingEnabled" ${tikTokRoutingEnabled ? 'checked' : ''}>
                <span class="slider"></span>
              </div>
              <span class="status-text ${tikTokRoutingEnabled ? 'enabled' : 'disabled'}">
                ${tikTokRoutingEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
            <div class="form-hint">When enabled, TikTok traffic will be automatically detected and routed for all campaigns. Disabling this will override individual campaign settings.</div>
          </div>
          
          <div class="form-group">
            <label class="toggle-label">
              Dark Mode
              <div class="toggle-switch">
                <input type="checkbox" name="darkModeEnabled" id="darkModeToggle" ${darkModeEnabled ? 'checked' : ''}>
                <span class="slider"></span>
              </div>
              <span class="status-text ${darkModeEnabled ? 'enabled' : 'disabled'}">
                ${darkModeEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
            <div class="form-hint">Enable dark mode for a more comfortable viewing experience in low-light environments.</div>
          </div>
          
          <button type="submit" class="button">Save Settings</button>
        </form>
      </div>
      
      <div class="card">
        <h2>System Information</h2>
        
        <div class="detail-group">
          <div class="detail-label">Router Worker URL</div>
          <div class="detail-value">${CONFIG.WORKER_URLS.ROUTER}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Shopify API Worker URL</div>
          <div class="detail-value">${CONFIG.WORKER_URLS.SHOPIFY}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Available Regions</div>
          <div class="detail-value">${CONFIG.REGIONS.join(', ')}</div>
        </div>
        
        <div class="alert alert-info">
          <strong>Note:</strong> To reinitialize the system, visit the <a href="/init">Initialize System</a> page. This will reset global settings but will not affect your campaigns, templates, or Shopify stores.
        </div>
      </div>
      
      <div class="card">
        <h2>Available Redirect Domains</h2>
        
        <div class="domain-list">
          <ul class="domain-list-items">
            <li><span class="domain-item">tikfunnelreward.com</span></li>
            <li><span class="domain-item">tikshein.info</span></li>
            <li><span class="domain-item">tikshein.pro</span></li>
            <li><span class="domain-item">tikshein.store</span></li>
            <li><span class="domain-item">tiksub.xyz</span></li>
            <li><span class="domain-item">tiktemp.xyz</span></li>
          </ul>
        </div>
        
        <div class="form-hint">These domains are used to redirect TikTok traffic to your affiliate offers. You can select a specific domain when creating or editing a campaign.</div>
      </div>
      
      <style>
        .detail-group {
          display: flex;
          margin-bottom: 12px;
          border-bottom: 1px solid #f0f0f1;
          padding-bottom: 12px;
        }
        
        .detail-label {
          flex: 0 0 150px;
          font-weight: bold;
        }
        
        .detail-value {
          flex: 1;
        }
        
        .domain-list {
          margin: 10px 0;
        }
        
        .domain-list-items {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .domain-list-items li {
          margin-bottom: 8px;
        }
        
        .domain-item {
          display: inline-block;
          padding: 6px 12px;
          background-color: var(--bg-secondary);
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
        }
      </style>
    `);
  } catch (error) {
    console.error('Error rendering settings:', error);
    return renderErrorPage(`Error: ${error.message}`, 500);
  }
}


/**
 * Render Shopify stores list
 */
async function renderShopifyStoresList() {
  try {
    const stores = await fetchShopifyStores();
    const csrfToken = await generateCsrfToken();
    
    let storesContent = '';
    
    if (stores.length === 0) {
      storesContent = `
        <div class="empty-state">
          <p>No Shopify stores found. Add your first store to get started.</p>
        </div>
      `;
    } else {
      storesContent = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Store Name</th>
              <th>URL</th>
              <th>Status</th>
              <th>Pages</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${stores.map(store => `
              <tr>
                <td>${store.name}</td>
                <td>${store.url}</td>
                <td>
                  <span class="status-badge ${store.active ? 'active' : 'inactive'}">
                    ${store.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>${store.pageCount || 0}</td>
                <td>
                  <div class="action-buttons">
                    <a href="/shopify/edit?id=${store.id}" class="action-btn edit-btn">Edit</a>
                    <a href="/shopify/test?id=${store.id}" class="action-btn stats-btn">Test</a>
                    <a href="/shopify/delete?id=${store.id}" class="action-btn delete-btn">Delete</a>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    return renderPage('Shopify Stores', `
      <div class="button-group">
        <a href="/shopify/add" class="button">Add Shopify Store</a>
      </div>
      
      <div class="card">
        <h2>Your Shopify Stores</h2>
        ${storesContent}
      </div>
      
      <div class="alert alert-info">
        <strong>Note:</strong> Each campaign will be assigned to a specific Shopify store where a TikTok landing page will be created.
        The system will automatically create pages that detect and route TikTok traffic to your affiliate offers.
      </div>
    `);
  } catch (error) {
    console.error('Error rendering Shopify stores list:', error);
    return renderErrorPage(`Error: ${error.message}`, 500);
  }
}

/**
 * Handle Shopify store test
 */
async function handleShopifyStoreTest(request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get('id');
  
  if (!storeId) {
    return Response.redirect('/shopify', 302);
  }
  
  try {
    // Test store via Shopify API Worker
    const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/test?id=${storeId}`, {
      headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Store test failed: ${errorText}`);
    }
    
    const responseData = await response.json();
    const shop = responseData.shop;
    
    // Get store data
    const storeResponse = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/get?id=${storeId}`, {
      headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
    });
    
    if (!storeResponse.ok) {
      throw new Error('Failed to get store details');
    }
    
    const storeData = await storeResponse.json();
    const store = storeData.store;
    
    return renderPage('Test Results', `
      <div class="card">
        <h2>Shopify Store Test Results: ${store.name}</h2>
        
        <div class="alert alert-success">
          <strong>Connection Successful!</strong> Successfully connected to the Shopify store.
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Store Name</div>
          <div class="detail-value">${shop.name}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Store URL</div>
          <div class="detail-value">${store.url}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Shop ID</div>
          <div class="detail-value">${shop.id}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Shop Plan</div>
          <div class="detail-value">${shop.plan_name}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Shop Country</div>
          <div class="detail-value">${shop.country_name}</div>
        </div>
        
        <a href="/shopify" class="back-link">← Back to Shopify Stores</a>
      </div>
    `);
  } catch (error) {
    console.error('Error testing Shopify store:', error);
    return renderErrorPage(`Error testing Shopify store: ${error.message}`, 500);
  }
}

/**
 * Fetch all Shopify stores from the Shopify API Worker
 */
async function fetchShopifyStores() {
  try {
    const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/list`, {
      headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch stores: ${errorText}`);
    }
    
    const responseData = await response.json();
    return responseData.stores || [];
  } catch (error) {
    console.error('Error fetching Shopify stores:', error);
    return [];
  }
}

/**
 * Get all campaigns
 */
async function getAllCampaigns() {
  try {
    // List all campaign keys
    const campaignsList = await CAMPAIGNS.list({ prefix: 'campaign:' });
    
    // Fetch each campaign
    const campaigns = [];
    for (const key of campaignsList.keys) {
      try {
        const campaignData = await CAMPAIGNS.get(key.name, { type: 'json' });
        if (campaignData && campaignData.id) {
          campaigns.push(campaignData);
        }
      } catch (error) {
        console.error(`Error fetching campaign ${key.name}:`, error);
      }
    }
    
    return campaigns;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
}

/**
 * Get all templates
 */
async function getAllTemplates() {
  try {
    // List all template keys
    const templatesList = await TEMPLATES.list({ prefix: 'template:' });
    
    // Fetch each template
    const templates = [];
    for (const key of templatesList.keys) {
      try {
        // Skip content entries
        if (key.name.includes(':content')) continue;
        
        const templateData = await TEMPLATES.get(key.name, { type: 'json' });
        if (templateData && templateData.id) {
          templates.push(templateData);
        }
      } catch (error) {
        console.error(`Error fetching template ${key.name}:`, error);
      }
    }
    
    return templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

/**
 * Get a specific template
 */
async function getTemplate(templateId) {
  try {
    const template = await TEMPLATES.get(`template:${templateId}`, { type: 'json' });
    return template;
  } catch (error) {
    console.error(`Error fetching template ${templateId}:`, error);
    return null;
  }
}

/**
 * Render a campaign form without TikTok traffic routing option but keeping Campaign Active
 */
function renderCampaignForm(campaign, templates, stores, csrfToken) {
  const isEdit = !!campaign;
  const title = isEdit ? 'Edit Campaign' : 'Create New Campaign';
  
  // Get existing geo links if any
  const geoLinks = isEdit && campaign.geoLinks ? campaign.geoLinks : {};
  
  return renderPage(title, `
    <div class="card">
      <h2>${title}</h2>
      
      <form action="${isEdit ? `/campaigns/edit?id=${campaign.id}` : '/campaigns/create'}" method="POST">
        <input type="hidden" name="csrf_token" value="${csrfToken}">
        
        <div class="form-group">
          <label for="campaignName">Campaign Name</label>
          <input type="text" id="campaignName" name="campaignName" class="input-full" 
            value="${isEdit ? campaign.name : ''}" required>
        </div>
        
        <div class="form-group">
          <label for="shopifyStoreId">Shopify Store</label>
          <select id="shopifyStoreId" name="shopifyStoreId" class="input-full" required>
            <option value="">Select a Shopify Store</option>
            ${stores.map(store => `
              <option value="${store.id}" ${isEdit && campaign && campaign.shopifyStoreId === store.id ? 'selected' : ''}>
                ${store.name} (${store.url})
              </option>
            `).join('')}
          </select>
          <div class="form-hint">This store will be used to create a cloaked landing page.</div>
        </div>
        
        <div class="form-group">
          <label for="templateId">Offer Template</label>
          <select id="templateId" name="templateId" class="input-full" required>
            <option value="">Select a Template</option>
            ${templates.map(template => `
              <option value="${template.id}" ${isEdit && campaign && campaign.templateId === template.id ? 'selected' : ''}>
                ${template.name} (${template.type})
              </option>
            `).join('')}
          </select>
          <div class="form-hint">This template will be shown to visitors.</div>
        </div>
        
        <div class="section-divider">
          <h3>Regional Settings</h3>
          <p class="form-hint">Add affiliate links for specific regions. Only regions with links will be active for this campaign.</p>
        </div>
        
        <div id="geo-links-container">
          ${CONFIG.REGIONS.map(region => `
            <div class="form-group geo-link-row">
              <div class="geo-link-header">
                <input type="checkbox" id="geo-${region}-check" name="geoRegions" value="${region}" 
                  ${geoLinks && geoLinks[region] ? 'checked' : ''} 
                  class="geo-checkbox">
                <label for="geo-${region}-check">${region}</label>
              </div>
              <input type="url" id="geo-${region}-link" name="geoLinks-${region}" 
                class="input-full geo-link-input" 
                value="${geoLinks && geoLinks[region] ? geoLinks[region] : ''}" 
                placeholder="Affiliate link for ${region}" 
                ${geoLinks && geoLinks[region] ? '' : 'disabled'}>
            </div>
          `).join('')}
        </div>
        
        <div class="form-group">
          <label for="redirectDomain">Redirect Domain</label>
          <select id="redirectDomain" name="redirectDomain" class="input-full">
            <option value="" ${isEdit && campaign && !campaign.redirectDomain ? 'selected' : ''}>Random (select automatically)</option>
            <option value="https://tikfunnelreward.com" ${isEdit && campaign && campaign.redirectDomain === 'https://tikfunnelreward.com' ? 'selected' : ''}>tikfunnelreward.com</option>
            <option value="https://tikshein.info" ${isEdit && campaign && campaign.redirectDomain === 'https://tikshein.info' ? 'selected' : ''}>tikshein.info</option>
            <option value="https://tikshein.pro" ${isEdit && campaign && campaign.redirectDomain === 'https://tikshein.pro' ? 'selected' : ''}>tikshein.pro</option>
            <option value="https://tikshein.store" ${isEdit && campaign && campaign.redirectDomain === 'https://tikshein.store' ? 'selected' : ''}>tikshein.store</option>
            <option value="https://tiksub.xyz" ${isEdit && campaign && campaign.redirectDomain === 'https://tiksub.xyz' ? 'selected' : ''}>tiksub.xyz</option>
            <option value="https://tiktemp.xyz" ${isEdit && campaign && campaign.redirectDomain === 'https://tiktemp.xyz' ? 'selected' : ''}>tiktemp.xyz</option>
          </select>
          <div class="form-hint">Select which domain to use for redirecting traffic.</div>
        </div>
        
        <div class="form-check">
          <input type="checkbox" id="active" name="active" ${isEdit ? (campaign && campaign.active ? 'checked' : '') : 'checked'}>
          <label for="active">Campaign Active</label>
          <div class="form-hint">When unchecked, the campaign will not route any traffic.</div>
        </div>
        
        <div class="section-divider">
          <h3>Non-TikTok Traffic Handling</h3>
        </div>
        
        <div class="form-group">
          <label for="whitehatBehavior">Whitehat Behavior</label>
          <select id="whitehatBehavior" name="whitehatBehavior" class="input-full">
            <option value="404-page" ${isEdit && campaign && campaign.whitehatBehavior === '404-page' ? 'selected' : ''}>Show 404 Not Found Page</option>
            <option value="template" ${isEdit && campaign && campaign.whitehatBehavior === 'template' ? 'selected' : ''}>Show Different Template</option>
            <option value="redirect" ${isEdit && campaign && campaign.whitehatBehavior === 'redirect' ? 'selected' : ''}>Redirect to URL</option>
          </select>
          <div class="form-hint">How to handle non-TikTok traffic visiting your campaign.</div>
        </div>
        
        <div id="whitehatTemplateField" class="form-group" style="display: none;">
          <label for="whitehatTemplateId">Whitehat Template</label>
          <select id="whitehatTemplateId" name="whitehatTemplateId" class="input-full">
            <option value="">Select a Template</option>
            ${templates.map(template => `
              <option value="${template.id}" ${isEdit && campaign && campaign.whitehatTemplateId === template.id ? 'selected' : ''}>
                ${template.name} (${template.type})
              </option>
            `).join('')}
          </select>
          <div class="form-hint">This template will be shown to non-TikTok traffic.</div>
        </div>
        
        <div id="whitehatURLField" class="form-group" style="display: none;">
          <label for="whitehatURL">Redirect URL</label>
          <input type="url" id="whitehatURL" name="whitehatURL" class="input-full" 
            value="${isEdit && campaign && campaign.whitehatURL ? campaign.whitehatURL : ''}" placeholder="https://...">
          <div class="form-hint">Non-TikTok traffic will be redirected to this URL.</div>
        </div>
        
        <div class="button-group">
          <button type="submit" class="button">${isEdit ? 'Update Campaign' : 'Create Campaign'}</button>
          <a href="/campaigns" class="back-link">← Cancel</a>
        </div>
      </form>
    </div>
    
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Whitepaper behavior toggle
        const whitehatBehaviorSelect = document.getElementById('whitehatBehavior');
        const whitehatTemplateField = document.getElementById('whitehatTemplateField');
        const whitehatURLField = document.getElementById('whitehatURLField');
        
        function updateWhitehatFields() {
          const value = whitehatBehaviorSelect.value;
          if (value === 'template') {
            whitehatTemplateField.style.display = 'block';
            whitehatURLField.style.display = 'none';
          } else if (value === 'redirect') {
            whitehatTemplateField.style.display = 'none';
            whitehatURLField.style.display = 'block';
          } else {
            whitehatTemplateField.style.display = 'none';
            whitehatURLField.style.display = 'none';
          }
        }
        
        whitehatBehaviorSelect.addEventListener('change', updateWhitehatFields);
        updateWhitehatFields(); // Initial state
        
        // Geo-specific affiliate links functionality
        const geoCheckboxes = document.querySelectorAll('.geo-checkbox');
        
        geoCheckboxes.forEach(checkbox => {
          checkbox.addEventListener('change', function() {
            const region = this.value;
            const linkInput = document.getElementById('geo-' + region + '-link');
            
            if (this.checked) {
              linkInput.removeAttribute('disabled');
            } else {
              linkInput.setAttribute('disabled', 'disabled');
              linkInput.value = '';
            }
          });
        });
      });
    </script>
    
    <style>
      .geo-link-row {
        display: flex;
        flex-direction: column;
        margin-bottom: 10px;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
      }
      
      .geo-link-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .geo-link-header label {
        margin-left: 8px;
        font-weight: bold;
      }
      
      .geo-link-input {
        margin-top: 5px;
      }
    </style>
  `);
}
/**
 * Render a base page with consistent layout and dark mode support
 */
async function renderPage(title, content) {
  // Check dark mode preference
  const darkModeEnabled = await SETTINGS.get('darkModeEnabled') === 'true';
  
  return new Response(`
    <!DOCTYPE html>
    <html class="${darkModeEnabled ? 'dark-mode' : ''}">
    <head>
      <title>${title} - TikTok Campaign Admin</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="/admin.css">
      <script src="/admin.js" defer></script>
    </head>
    <body>
      <header>
        <div class="header-container">
          <div class="logo">
            <a href="/">TikTok Campaign Admin</a>
          </div>
          <nav>
            <ul>
              <li><a href="/">Dashboard</a></li>
              <li><a href="/campaigns">Campaigns</a></li>
              <li><a href="/templates">Templates</a></li>
              <li><a href="/shopify">Shopify Stores</a></li>
              <li><a href="/settings">Settings</a></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <div class="container">
        <h1>${title}</h1>
        
        ${content}
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}


/**
 * Render an error page
 */
function renderErrorPage(message, status = 500) {
  return renderPage(`Error ${status}`, `
    <div class="card">
      <h2>Error</h2>
      <p>${message}</p>
      <a href="/" class="back-link">← Back to Dashboard</a>
    </div>
  `);
}

/**
 * Serve admin CSS
 */
function serveAdminCSS() {
  const css = `
    /* CSS Variables for theming */
    :root {
      --bg-main: #f5f7fa;
      --bg-card: #ffffff;
      --bg-secondary: #f8f9fa;
      --text-main: #333333;
      --text-secondary: #7f8c8d;
      --border-color: #ecf0f1;
      --input-border: #dddddd;
      --input-focus: #3498db;
      --primary: #3498db;
      --primary-hover: #2980b9;
      --success: #27ae60;
      --danger: #e74c3c;
      --warning: #f39c12;
      --info: #3498db;
      --header-bg: #2c3e50;
      --header-text: #ffffff;
      --shadow-color: rgba(0,0,0,0.1);
    }
    
    /* Dark mode variables */
    .dark-mode {
      --bg-main: #1a1a1a;
      --bg-card: #2c2c2c;
      --bg-secondary: #242424;
      --text-main: #e0e0e0;
      --text-secondary: #a0a0a0;
      --border-color: #3a3a3a;
      --input-border: #3a3a3a;
      --input-focus: #3498db;
      --shadow-color: rgba(0,0,0,0.4);
    }
    
    /* Base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-main);
      background-color: var(--bg-main);
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* Header */
    header {
      background-color: var(--header-bg);
      color: var(--header-text);
      padding: 10px 0;
      margin-bottom: 20px;
    }
    
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    .logo {
      font-weight: bold;
      font-size: 24px;
    }
    
    .logo a {
      color: var(--header-text);
      text-decoration: none;
    }
    
    nav ul {
      list-style: none;
      display: flex;
    }
    
    nav li {
      margin-left: 20px;
    }
    
    nav a {
      color: #ecf0f1;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.3s;
    }
    
    nav a:hover {
      color: var(--primary);
    }
    
    /* Cards */
    .card {
      background-color: var(--bg-card);
      border-radius: 5px;
      box-shadow: 0 2px 5px var(--shadow-color);
      padding: 20px;
      margin-bottom: 20px;
      transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }
    
    .card h2 {
      margin-top: 0;
      color: var(--text-main);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    
    /* Grid Layout */
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    
    @media (max-width: 768px) {
      .grid-2, .grid-3 {
        grid-template-columns: 1fr;
      }
    }
    
    /* Buttons */
    .button {
      display: inline-block;
      background-color: var(--primary);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 14px;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .button:hover {
      background-color: var(--primary-hover);
    }
    
    .button-full {
      display: block;
      width: 100%;
      text-align: center;
      padding: 10px;
    }
    
    .delete-button {
      background-color: var(--danger);
    }
    
    .delete-button:hover {
      background-color: #c0392b;
    }
    
    /* Forms */
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: var(--text-main);
    }
    
    .form-hint {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 5px;
    }
    
    .input-full, select, textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--input-border);
      border-radius: 4px;
      box-sizing: border-box;
      font-family: inherit;
      font-size: inherit;
      background-color: var(--bg-secondary);
      color: var(--text-main);
      transition: border-color 0.3s, background-color 0.3s, color 0.3s;
    }
    
    .input-full:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--input-focus);
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.25);
    }
    
    .form-check {
      margin-bottom: 15px;
    }
    
    .form-check label {
      display: inline;
      margin-left: 5px;
    }
    
    /* Toggle Switch */
    .toggle-label {
      display: flex;
      align-items: center;
      font-weight: bold;
      color: var(--text-main);
    }

    /* Toggle Switch Styles */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
      margin: 0 10px;
    }
    
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 24px;
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    
    input:checked + .slider {
      background-color: var(--primary);
    }
    
    input:checked + .slider:before {
      transform: translateX(26px);
    }
    
    .status-text {
      font-size: 12px;
      font-weight: bold;
    }
    
    .status-text.enabled {
      color: var(--success);
    }
    
    .status-text.disabled {
      color: var(--danger);
    }
    
    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .data-table th,
    .data-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    
    .data-table th {
      background-color: var(--bg-secondary);
      font-weight: bold;
    }
    
    .data-table tr:hover {
      background-color: var(--bg-secondary);
    }
    
    /* Status Indicators */
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .status-badge.active {
      background-color: var(--success);
      color: white;
    }
    
    .status-badge.inactive {
      background-color: var(--danger);
      color: white;
    }
    
    /* Stats Display */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
      margin: 15px 0;
    }
    
    .stats-item {
      background-color: var(--bg-secondary);
      border-radius: 4px;
      padding: 15px;
      text-align: center;
      border: 1px solid var(--border-color);
    }
    
    .stats-value {
      font-size: 32px;
      font-weight: bold;
      color: var(--primary);
    }
    
    .stats-label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 5px;
    }
    
    /* Action Cards */
    .action-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .action-card .button {
      margin-top: auto;
    }
    
    /* Action Buttons in Tables */
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    
    .action-btn {
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      text-decoration: none;
      color: white;
      cursor: pointer;
    }
    
    .edit-btn {
      background-color: var(--primary);
    }
    
    .stats-btn {
      background-color: var(--warning);
    }
    
    .delete-btn {
      background-color: var(--danger);
    }
    
    /* Link Actions Styles */
    .link-actions {
      display: flex;
      gap: 10px;
    }
    
    .link-actions .action-btn {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      text-align: center;
      color: white;
      background-color: var(--primary);
      cursor: pointer;
      transition: background-color 0.2s, opacity 0.2s;
    }
    
    .link-actions .copy-url {
      background-color: var(--success);
    }
    
    .link-actions .refresh-link {
      background-color: var(--warning);
    }
    
    .link-actions .action-btn:hover {
      opacity: 0.8;
    }
    
    .link-actions .action-btn.disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    /* Alerts */
    .alert {
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    
    .alert-danger {
      background-color: rgba(231, 76, 60, 0.1);
      border: 1px solid var(--danger);
      color: var(--danger);
    }
    
    .alert-warning {
      background-color: rgba(241, 196, 15, 0.1);
      border: 1px solid var(--warning);
      color: var(--warning);
    }
    
    .alert-success {
      background-color: rgba(46, 204, 113, 0.1);
      border: 1px solid var(--success);
      color: var(--success);
    }
    
    .alert-info {
      background-color: rgba(52, 152, 219, 0.1);
      border: 1px solid var(--info);
      color: var(--info);
    }
    
    /* Misc */
    .empty-state {
      background-color: var(--bg-secondary);
      border-radius: 4px;
      padding: 20px;
      text-align: center;
      color: var(--text-secondary);
    }
    
    .section-divider {
      margin: 20px 0;
      border-top: 1px solid var(--border-color);
      padding-top: 10px;
    }
    
    .regions-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    
    .back-link {
      display: inline-block;
      margin-top: 10px;
      color: var(--primary);
      text-decoration: none;
    }
    
    /* Toast notifications */
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }
    
    .toast {
      background-color: var(--header-bg);
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      margin-bottom: 10px;
      box-shadow: 0 3px 6px var(--shadow-color);
      animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
      opacity: 0;
      max-width: 300px;
    }
    
    .toast.success {
      background-color: var(--success);
    }
    
    .toast.error {
      background-color: var(--danger);
    }
    
    .toast.info {
      background-color: var(--info);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-20px); }
    }
    
    /* Template specific styles */
    .template-type {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .template-type.html {
      background-color: var(--primary);
      color: white;
    }
    
    .template-type.googleform {
      background-color: var(--success);
      color: white;
    }
    
    /* Chart styles - with dark mode support */
    .chart-container {
      margin: 20px 0;
    }
    
    .chart {
      width: 100%;
      background-color: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .chart-bar {
      height: 40px;
      line-height: 40px;
      color: white;
      padding: 0 10px;
      position: relative;
      min-width: 40px;
    }
    
    .tiktok-bar {
      background-color: var(--primary);
    }
    
    .non-tiktok-bar {
      background-color: var(--danger);
    }
    .geo-link-row {
      display: flex;
      flex-direction: column;
      margin-bottom: 15px;
      padding: 15px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background-color: var(--bg-secondary);
    }
    
    .geo-link-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .geo-link-header label {
      margin-left: 8px;
      font-weight: bold;
      color: var(--text-main);
    }
    
    .geo-link-input {
      margin-top: 5px;
    }

  
  `;
  
  return new Response(css, {
    headers: { 'Content-Type': 'text/css' }
  });
}

/**
 * Serve admin JavaScript with dark mode toggle support
 */
function serveAdminJS() {
  const js = `
    // Client-side JavaScript for the admin panel
    document.addEventListener('DOMContentLoaded', function() {
      // Create toast notification container
      const toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
      
      // Show toast notification function
      function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        // Trigger animation and make visible
        setTimeout(() => {
          toast.style.opacity = '1';
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => {
            toast.remove();
          }, 300);
        }, duration);
      }
      
      // Copy URL to clipboard functionality
      const copyButtons = document.querySelectorAll('.copy-url');
      if (copyButtons) {
        copyButtons.forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('data-url');
            if (!url) {
              showToast('No URL available to copy', 'error');
              return;
            }
            
            navigator.clipboard.writeText(url).then(() => {
              // Change button text temporarily
              const originalText = this.textContent;
              this.textContent = 'Copied!';
              
              // Show toast notification
              showToast('URL copied to clipboard!', 'success');
              
              setTimeout(() => {
                this.textContent = originalText;
              }, 2000);
            }).catch(err => {
              console.error('Could not copy text: ', err);
              showToast('Failed to copy URL', 'error');
            });
          });
        });
      }
      
      // Refresh link functionality
      const refreshButtons = document.querySelectorAll('.refresh-link');
      if (refreshButtons) {
        refreshButtons.forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            const campaignId = this.getAttribute('data-campaign-id');
            if (!campaignId) {
              showToast('Campaign ID is missing', 'error');
              return;
            }
            
            // Show loading state
            const originalText = this.textContent;
            this.textContent = 'Refreshing...';
            this.classList.add('disabled');
            
            // Create CSRF token data
            let csrfToken = '';
            const csrfMeta = document.querySelector('meta[name="csrf-token"]');
            if (csrfMeta) {
              csrfToken = csrfMeta.getAttribute('content');
            }
            
            // Send request to refresh the link
            fetch(\`/campaigns/refresh-link?id=\${campaignId}\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
              },
              body: JSON.stringify({ csrf_token: csrfToken })
            })
            .then(response => {
              if (!response.ok) {
                return response.text().then(text => {
                  try {
                    // Try to parse as JSON first
                    return Promise.reject(JSON.parse(text));
                  } catch (e) {
                    // If not JSON, return text error
                    return Promise.reject(new Error(text || 'Network response was not ok'));
                  }
                });
              }
              return response.json();
            })
            .then(data => {
              if (data.success) {
                // Update the copy button URL
                const copyButton = this.parentNode.querySelector('.copy-url');
                if (copyButton) {
                  copyButton.setAttribute('data-url', data.newUrl);
                }
                
                // Show success state
                this.textContent = 'Done!';
                
                // Show toast notification
                showToast('Campaign link refreshed successfully!', 'success');
                
                setTimeout(() => {
                  this.textContent = originalText;
                  this.classList.remove('disabled');
                }, 2000);
              } else {
                throw new Error(data.error || 'Unknown error occurred');
              }
            })
            .catch(error => {
              console.error('Error refreshing link:', error);
              
              let errorMessage = 'Error refreshing link';
              if (error.error) {
                errorMessage += ': ' + error.error;
              } else if (error.message) {
                errorMessage += ': ' + error.message;
              }
              
              this.textContent = 'Error';
              
              // Show error toast
              showToast(errorMessage, 'error');
              
              setTimeout(() => {
                this.textContent = originalText;
                this.classList.remove('disabled');
              }, 2000);
            });
          });
        });
      }
      
      // Direct delete handling (no double confirmation)
      const deleteButtons = document.querySelectorAll('.delete-btn');
      if (deleteButtons) {
        deleteButtons.forEach(btn => {
          btn.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
              e.preventDefault();
            }
            // If confirmed, it will navigate to the delete URL which will create and submit a form
          });
        });
      }
      
      // Toggle elements based on selection
      document.querySelectorAll('[data-toggle-target]').forEach(element => {
        element.addEventListener('change', function() {
          const targetId = this.getAttribute('data-toggle-target');
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            if (this.type === 'checkbox') {
              targetElement.style.display = this.checked ? 'block' : 'none';
            } else if (this.type === 'select-one') {
              const showValue = this.getAttribute('data-toggle-value');
              targetElement.style.display = this.value === showValue ? 'block' : 'none';
            }
          }
        });
        // Trigger change event to set initial state
        element.dispatchEvent(new Event('change'));
      });
      
      // Dark mode toggle functionality
      const darkModeToggle = document.getElementById('darkModeToggle');
      if (darkModeToggle) {
        // Apply dark mode based on toggle state
        darkModeToggle.addEventListener('change', function() {
          document.documentElement.classList.toggle('dark-mode', this.checked);
          
          // Update text next to toggle
          const statusText = this.parentNode.parentNode.querySelector('.status-text');
          if (statusText) {
            if (this.checked) {
              statusText.textContent = 'Enabled';
              statusText.classList.remove('disabled');
              statusText.classList.add('enabled');
            } else {
              statusText.textContent = 'Disabled';
              statusText.classList.remove('enabled');
              statusText.classList.add('disabled');
            }
          }
          
          // No need to save the setting here as it's part of a form that will be submitted
        });
      }
    });
  `;
  
  return new Response(js, {
    headers: { 'Content-Type': 'application/javascript' }
  });
}

/**
 * Initialize system with dark mode support
 */
async function initializeSystem() {
  try {
    // Initialize settings
    await SETTINGS.put('tikTokRoutingEnabled', 'true');
    await SETTINGS.put('darkModeEnabled', 'false'); // Default to light mode
    
    // Test KV namespaces
    try {
      await CAMPAIGNS.put('test', 'ok');
      await TEMPLATES.put('test', 'ok');
      await SETTINGS.put('test', 'ok');
    } catch (kvError) {
      return renderErrorPage(`KV initialization error: ${kvError.message}`, 500);
    }
    
    // Initialize Shopify API Worker
    try {
      const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/init`, {
        headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
      });
      
      if (!response.ok) {
        throw new Error(`Shopify API initialization failed: ${await response.text()}`);
      }
    } catch (shopifyError) {
      return renderErrorPage(`Shopify API initialization error: ${shopifyError.message}`, 500);
    }
    
    // Initialize Router Worker
    try {
      const response = await fetch(`${CONFIG.WORKER_URLS.ROUTER}/api/init`, {
        headers: { 'X-API-Key': CONFIG.API_KEYS.ROUTER }
      });
      
      if (!response.ok) {
        throw new Error(`Router initialization failed: ${await response.text()}`);
      }
    } catch (routerError) {
      return renderErrorPage(`Router initialization error: ${routerError.message}`, 500);
    }
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>System Initialized</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/admin.css">
      </head>
      <body>
        <div class="container">
          <h1>System Initialized Successfully</h1>
          
          <div class="card">
            <h2>Initialization Complete</h2>
            <p>The TikTok Campaign System has been successfully initialized.</p>
            <a href="/" class="button">Go to Dashboard</a>
          </div>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Error in initialization:', error);
    return renderErrorPage(`Error initializing system: ${error.message}`, 500);
  }
}


/**
 * Create a JSON response
 */
function createJsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Generate a UUID
 */
function generateUUID() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

/**
 * Generate a random string
 */
function generateRandomString(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a properly formatted absolute URL for redirects
 */
function getRedirectUrl(request, path) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  return `${baseUrl}${path}`;
}

/**
 * Handle campaign creation - UPDATED VERSION (removed TikTok traffic routing option)
 */
async function handleCampaignCreate(request) {
  // Show form for GET request
  if (request.method !== 'POST') {
    try {
      const templates = await getAllTemplates();
      const stores = await fetchShopifyStores();
      const csrfToken = await generateCsrfToken();
      
      return renderCampaignForm(null, templates, stores, csrfToken);
    } catch (error) {
      console.error('Error rendering campaign form:', error);
      return renderErrorPage(`Error: ${error.message}`, 500);
    }
  }
  
  // Handle form submission
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Get form data
    const name = formData.get('campaignName');
    const shopifyStoreId = formData.get('shopifyStoreId');
    const templateId = formData.get('templateId');
    const redirectDomain = formData.get('redirectDomain');
    const active = formData.has('active');
    const geoRegions = formData.getAll('geoRegions');
    const whitehatBehavior = formData.get('whitehatBehavior') || '404-page';
    const whitehatTemplateId = formData.get('whitehatTemplateId') || '';
    const whitehatURL = formData.get('whitehatURL') || '';
    
    // Process geo-specific affiliate links
    const geoLinks = {};
    for (const region of geoRegions) {
      const geoLink = formData.get(`geoLinks-${region}`);
      if (geoLink && geoLink.trim() !== '') {
        geoLinks[region] = geoLink.trim();
      }
    }
    
    // Validate required fields
    if (!name || !shopifyStoreId || !templateId) {
      return renderErrorPage('Required fields are missing. Please fill all required fields.', 400);
    }
    
    // Make sure at least one region is selected with a valid link
    if (Object.keys(geoLinks).length === 0) {
      return renderErrorPage('At least one region with a valid affiliate link is required.', 400);
    }
    
    // Create a path for the campaign based on name
    const subid = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);
    
    // Get default affiliate link from the first geo link (for API compatibility)
    const firstGeoRegion = Object.keys(geoLinks)[0];
    const affiliateLink = geoLinks[firstGeoRegion];
    
    // Create the campaign
    const campaignId = generateUUID();
    const campaign = {
      id: campaignId,
      name,
      subid,
      templateId,
      affiliateLink, // Keep for backward compatibility
      geoLinks,
      shopifyStoreId,
      redirectDomain,
      tikTokRoutingEnabled: true, // Always set to true since we removed the option
      allowedRegions: Object.keys(geoLinks),
      whitehatBehavior,
      whitehatTemplateId,
      whitehatURL,
      active, // Set from form input
      created: Date.now(),
      updated: Date.now()
    };
    
    // Create Shopify page through the Shopify API Worker
    try {
      // Get the template info
      const template = await getTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      // Prepare template content based on type
      let templateContent = '';
      if (template.type === 'html') {
        templateContent = await TEMPLATES.get(`template:${templateId}:content`) || '';
      } else if (template.type === 'googleform') {
        // For Google Forms, we use the URL as the content
        // This ensures the Router worker knows where to redirect to
        templateContent = template.url || '';
      }
      
      const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/pages/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': CONFIG.API_KEYS.SHOPIFY
        },
        body: JSON.stringify({
          storeId: shopifyStoreId,
          campaignId,
          affiliateLink, // Include this for API compatibility
          geoLinks,
          templateId,
          templateContent: templateContent,
          subid,
          redirectDomain,
          // Add template type so the Shopify API knows how to handle it
          templateType: template.type
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create Shopify page: ${errorText}`);
      }
      
      const responseData = await response.json();
      
      // Add the Shopify page info to the campaign
      campaign.shopifyPage = responseData.page;
    } catch (error) {
      console.error('Error creating Shopify page:', error);
      return renderErrorPage(`Error creating Shopify page: ${error.message}`, 500);
    }
    
    // Initialize campaign stats
    campaign.stats = {
      tiktok: 0,
      nonTiktok: 0,
      visits: 0,
      lastVisit: 0
    };
    
    // Save the campaign
    await CAMPAIGNS.put(`campaign:${campaignId}`, JSON.stringify(campaign));
    
    // Redirect to campaigns list
    return Response.redirect(getRedirectUrl(request, '/campaigns'), 302);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return renderErrorPage(`Error creating campaign: ${error.message}`, 500);
  }
}

/**
 * Handle campaign edit - UPDATED VERSION (removed TikTok traffic routing option, kept Campaign Active)
 */
async function handleCampaignEdit(request) {
  const url = new URL(request.url);
  const campaignId = url.searchParams.get('id');
  
  if (!campaignId) {
    return Response.redirect(getRedirectUrl(request, '/campaigns'), 302);
  }
  
  // Get the campaign
  const campaign = await CAMPAIGNS.get(`campaign:${campaignId}`, { type: 'json' });
  
  if (!campaign) {
    return renderErrorPage(`Campaign with ID ${campaignId} not found`, 404);
  }
  
  // Show form for GET request
  if (request.method !== 'POST') {
    try {
      const templates = await getAllTemplates();
      const stores = await fetchShopifyStores();
      const csrfToken = await generateCsrfToken();
      
      return renderCampaignForm(campaign, templates, stores, csrfToken);
    } catch (error) {
      console.error('Error rendering campaign edit form:', error);
      return renderErrorPage(`Error: ${error.message}`, 500);
    }
  }
  
  // Handle form submission
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Get form data
    const name = formData.get('campaignName');
    const shopifyStoreId = formData.get('shopifyStoreId');
    const templateId = formData.get('templateId');
    const redirectDomain = formData.get('redirectDomain');
    const active = formData.has('active');
    const geoRegions = formData.getAll('geoRegions');
    const whitehatBehavior = formData.get('whitehatBehavior') || '404-page';
    const whitehatTemplateId = formData.get('whitehatTemplateId') || '';
    const whitehatURL = formData.get('whitehatURL') || '';
    
    // Process geo-specific affiliate links
    const geoLinks = {};
    for (const region of geoRegions) {
      const geoLink = formData.get(`geoLinks-${region}`);
      if (geoLink && geoLink.trim() !== '') {
        geoLinks[region] = geoLink.trim();
      }
    }
    
    // Validate required fields
    if (!name || !shopifyStoreId || !templateId) {
      return renderErrorPage('Required fields are missing. Please fill all required fields.', 400);
    }
    
    // Make sure at least one region is selected with a valid link
    if (Object.keys(geoLinks).length === 0) {
      return renderErrorPage('At least one region with a valid affiliate link is required.', 400);
    }
    
    // Get default affiliate link from the first geo link (for API compatibility)
    const firstGeoRegion = Object.keys(geoLinks)[0];
    const affiliateLink = geoLinks[firstGeoRegion];
    
    // Update campaign
    campaign.name = name;
    campaign.templateId = templateId;
    campaign.affiliateLink = affiliateLink; // Keep for backward compatibility
    campaign.geoLinks = geoLinks;
    campaign.redirectDomain = redirectDomain;
    campaign.tikTokRoutingEnabled = true; // Always set to true since we removed the option
    campaign.active = active;
    campaign.allowedRegions = Object.keys(geoLinks);
    campaign.whitehatBehavior = whitehatBehavior;
    campaign.whitehatTemplateId = whitehatTemplateId;
    campaign.whitehatURL = whitehatURL;
    campaign.updated = Date.now();
    
    // If shopify store changed, update the Shopify page
    if (campaign.shopifyStoreId !== shopifyStoreId) {
      campaign.shopifyStoreId = shopifyStoreId;
      
      // Create new Shopify page
      try {
        // First, get the template content
        let templateContent = '';
        const template = await getTemplate(templateId);
        if (template) {
          if (template.type === 'html') {
            templateContent = await TEMPLATES.get(`template:${templateId}:content`) || '';
          } else if (template.type === 'googleform') {
            templateContent = template.url || '';
          }
        }
        
        const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/pages/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': CONFIG.API_KEYS.SHOPIFY
          },
          body: JSON.stringify({
            storeId: shopifyStoreId,
            campaignId: campaign.id,
            affiliateLink, // Include for API compatibility
            geoLinks,
            templateId,
            templateContent: templateContent,
            subid: campaign.subid,
            redirectDomain: redirectDomain
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create Shopify page: ${errorText}`);
        }
        
        const responseData = await response.json();
        
        // Add the new Shopify page info to the campaign
        campaign.shopifyPage = responseData.page;
      } catch (error) {
        console.error('Error creating Shopify page:', error);
        return renderErrorPage(`Error creating Shopify page: ${error.message}`, 500);
      }
    } else {
      // Just update the existing page
      try {
        // First, get the template content
        let templateContent = '';
        const template = await getTemplate(templateId);
        if (template) {
          if (template.type === 'html') {
            templateContent = await TEMPLATES.get(`template:${templateId}:content`) || '';
          } else if (template.type === 'googleform') {
            templateContent = template.url || '';
          }
        }
        
        const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/pages/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': CONFIG.API_KEYS.SHOPIFY
          },
          body: JSON.stringify({
            storeId: shopifyStoreId,
            campaignId: campaign.id,
            pageId: campaign.shopifyPage.id,
            affiliateLink, // Include for API compatibility
            geoLinks,
            templateId,
            templateContent: templateContent,
            redirectDomain: redirectDomain
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update Shopify page: ${errorText}`);
        }
      } catch (error) {
        console.error('Error updating Shopify page:', error);
        return renderErrorPage(`Error updating Shopify page: ${error.message}`, 500);
      }
    }
    
    // Save the updated campaign
    await CAMPAIGNS.put(`campaign:${campaignId}`, JSON.stringify(campaign));
    
    // Redirect to campaigns list
    return Response.redirect(getRedirectUrl(request, '/campaigns'), 302);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return renderErrorPage(`Error updating campaign: ${error.message}`, 500);
  }
}
/**
 * Handle campaign deletion - No confirmation page, direct delete with JavaScript confirmation
 */
async function handleCampaignDelete(request) {
  const url = new URL(request.url);
  const campaignId = url.searchParams.get('id');
  
  if (!campaignId) {
    return Response.redirect(getRedirectUrl(request, '/campaigns'), 302);
  }
  
  // Handle form submission for POST request
  if (request.method === 'POST') {
    try {
      const formData = await request.formData();
      
      // Validate CSRF token
      const csrfToken = formData.get('csrf_token');
      if (!await validateCsrfToken(csrfToken)) {
        return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
      }
      
      // Get the campaign
      const campaign = await CAMPAIGNS.get(`campaign:${campaignId}`, { type: 'json' });
      
      if (!campaign) {
        return renderErrorPage(`Campaign with ID ${campaignId} not found`, 404);
      }
      
      // Delete the Shopify page if it exists
      if (campaign.shopifyPage && campaign.shopifyPage.id) {
        try {
          const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/pages/delete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': CONFIG.API_KEYS.SHOPIFY
            },
            body: JSON.stringify({
              storeId: campaign.shopifyStoreId,
              pageId: campaign.shopifyPage.id
            })
          });
          
          if (!response.ok) {
            console.warn(`Warning: Failed to delete Shopify page: ${await response.text()}`);
            // Continue with deletion even if this fails
          }
        } catch (error) {
          console.warn('Warning: Error deleting Shopify page:', error);
          // Continue with deletion even if this fails
        }
      }
      
      // Delete the campaign
      await CAMPAIGNS.delete(`campaign:${campaignId}`);
      
      // Redirect to campaigns list
      return Response.redirect(getRedirectUrl(request, '/campaigns'), 302);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return renderErrorPage(`Error deleting campaign: ${error.message}`, 500);
    }
  }
  // For GET requests, create a form that will be submitted by JavaScript
  else {
    try {
      const csrfToken = await generateCsrfToken();
      
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Deleting Campaign</title>
          <meta charset="UTF-8">
        </head>
        <body>
          <form id="deleteForm" action="/campaigns/delete?id=${campaignId}" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
          </form>
          <script>
            // Immediately submit the form without showing a confirmation page
            document.getElementById('deleteForm').submit();
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    } catch (error) {
      console.error('Error preparing delete action:', error);
      return renderErrorPage(`Error: ${error.message}`, 500);
    }
  }
}

/**
 * Handle settings update with dark mode support
 */
async function handleSettingsUpdate(request) {
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Get form data
    const tikTokRoutingEnabled = formData.has('tikTokRoutingEnabled');
    const darkModeEnabled = formData.has('darkModeEnabled');
    
    // Save settings
    await SETTINGS.put('tikTokRoutingEnabled', tikTokRoutingEnabled ? 'true' : 'false');
    await SETTINGS.put('darkModeEnabled', darkModeEnabled ? 'true' : 'false');
    
    // Redirect to settings page
    return Response.redirect(getRedirectUrl(request, '/settings'), 302);
  } catch (error) {
    console.error('Error updating settings:', error);
    return renderErrorPage(`Error updating settings: ${error.message}`, 500);
  }
}

/**
 * Handle Shopify store addition - with fixed redirect
 */
async function handleShopifyStoreAdd(request) {
  // Show form for GET request
  if (request.method !== 'POST') {
    try {
      const csrfToken = await generateCsrfToken();
      
      return renderPage('Add Shopify Store', `
        <div class="card">
          <h2>Add New Shopify Store</h2>
          
          <form action="/shopify/add" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <div class="form-group">
              <label for="storeName">Store Name</label>
              <input type="text" id="storeName" name="storeName" class="input-full" required>
              <div class="form-hint">A descriptive name for your store.</div>
            </div>
            
            <div class="form-group">
              <label for="storeUrl">Store URL</label>
              <input type="url" id="storeUrl" name="storeUrl" class="input-full" required placeholder="https://your-store.myshopify.com">
              <div class="form-hint">The URL of your Shopify store.</div>
            </div>
            
            <div class="form-group">
              <label for="apiKey">API Key</label>
              <input type="text" id="apiKey" name="apiKey" class="input-full" required>
              <div class="form-hint">The API key from your Shopify private app.</div>
            </div>
            
            <div class="form-group">
              <label for="apiSecret">API Secret</label>
              <input type="password" id="apiSecret" name="apiSecret" class="input-full" required>
              <div class="form-hint">The API secret from your Shopify private app.</div>
            </div>
            
            <div class="form-group">
              <label for="accessToken">Access Token</label>
              <input type="password" id="accessToken" name="accessToken" class="input-full" required>
              <div class="form-hint">The access token from your Shopify private app.</div>
            </div>
            
            <div class="form-check">
              <input type="checkbox" id="active" name="active" checked>
              <label for="active">Store Active</label>
              <div class="form-hint">When unchecked, this store will not be available for campaigns.</div>
            </div>
            
            <div class="form-info">
              <strong>Note:</strong> You need to create a private app in your Shopify store with access to the following scopes:
              <ul>
                <li>read_products</li>
                <li>write_content</li>
              </ul>
            </div>
            
            <div class="button-group">
              <button type="submit" class="button">Add Shopify Store</button>
              <a href="/shopify" class="back-link">← Cancel</a>
            </div>
          </form>
        </div>
      `);
    } catch (error) {
      console.error('Error rendering add store form:', error);
      return renderErrorPage(`Error: ${error.message}`, 500);
    }
  }
  
  // Handle form submission
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Get form data
    const storeData = {
      name: formData.get('storeName'),
      url: formData.get('storeUrl'),
      apiKey: formData.get('apiKey'),
      apiSecret: formData.get('apiSecret'),
      accessToken: formData.get('accessToken'),
      active: formData.has('active')
    };
    
    // Add store via Shopify API Worker
    const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.API_KEYS.SHOPIFY
      },
      body: JSON.stringify(storeData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add store: ${errorText}`);
    }
    
    // Fixed redirect
    return Response.redirect(getRedirectUrl(request, '/shopify'), 302);
  } catch (error) {
    console.error('Error adding Shopify store:', error);
    return renderErrorPage(`Error adding Shopify store: ${error.message}`, 500);
  }
}

/**
 * Handle Shopify store edit - with fixed redirect
 */
async function handleShopifyStoreEdit(request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get('id');
  
  if (!storeId) {
    return Response.redirect(getRedirectUrl(request, '/shopify'), 302);
  }
  
  // Show form for GET request
  if (request.method !== 'POST') {
    try {
      // Get store data from Shopify API Worker
      const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/get?id=${storeId}`, {
        headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get store: ${errorText}`);
      }
      
      const responseData = await response.json();
      const store = responseData.store;
      
      if (!store) {
        return renderErrorPage(`Store with ID ${storeId} not found`, 404);
      }
      
      const csrfToken = await generateCsrfToken();
      
      return renderPage('Edit Shopify Store', `
        <div class="card">
          <h2>Edit Shopify Store: ${store.name}</h2>
          
          <form action="/shopify/edit?id=${storeId}" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <div class="form-group">
              <label for="storeName">Store Name</label>
              <input type="text" id="storeName" name="storeName" class="input-full" value="${store.name}" required>
            </div>
            
            <div class="form-group">
              <label for="storeUrl">Store URL</label>
              <input type="url" id="storeUrl" name="storeUrl" class="input-full" value="${store.url}" required>
            </div>
            
            <div class="form-group">
              <label for="apiKey">API Key (leave blank to keep current)</label>
              <input type="text" id="apiKey" name="apiKey" class="input-full" placeholder="Enter new API key to change">
              <div class="form-hint">Leave blank to keep the current API key.</div>
            </div>
            
            <div class="form-group">
              <label for="apiSecret">API Secret (leave blank to keep current)</label>
              <input type="password" id="apiSecret" name="apiSecret" class="input-full" placeholder="Enter new API secret to change">
              <div class="form-hint">Leave blank to keep the current API secret.</div>
            </div>
            
            <div class="form-group">
              <label for="accessToken">Access Token (leave blank to keep current)</label>
              <input type="password" id="accessToken" name="accessToken" class="input-full" placeholder="Enter new access token to change">
              <div class="form-hint">Leave blank to keep the current access token.</div>
            </div>
            
            <div class="form-check">
              <input type="checkbox" id="active" name="active" ${store.active ? 'checked' : ''}>
              <label for="active">Store Active</label>
              <div class="form-hint">When unchecked, this store will not be available for campaigns.</div>
            </div>
            
            <div class="button-group">
              <button type="submit" class="button">Update Shopify Store</button>
              <a href="/shopify" class="back-link">← Cancel</a>
            </div>
          </form>
        </div>
      `);
    } catch (error) {
      console.error('Error rendering edit store form:', error);
      return renderErrorPage(`Error: ${error.message}`, 500);
    }
  }
  
  // Handle form submission
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Get form data
    const storeData = {
      id: storeId,
      name: formData.get('storeName'),
      url: formData.get('storeUrl'),
      active: formData.has('active')
    };
    
    // Add optional fields if provided
    const apiKey = formData.get('apiKey');
    const apiSecret = formData.get('apiSecret');
    const accessToken = formData.get('accessToken');
    
    if (apiKey && apiKey.trim() !== '') storeData.apiKey = apiKey;
    if (apiSecret && apiSecret.trim() !== '') storeData.apiSecret = apiSecret;
    if (accessToken && accessToken.trim() !== '') storeData.accessToken = accessToken;
    
    // Update store via Shopify API Worker
    const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.API_KEYS.SHOPIFY
      },
      body: JSON.stringify(storeData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update store: ${errorText}`);
    }
    
    // Fixed redirect
    return Response.redirect(getRedirectUrl(request, '/shopify'), 302);
  } catch (error) {
    console.error('Error updating Shopify store:', error);
    return renderErrorPage(`Error updating Shopify store: ${error.message}`, 500);
  }
}

/**
 * Handle Shopify store deletion - with fixed redirect
 */
async function handleShopifyStoreDelete(request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get('id');
  
  if (!storeId) {
    return Response.redirect(getRedirectUrl(request, '/shopify'), 302);
  }
  
  // Show confirmation for GET request
  if (request.method !== 'POST') {
    try {
      // Get store data from Shopify API Worker
      const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/get?id=${storeId}`, {
        headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get store: ${errorText}`);
      }
      
      const responseData = await response.json();
      const store = responseData.store;
      
      if (!store) {
        return renderErrorPage(`Store with ID ${storeId} not found`, 404);
      }
      
      // Check if store is used by any campaigns
      const campaigns = await getAllCampaigns();
      const usingCampaigns = campaigns.filter(c => c.shopifyStoreId === storeId);
      
      const csrfToken = await generateCsrfToken();
      
      return renderPage('Delete Shopify Store', `
        <div class="card">
          <h2>Delete Shopify Store</h2>
          
          <div class="alert alert-danger">
            <strong>Warning!</strong> You are about to delete the following Shopify store:
            <p><strong>${store.name}</strong></p>
            <p>This action cannot be undone.</p>
          </div>
          
          ${usingCampaigns.length > 0 ? `
            <div class="alert alert-warning">
              <strong>Caution!</strong> This store is used by ${usingCampaigns.length} campaign(s):
              <ul>
                ${usingCampaigns.map(c => `<li>${c.name}</li>`).join('')}
              </ul>
              <p>Deleting this store will affect these campaigns. You should reassign them to another store first.</p>
            </div>
          ` : ''}
          
          <form action="/shopify/delete?id=${storeId}" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <div class="button-group-centered">
              <button type="submit" class="button delete-button" ${usingCampaigns.length > 0 ? 'disabled' : ''}>Delete Store</button>
              <a href="/shopify" class="back-link">← Cancel</a>
            </div>
          </form>
        </div>
      `);
    } catch (error) {
      console.error('Error rendering delete confirmation:', error);
      return renderErrorPage(`Error: ${error.message}`, 500);
    }
  }
  
  // Handle form submission
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Check if store is used by any campaigns
    const campaigns = await getAllCampaigns();
    const usingCampaigns = campaigns.filter(c => c.shopifyStoreId === storeId);
    
    if (usingCampaigns.length > 0) {
      return renderErrorPage('Cannot delete store. It is used by one or more campaigns.', 409);
    }
    
    // Delete store via Shopify API Worker
    const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.API_KEYS.SHOPIFY
      },
      body: JSON.stringify({ id: storeId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete store: ${errorText}`);
    }
    
    // Fixed redirect
    return Response.redirect(getRedirectUrl(request, '/shopify'), 302);
  } catch (error) {
    console.error('Error deleting Shopify store:', error);
    return renderErrorPage(`Error deleting Shopify store: ${error.message}`, 500);
  }
}

/**
 * Handle template creation - with fixed redirect
 */
async function handleTemplateCreate(request) {
  // Show form for GET request
  if (request.method !== 'POST') {
    try {
      const csrfToken = await generateCsrfToken();
      
      return renderPage('Create Template', `
        <div class="card">
          <h2>Create New Template</h2>
          
          <form action="/templates/create" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <div class="form-group">
              <label for="templateName">Template Name</label>
              <input type="text" id="templateName" name="templateName" class="input-full" required>
              <div class="form-hint">A descriptive name for your template.</div>
            </div>
            
            <div class="form-group">
              <label for="templateType">Template Type</label>
              <select id="templateType" name="templateType" class="input-full" required>
                <option value="html">HTML Template</option>
                <option value="googleform">Google Form Redirect</option>
              </select>
              <div class="form-hint">Select the type of template you want to create.</div>
            </div>
            
            <div id="htmlContentField" class="form-group">
              <label for="htmlContent">HTML Content</label>
              <textarea id="htmlContent" name="htmlContent" class="input-full" rows="15"></textarea>
              <div class="form-hint">
                Enter your HTML content here. You can use {{affiliate_link}} placeholder for the affiliate link.
              </div>
            </div>
            
            <div id="googleFormField" class="form-group" style="display: none;">
              <label for="googleFormUrl">Google Form URL</label>
              <input type="url" id="googleFormUrl" name="googleFormUrl" class="input-full" placeholder="https://forms.gle/...">
              <div class="form-hint">Enter the URL of your Google Form.</div>
            </div>
            
            <div class="button-group">
              <button type="submit" class="button">Create Template</button>
              <a href="/templates" class="back-link">← Cancel</a>
            </div>
          </form>
        </div>
        
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            // Toggle fields based on template type
            const templateTypeSelect = document.getElementById('templateType');
            const htmlContentField = document.getElementById('htmlContentField');
            const googleFormField = document.getElementById('googleFormField');
            
            function updateFields() {
              const value = templateTypeSelect.value;
              if (value === 'html') {
                htmlContentField.style.display = 'block';
                googleFormField.style.display = 'none';
              } else if (value === 'googleform') {
                htmlContentField.style.display = 'none';
                googleFormField.style.display = 'block';
              }
            }
            
            templateTypeSelect.addEventListener('change', updateFields);
            updateFields(); // Initial state
          });
        </script>
      `);
    } catch (error) {
      console.error('Error rendering template creation form:', error);
      return renderErrorPage(`Error: ${error.message}`, 500);
    }
  }
  
  // Handle form submission
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Get form data
    const name = formData.get('templateName');
    const type = formData.get('templateType');
    
    // Validate based on type
    if (type === 'html') {
      const htmlContent = formData.get('htmlContent');
      if (!htmlContent || htmlContent.trim() === '') {
        return renderErrorPage('HTML content is required for HTML templates.', 400);
      }
      
      // Create template
      const templateId = generateUUID();
      const template = {
        id: templateId,
        name,
        type,
        created: Date.now(),
        updated: Date.now()
      };
      
      // Save template metadata
      await TEMPLATES.put(`template:${templateId}`, JSON.stringify(template));
      
      // Save template content separately
      await TEMPLATES.put(`template:${templateId}:content`, htmlContent);
      
    } else if (type === 'googleform') {
      const url = formData.get('googleFormUrl');
      if (!url || url.trim() === '') {
        return renderErrorPage('Google Form URL is required for Google Form redirects.', 400);
      }
      
      // Create template
      const templateId = generateUUID();
      const template = {
        id: templateId,
        name,
        type,
        url,
        created: Date.now(),
        updated: Date.now()
      };
      
      // Save template metadata
      await TEMPLATES.put(`template:${templateId}`, JSON.stringify(template));
      
    } else {
      return renderErrorPage('Invalid template type.', 400);
    }
    
    // Fixed redirect
    return Response.redirect(getRedirectUrl(request, '/templates'), 302);
  } catch (error) {
    console.error('Error creating template:', error);
    return renderErrorPage(`Error creating template: ${error.message}`, 500);
  }
}

/**
 * Handle template editing - with fixed redirect
 */
async function handleTemplateEdit(request) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get('id');
  
  if (!templateId) {
    return Response.redirect(getRedirectUrl(request, '/templates'), 302);
  }
  
  // Get the template
  const template = await getTemplate(templateId);
  
  if (!template) {
    return renderErrorPage(`Template with ID ${templateId} not found`, 404);
  }
  
  // Show form for GET request
  if (request.method !== 'POST') {
    try {
      const csrfToken = await generateCsrfToken();
      
      // Get template content if it's an HTML template
      let htmlContent = '';
      if (template.type === 'html') {
        htmlContent = await TEMPLATES.get(`template:${templateId}:content`) || '';
      }
      
      return renderPage('Edit Template', `
        <div class="card">
          <h2>Edit Template: ${template.name}</h2>
          
          <form action="/templates/edit?id=${templateId}" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <div class="form-group">
              <label for="templateName">Template Name</label>
              <input type="text" id="templateName" name="templateName" class="input-full" value="${template.name}" required>
            </div>
            
            <div class="form-group">
              <label for="templateType">Template Type</label>
              <select id="templateType" name="templateType" class="input-full" required disabled>
                <option value="html" ${template.type === 'html' ? 'selected' : ''}>HTML Template</option>
                <option value="googleform" ${template.type === 'googleform' ? 'selected' : ''}>Google Form Redirect</option>
              </select>
              <input type="hidden" name="templateType" value="${template.type}">
              <div class="form-hint">Template type cannot be changed after creation.</div>
            </div>
            
            ${template.type === 'html' ? `
              <div id="htmlContentField" class="form-group">
                <label for="htmlContent">HTML Content</label>
                <textarea id="htmlContent" name="htmlContent" class="input-full" rows="15">${htmlContent}</textarea>
                <div class="form-hint">
                  You can use {{affiliate_link}} placeholder for the affiliate link.
                </div>
              </div>
            ` : `
              <div id="googleFormField" class="form-group">
                <label for="googleFormUrl">Google Form URL</label>
                <input type="url" id="googleFormUrl" name="googleFormUrl" class="input-full" value="${template.url || ''}" placeholder="https://forms.gle/...">
              </div>
            `}
            
            <div class="button-group">
              <button type="submit" class="button">Update Template</button>
              <a href="/templates" class="back-link">← Cancel</a>
            </div>
          </form>
        </div>
      `);
    } catch (error) {
      console.error('Error rendering template edit form:', error);
      return renderErrorPage(`Error: ${error.message}`, 500);
    }
  }
  
  // Handle form submission
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Get form data
    const name = formData.get('templateName');
    const type = formData.get('templateType');
    
    // Update template based on type
    if (type === 'html') {
      const htmlContent = formData.get('htmlContent');
      if (!htmlContent || htmlContent.trim() === '') {
        return renderErrorPage('HTML content is required for HTML templates.', 400);
      }
      
      // Update template metadata
      template.name = name;
      template.updated = Date.now();
      
      // Save template metadata
      await TEMPLATES.put(`template:${templateId}`, JSON.stringify(template));
      
      // Save template content separately
      await TEMPLATES.put(`template:${templateId}:content`, htmlContent);
      
    } else if (type === 'googleform') {
      const url = formData.get('googleFormUrl');
      if (!url || url.trim() === '') {
        return renderErrorPage('Google Form URL is required for Google Form redirects.', 400);
      }
      
      // Update template
      template.name = name;
      template.url = url;
      template.updated = Date.now();
      
      // Save template metadata
      await TEMPLATES.put(`template:${templateId}`, JSON.stringify(template));
      
    } else {
      return renderErrorPage('Invalid template type.', 400);
    }
    
    // Fixed redirect
    return Response.redirect(getRedirectUrl(request, '/templates'), 302);
  } catch (error) {
    console.error('Error updating template:', error);
    return renderErrorPage(`Error updating template: ${error.message}`, 500);
  }
}

/**
 * Handle template deletion - with fixed redirect
 */
async function handleTemplateDelete(request) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get('id');
  
  if (!templateId) {
    return Response.redirect(getRedirectUrl(request, '/templates'), 302);
  }
  
  // Show confirmation for GET request
  if (request.method !== 'POST') {
    try {
      // Get the template
      const template = await getTemplate(templateId);
      
      if (!template) {
        return renderErrorPage(`Template with ID ${templateId} not found`, 404);
      }
      
      // Check if template is used by any campaigns
      const campaigns = await getAllCampaigns();
      const usingCampaigns = campaigns.filter(c => 
        c.templateId === templateId || c.whitehatTemplateId === templateId
      );
      
      const csrfToken = await generateCsrfToken();
      
      return renderPage('Delete Template', `
        <div class="card">
          <h2>Delete Template</h2>
          
          <div class="alert alert-danger">
            <strong>Warning!</strong> You are about to delete the following template:
            <p><strong>${template.name}</strong></p>
            <p>This action cannot be undone.</p>
          </div>
          
          ${usingCampaigns.length > 0 ? `
            <div class="alert alert-warning">
              <strong>Caution!</strong> This template is used by ${usingCampaigns.length} campaign(s):
              <ul>
                ${usingCampaigns.map(c => `<li>${c.name}</li>`).join('')}
              </ul>
              <p>Deleting this template will affect these campaigns. You should reassign them to another template first.</p>
            </div>
          ` : ''}
          
          <form action="/templates/delete?id=${templateId}" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <div class="button-group-centered">
              <button type="submit" class="button delete-button" ${usingCampaigns.length > 0 ? 'disabled' : ''}>Delete Template</button>
              <a href="/templates" class="back-link">← Cancel</a>
            </div>
          </form>
        </div>
      `);
    } catch (error) {
      console.error('Error rendering delete confirmation:', error);
      return renderErrorPage(`Error: ${error.message}`, 500);
    }
  }
  
  // Handle form submission
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Get the template
    const template = await getTemplate(templateId);
    
    if (!template) {
      return renderErrorPage(`Template with ID ${templateId} not found`, 404);
    }
    
    // Check if template is used by any campaigns
    const campaigns = await getAllCampaigns();
    const usingCampaigns = campaigns.filter(c => 
      c.templateId === templateId || c.whitehatTemplateId === templateId
    );
    
    if (usingCampaigns.length > 0) {
      return renderErrorPage('Cannot delete template. It is used by one or more campaigns.', 409);
    }
    
    // Delete template and content
    await TEMPLATES.delete(`template:${templateId}`);
    
    // Delete content if it's an HTML template
    if (template.type === 'html') {
      await TEMPLATES.delete(`template:${templateId}:content`);
    }
    
    // Fixed redirect
    return Response.redirect(getRedirectUrl(request, '/templates'), 302);
  } catch (error) {
    console.error('Error deleting template:', error);
    return renderErrorPage(`Error deleting template: ${error.message}`, 500);
  }
}