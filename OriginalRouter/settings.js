/**
 * Settings management functionality
 */

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