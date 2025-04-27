/**
 * Dashboard handler functionality for API endpoints
 */

import { createJsonResponse } from './utils.js';

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
 * Get all templates
 */
async function getAllTemplates(env) {
  try {
    // List all template keys
    const templatesList = await env.TEMPLATES.list({ prefix: 'template:' });
    
    // Fetch each template
    const templates = [];
    for (const key of templatesList.keys) {
      try {
        // Skip content entries
        if (key.name.includes(':content')) continue;
        
        const templateData = await env.TEMPLATES.get(key.name, { type: 'json' });
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
 * Fetch Shopify stores from the Shopify API Worker
 */
async function fetchShopifyStores(env) {
  try {
    const response = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/api/stores/list`, {
      headers: { 'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY }
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
 * Get global settings
 */
async function getGlobalSettings(env) {
  try {
    console.log('Fetching global settings from KV store');
    const tikTokRoutingEnabled = await env.SETTINGS.get('tikTokRoutingEnabled') === 'true';
    const darkModeEnabled = await env.SETTINGS.get('darkModeEnabled') === 'true';
    
    console.log('Settings retrieved:', { tikTokRoutingEnabled, darkModeEnabled });
    
    return {
      tikTokRoutingEnabled,
      darkModeEnabled
    };
  } catch (error) {
    console.error('Error fetching global settings:', error);
    return {
      tikTokRoutingEnabled: false,
      darkModeEnabled: false
    };
  }
}

/**
 * Handle dashboard data request
 */
export async function handleDashboardData(request, env) {
  try {
    // Get global settings
    const settings = await getGlobalSettings(env);
    
    // Get data
    const [campaigns, templates, stores] = await Promise.all([
      getAllCampaigns(env),
      getAllTemplates(env),
      fetchShopifyStores(env)
    ]);
    
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
    
    return createJsonResponse({
      success: true,
      settings,
      stats: {
        campaigns: campaigns.length,
        activeCampaigns,
        templates: templates.length,
        stores: stores.length,
        totalTikTokClicks,
        totalNonTikTokClicks,
        totalClicks,
        conversionRate
      }
    });
  } catch (error) {
    console.error('Error handling dashboard data:', error);
    return createJsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Handle settings update
 */
export async function handleSettingsUpdate(request, env) {
  try {
    console.log('Received settings update request');
    
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
      console.log('Received settings update (JSON):', requestData);
    } else {
      const formData = await request.formData();
      requestData = Object.fromEntries(formData.entries());
      console.log('Received settings update (FormData):', requestData);
    }
    
    // Update settings
    const tikTokRoutingEnabled = requestData.tikTokRoutingEnabled === true || 
                                 requestData.tikTokRoutingEnabled === 'on' || 
                                 requestData.tikTokRoutingEnabled === 'true';
    
    const darkModeEnabled = requestData.darkModeEnabled === true || 
                            requestData.darkModeEnabled === 'on' || 
                            requestData.darkModeEnabled === 'true';
    
    console.log('Processed settings values:', {
      tikTokRoutingEnabled,
      darkModeEnabled
    });
    
    try {
      // Debug existing values
      const existingTikTok = await env.SETTINGS.get('tikTokRoutingEnabled');
      const existingDarkMode = await env.SETTINGS.get('darkModeEnabled');
      console.log('Existing settings:', { existingTikTok, existingDarkMode });
      
      // Save new values
      await env.SETTINGS.put('tikTokRoutingEnabled', tikTokRoutingEnabled.toString());
      await env.SETTINGS.put('darkModeEnabled', darkModeEnabled.toString());
      
      // Verify update
      const newTikTok = await env.SETTINGS.get('tikTokRoutingEnabled');
      const newDarkMode = await env.SETTINGS.get('darkModeEnabled');
      console.log('Updated settings:', { newTikTok, newDarkMode });
      
      return createJsonResponse({
        success: true,
        message: 'Settings updated successfully',
        settings: {
          tikTokRoutingEnabled,
          darkModeEnabled
        }
      });
    } catch (storageError) {
      console.error('Error writing to KV store:', storageError);
      return createJsonResponse({
        success: false,
        error: `Error updating settings in storage: ${storageError.message}`
      }, 500);
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    return createJsonResponse({
      success: false,
      error: `Error updating settings: ${error.message}`
    }, 500);
  }
}