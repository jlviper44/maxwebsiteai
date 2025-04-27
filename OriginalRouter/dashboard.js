/**
 * Dashboard functionality
 */

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