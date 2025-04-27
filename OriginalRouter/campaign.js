/**
 * Campaign management functionality
 */

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