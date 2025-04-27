/**
 * Campaign handler functionality for API endpoints
 */

import { generateRandomString, generateUUID, createJsonResponse } from './utils.js';

/**
 * Get all campaigns for the current user
 */
async function getAllCampaigns(env) {
  try {
    const keys = await env.CAMPAIGNS.list({ prefix: 'campaign:' });
    const campaigns = [];
    
    for (const key of keys.keys) {
      const campaign = await env.CAMPAIGNS.get(key.name, { type: 'json' });
      if (campaign) {
        campaigns.push(campaign);
      }
    }
    
    return campaigns;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

/**
 * Get a template by ID
 */
async function getTemplate(templateId, env) {
  try {
    return await env.TEMPLATES.get(`template:${templateId}`, { type: 'json' });
  } catch (error) {
    console.error(`Error fetching template ${templateId}:`, error);
    return null;
  }
}

/**
 * Fetch all templates
 */
async function getAllTemplates(env) {
  try {
    const keys = await env.TEMPLATES.list({ prefix: 'template:' });
    const templates = [];
    
    for (const key of keys.keys) {
      // Skip content keys
      if (key.name.includes(':content')) continue;
      
      const template = await env.TEMPLATES.get(key.name, { type: 'json' });
      if (template) {
        templates.push(template);
      }
    }
    
    return templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

/**
 * Fetch Shopify stores
 */
async function fetchShopifyStores(env) {
  try {
    const keys = await env.STORES.list({ prefix: 'store:' });
    const stores = [];
    
    for (const key of keys.keys) {
      const store = await env.STORES.get(key.name, { type: 'json' });
      if (store) {
        stores.push(store);
      }
    }
    
    return stores;
  } catch (error) {
    console.error('Error fetching stores:', error);
    throw error;
  }
}

/**
 * Handle campaigns list request
 */
export async function handleCampaignsList(request, env) {
  try {
    const campaigns = await getAllCampaigns(env);
    return createJsonResponse({ success: true, campaigns });
  } catch (error) {
    console.error('Error handling campaigns list:', error);
    return createJsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Handle campaign refresh link request
 */
export async function handleCampaignRefreshLink(request, env) {
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
    
    // Get the campaign
    const campaign = await env.CAMPAIGNS.get(`campaign:${campaignId}`, { type: 'json' });
    
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
        const healthCheck = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/health`, {
          headers: { 'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY }
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
          
          const response = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/api/pages/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY
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
    await env.CAMPAIGNS.put(`campaign:${campaignId}`, JSON.stringify(campaign));
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
 * Handle campaign stats request
 */
export async function handleCampaignStats(request, env) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('id');
    
    if (!campaignId) {
      return createJsonResponse({
        success: false,
        error: 'Campaign ID is required'
      }, 400);
    }
    
    // Get the campaign
    const campaign = await env.CAMPAIGNS.get(`campaign:${campaignId}`, { type: 'json' });
    
    if (!campaign) {
      return createJsonResponse({
        success: false,
        error: 'Campaign not found'
      }, 404);
    }
    
    // Get campaign stats
    let stats = await env.CAMPAIGNS.get(`stats:${campaignId}`, { type: 'json' }).catch(() => null);
    
    // If stats don't exist, create empty stats
    if (!stats) {
      stats = {
        tiktok: 0,
        nonTiktok: 0,
        visits: 0,
        lastVisit: 0
      };
    }
    
    // Get template info
    let templateName = 'Unknown';
    let templateType = 'Unknown';
    
    if (campaign.templateId) {
      const template = await getTemplate(campaign.templateId, env);
      if (template) {
        templateName = template.name;
        templateType = template.type;
      }
    }
    
    // Get whitehat template info if available
    let whitehatTemplateName = 'None';
    if (campaign.whitehatBehavior === 'template' && campaign.whitehatTemplateId) {
      const whitehatTemplate = await getTemplate(campaign.whitehatTemplateId, env);
      if (whitehatTemplate) {
        whitehatTemplateName = whitehatTemplate.name;
      }
    } else if (campaign.whitehatBehavior === 'redirect') {
      whitehatTemplateName = 'Redirect to URL';
    } else {
      whitehatTemplateName = '404 Page';
    }
    
    // Format dates and calculate percentages
    const lastVisitDate = stats.lastVisit ? new Date(stats.lastVisit).toLocaleString() : 'Never';
    const createdDate = campaign.created ? new Date(campaign.created).toLocaleString() : 'Unknown';
    
    const totalClicks = stats.tiktok + stats.nonTiktok;
    let tiktokPercentage = 0;
    let nonTiktokPercentage = 0;
    
    if (totalClicks > 0) {
      tiktokPercentage = ((stats.tiktok / totalClicks) * 100).toFixed(1);
      nonTiktokPercentage = ((stats.nonTiktok / totalClicks) * 100).toFixed(1);
    }
    
    // Determine whitehat status
    const remainingWhitehatClicks = Math.max(0, campaign.whitehatThreshold || 1 - totalClicks);
    const isWhitehatActive = remainingWhitehatClicks > 0;
    
    return createJsonResponse({
      success: true,
      campaign,
      stats,
      template: {
        name: templateName,
        type: templateType
      },
      whitehatTemplate: whitehatTemplateName,
      dates: {
        created: createdDate,
        lastVisit: lastVisitDate
      },
      percentages: {
        tiktok: tiktokPercentage,
        nonTiktok: nonTiktokPercentage
      },
      whitehatStatus: {
        active: isWhitehatActive,
        remaining: remainingWhitehatClicks
      }
    });
  } catch (error) {
    console.error('Error handling campaign stats:', error);
    return createJsonResponse({ 
      success: false, 
      error: `Error fetching campaign stats: ${error.message}` 
    }, 500);
  }
}

/**
 * Handle campaign threshold update
 */
export async function handleCampaignThresholdUpdate(request, env) {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return createJsonResponse({ 
        success: false, 
        error: 'Method not allowed' 
      }, 405);
    }
    
    // Get request data
    let requestData;
    const contentType = request.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      requestData = await request.json();
    } else {
      const formData = await request.formData();
      requestData = Object.fromEntries(formData.entries());
    }
    
    const { campaignId, whitehatThreshold } = requestData;
    
    if (!campaignId) {
      return createJsonResponse({
        success: false,
        error: 'Campaign ID is required'
      }, 400);
    }
    
    const thresholdValue = parseInt(whitehatThreshold, 10);
    if (isNaN(thresholdValue) || thresholdValue < 0) {
      return createJsonResponse({
        success: false,
        error: 'Invalid whitehat threshold value'
      }, 400);
    }
    
    // Get the campaign
    const campaign = await env.CAMPAIGNS.get(`campaign:${campaignId}`, { type: 'json' });
    
    if (!campaign) {
      return createJsonResponse({
        success: false,
        error: 'Campaign not found'
      }, 404);
    }
    
    // Update the threshold
    campaign.whitehatThreshold = thresholdValue;
    
    // Save the updated campaign
    await env.CAMPAIGNS.put(`campaign:${campaignId}`, JSON.stringify(campaign));
    
    console.log(`Updated whitehat threshold for campaign ${campaignId} to ${thresholdValue}`);
    
    return createJsonResponse({
      success: true,
      message: 'Whitehat threshold updated successfully',
      campaign: campaignId,
      newThreshold: thresholdValue
    });
  } catch (error) {
    console.error('Error updating whitehat threshold:', error);
    return createJsonResponse({ 
      success: false, 
      error: `Error updating whitehat threshold: ${error.message}` 
    }, 500);
  }
}

/**
 * Handle campaign creation
 */
export async function handleCampaignCreate(request, env) {
  // Handle form submission
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return createJsonResponse({
        success: false,
        error: 'Method not allowed'
      }, 405);
    }
    
    // Get request data
    let requestData;
    const contentType = request.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      requestData = await request.json();
    } else {
      const formData = await request.formData();
      requestData = Object.fromEntries(formData.entries());
    }
    
    // Extract campaign data
    const {
      campaignName,
      shopifyStoreId,
      templateId,
      redirectDomain,
      whitehatBehavior,
      whitehatTemplateId,
      whitehatURL
    } = requestData;
    
    const active = requestData.active === true || requestData.active === 'on' || requestData.active === 'true';
    
    // Process geo-specific affiliate links
    const geoRegions = Array.isArray(requestData.geoRegions) 
      ? requestData.geoRegions 
      : (requestData.geoRegions ? [requestData.geoRegions] : []);
    
    const geoLinks = {};
    for (const region of geoRegions) {
      const geoLink = requestData[`geoLinks-${region}`];
      if (geoLink && geoLink.trim() !== '') {
        geoLinks[region] = geoLink.trim();
      }
    }
    
    // Validate required fields
    if (!campaignName || !shopifyStoreId || !templateId) {
      return createJsonResponse({
        success: false,
        error: 'Required fields are missing. Please fill all required fields.'
      }, 400);
    }
    
    // Make sure at least one region is selected with a valid link
    if (Object.keys(geoLinks).length === 0) {
      return createJsonResponse({
        success: false,
        error: 'At least one region with a valid affiliate link is required.'
      }, 400);
    }
    
    // Create a path for the campaign based on name
    const subid = campaignName.toLowerCase()
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
      name: campaignName,
      subid,
      templateId,
      affiliateLink, // Keep for backward compatibility
      geoLinks,
      shopifyStoreId,
      redirectDomain,
      tikTokRoutingEnabled: true, // Always set to true since we removed the option
      allowedRegions: Object.keys(geoLinks),
      whitehatBehavior: whitehatBehavior || '404-page',
      whitehatTemplateId: whitehatTemplateId || '',
      whitehatURL: whitehatURL || '',
      whitehatThreshold: 1, // Default value
      active, // Set from form input
      created: Date.now(),
      updated: Date.now(),
      stats: {
        tiktok: 0,
        nonTiktok: 0,
        visits: 0,
        lastVisit: 0
      }
    };
    
    // Create Shopify page through the Shopify API Worker
    try {
      // Get the template info
      const template = await getTemplate(templateId, env);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      // Prepare template content based on type
      let templateContent = '';
      if (template.type === 'html') {
        templateContent = await env.TEMPLATES.get(`template:${templateId}:content`) || '';
      } else if (template.type === 'googleform') {
        // For Google Forms, we use the URL as the content
        templateContent = template.url || '';
      }
      
      const response = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/api/pages/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY
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
      return createJsonResponse({
        success: false,
        error: `Error creating Shopify page: ${error.message}`
      }, 500);
    }
    
    // Save the campaign
    await env.CAMPAIGNS.put(`campaign:${campaignId}`, JSON.stringify(campaign));
    
    return createJsonResponse({
      success: true,
      message: 'Campaign created successfully',
      campaignId,
      campaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return createJsonResponse({
      success: false,
      error: `Error creating campaign: ${error.message}`
    }, 500);
  }
}

/**
 * Handle campaign edit
 */
export async function handleCampaignEdit(request, env) {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return createJsonResponse({
        success: false,
        error: 'Method not allowed'
      }, 405);
    }
    
    // Get request data
    let requestData;
    const contentType = request.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      requestData = await request.json();
    } else {
      const formData = await request.formData();
      requestData = Object.fromEntries(formData.entries());
    }
    
    const campaignId = requestData.id;
    
    if (!campaignId) {
      return createJsonResponse({
        success: false,
        error: 'Campaign ID is required'
      }, 400);
    }
    
    // Get the campaign
    const campaign = await env.CAMPAIGNS.get(`campaign:${campaignId}`, { type: 'json' });
    
    if (!campaign) {
      return createJsonResponse({
        success: false,
        error: 'Campaign not found'
      }, 404);
    }
    
    // Extract campaign data
    const {
      campaignName,
      shopifyStoreId,
      templateId,
      redirectDomain,
      whitehatBehavior,
      whitehatTemplateId,
      whitehatURL
    } = requestData;
    
    const active = requestData.active === true || requestData.active === 'on' || requestData.active === 'true';
    
    // Process geo-specific affiliate links
    const geoRegions = Array.isArray(requestData.geoRegions) 
      ? requestData.geoRegions 
      : (requestData.geoRegions ? [requestData.geoRegions] : []);
    
    const geoLinks = {};
    for (const region of geoRegions) {
      const geoLink = requestData[`geoLinks-${region}`];
      if (geoLink && geoLink.trim() !== '') {
        geoLinks[region] = geoLink.trim();
      }
    }
    
    // Validate required fields
    if (!campaignName || !shopifyStoreId || !templateId) {
      return createJsonResponse({
        success: false,
        error: 'Required fields are missing. Please fill all required fields.'
      }, 400);
    }
    
    // Make sure at least one region is selected with a valid link
    if (Object.keys(geoLinks).length === 0) {
      return createJsonResponse({
        success: false,
        error: 'At least one region with a valid affiliate link is required.'
      }, 400);
    }
    
    // Get default affiliate link from the first geo link (for API compatibility)
    const firstGeoRegion = Object.keys(geoLinks)[0];
    const affiliateLink = geoLinks[firstGeoRegion];
    
    // Update campaign
    campaign.name = campaignName;
    campaign.templateId = templateId;
    campaign.affiliateLink = affiliateLink; // Keep for backward compatibility
    campaign.geoLinks = geoLinks;
    campaign.redirectDomain = redirectDomain;
    campaign.tikTokRoutingEnabled = true; // Always set to true
    campaign.active = active;
    campaign.allowedRegions = Object.keys(geoLinks);
    campaign.whitehatBehavior = whitehatBehavior || '404-page';
    campaign.whitehatTemplateId = whitehatTemplateId || '';
    campaign.whitehatURL = whitehatURL || '';
    campaign.updated = Date.now();
    
    // If shopify store changed, update the Shopify page
    if (campaign.shopifyStoreId !== shopifyStoreId) {
      campaign.shopifyStoreId = shopifyStoreId;
      
      // Create new Shopify page
      try {
        // First, get the template content
        let templateContent = '';
        const template = await getTemplate(templateId, env);
        if (template) {
          if (template.type === 'html') {
            templateContent = await env.TEMPLATES.get(`template:${templateId}:content`) || '';
          } else if (template.type === 'googleform') {
            templateContent = template.url || '';
          }
        }
        
        const response = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/api/pages/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY
          },
          body: JSON.stringify({
            storeId: shopifyStoreId,
            campaignId: campaign.id,
            affiliateLink, // Include for API compatibility
            geoLinks,
            templateId,
            templateContent: templateContent,
            subid: campaign.subid,
            redirectDomain
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
        return createJsonResponse({
          success: false,
          error: `Error creating Shopify page: ${error.message}`
        }, 500);
      }
    } else {
      // Just update the existing page
      try {
        // First, get the template content
        let templateContent = '';
        const template = await getTemplate(templateId, env);
        if (template) {
          if (template.type === 'html') {
            templateContent = await env.TEMPLATES.get(`template:${templateId}:content`) || '';
          } else if (template.type === 'googleform') {
            templateContent = template.url || '';
          }
        }
        
        const response = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/api/pages/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY
          },
          body: JSON.stringify({
            storeId: shopifyStoreId,
            campaignId: campaign.id,
            pageId: campaign.shopifyPage.id,
            affiliateLink, // Include for API compatibility
            geoLinks,
            templateId,
            templateContent: templateContent,
            redirectDomain
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update Shopify page: ${errorText}`);
        }
      } catch (error) {
        console.error('Error updating Shopify page:', error);
        return createJsonResponse({
          success: false,
          error: `Error updating Shopify page: ${error.message}`
        }, 500);
      }
    }
    
    // Save the updated campaign
    await env.CAMPAIGNS.put(`campaign:${campaignId}`, JSON.stringify(campaign));
    
    return createJsonResponse({
      success: true,
      message: 'Campaign updated successfully',
      campaignId,
      campaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return createJsonResponse({
      success: false,
      error: `Error updating campaign: ${error.message}`
    }, 500);
  }
}

/**
 * Handle campaign deletion
 */
export async function handleCampaignDelete(request, env) {
  try {
    // Only accept POST requests for deletion
    if (request.method !== 'POST') {
      return createJsonResponse({
        success: false,
        error: 'Method not allowed'
      }, 405);
    }
    
    // Get request data
    let requestData;
    const contentType = request.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      requestData = await request.json();
    } else {
      try {
        const formData = await request.formData();
        requestData = Object.fromEntries(formData.entries());
      } catch (e) {
        // If data can't be parsed, check URL parameters
        const url = new URL(request.url);
        const campaignId = url.searchParams.get('id');
        requestData = { id: campaignId };
      }
    }
    
    const campaignId = requestData.id;
    
    if (!campaignId) {
      return createJsonResponse({
        success: false,
        error: 'Campaign ID is required'
      }, 400);
    }
    
    // Get the campaign
    const campaign = await env.CAMPAIGNS.get(`campaign:${campaignId}`, { type: 'json' });
    
    if (!campaign) {
      return createJsonResponse({
        success: false,
        error: 'Campaign not found'
      }, 404);
    }
    
    // Delete the Shopify page if it exists
    if (campaign.shopifyPage && campaign.shopifyPage.id) {
      try {
        const response = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/api/pages/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY
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
    await env.CAMPAIGNS.delete(`campaign:${campaignId}`);
    
    return createJsonResponse({
      success: true,
      message: 'Campaign deleted successfully',
      campaignId
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return createJsonResponse({
      success: false,
      error: `Error deleting campaign: ${error.message}`
    }, 500);
  }
}