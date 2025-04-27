/**
 * Shopify store handler functionality for API endpoints
 */

import { createJsonResponse } from './utils.js';

/**
 * Fetch all Shopify stores from the Shopify API Worker
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
 * Handle Shopify stores list request
 */
export async function handleShopifyStoresList(request, env) {
  try {
    const stores = await fetchShopifyStores(env);
    return createJsonResponse({ success: true, stores });
  } catch (error) {
    console.error('Error handling Shopify stores list:', error);
    return createJsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Handle Shopify store detail request
 */
export async function handleShopifyStoreDetail(request, env) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get('id');
    
    if (!storeId) {
      return createJsonResponse({
        success: false,
        error: 'Store ID is required'
      }, 400);
    }
    
    // Get store data from Shopify API Worker
    const response = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/api/stores/get?id=${storeId}`, {
      headers: { 'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return createJsonResponse({
        success: false,
        error: `Failed to get store: ${errorText}`
      }, response.status);
    }
    
    const responseData = await response.json();
    
    return createJsonResponse({
      success: true,
      store: responseData.store
    });
  } catch (error) {
    console.error('Error handling Shopify store detail:', error);
    return createJsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Handle Shopify store test request
 */
export async function handleShopifyStoreTest(request, env) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get('id');
    
    if (!storeId) {
      return createJsonResponse({
        success: false,
        error: 'Store ID is required'
      }, 400);
    }
    
    // Test store via Shopify API Worker
    const response = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/api/stores/test?id=${storeId}`, {
      headers: { 'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return createJsonResponse({
        success: false,
        error: `Store test failed: ${errorText}`
      }, response.status);
    }
    
    const responseData = await response.json();
    
    // Get store data
    const storeResponse = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/api/stores/get?id=${storeId}`, {
      headers: { 'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY }
    });
    
    if (!storeResponse.ok) {
      return createJsonResponse({
        success: false,
        error: 'Failed to get store details'
      }, storeResponse.status);
    }
    
    const storeData = await storeResponse.json();
    
    return createJsonResponse({
      success: true,
      shop: responseData.shop,
      store: storeData.store
    });
  } catch (error) {
    console.error('Error testing Shopify store:', error);
    return createJsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Handle Shopify store creation
 */
export async function handleShopifyStoreAdd(request, env) {
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
    
    // Validate required fields
    const { storeName, storeUrl, apiKey, apiSecret, accessToken } = requestData;
    const active = requestData.active === true || requestData.active === 'on' || requestData.active === 'true';
    
    if (!storeName || !storeUrl || !apiKey || !apiSecret || !accessToken) {
      return createJsonResponse({
        success: false,
        error: 'All fields are required'
      }, 400);
    }
    
    // Prepare store data
    const storeData = {
      name: storeName,
      url: storeUrl,
      apiKey,
      apiSecret,
      accessToken,
      active
    };
    
    // Add store via Shopify API Worker
    const response = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/api/stores/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY
      },
      body: JSON.stringify(storeData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return createJsonResponse({
        success: false,
        error: `Failed to add store: ${errorText}`
      }, response.status);
    }
    
    const responseData = await response.json();
    
    return createJsonResponse({
      success: true,
      message: 'Shopify store added successfully',
      store: responseData.store
    });
  } catch (error) {
    console.error('Error adding Shopify store:', error);
    return createJsonResponse({
      success: false,
      error: `Error adding Shopify store: ${error.message}`
    }, 500);
  }
}

/**
 * Handle Shopify store update
 */
export async function handleShopifyStoreEdit(request, env) {
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
    
    // Validate required fields
    const { storeId, storeName, storeUrl } = requestData;
    const active = requestData.active === true || requestData.active === 'on' || requestData.active === 'true';
    
    if (!storeId || !storeName || !storeUrl) {
      return createJsonResponse({
        success: false,
        error: 'Store ID, name, and URL are required'
      }, 400);
    }
    
    // Prepare store data
    const storeData = {
      id: storeId,
      name: storeName,
      url: storeUrl,
      active
    };
    
    // Add optional fields if provided
    const apiKey = requestData.apiKey;
    const apiSecret = requestData.apiSecret;
    const accessToken = requestData.accessToken;
    
    if (apiKey && apiKey.trim() !== '') storeData.apiKey = apiKey;
    if (apiSecret && apiSecret.trim() !== '') storeData.apiSecret = apiSecret;
    if (accessToken && accessToken.trim() !== '') storeData.accessToken = accessToken;
    
    // Update store via Shopify API Worker
    const response = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/api/stores/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY
      },
      body: JSON.stringify(storeData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return createJsonResponse({
        success: false,
        error: `Failed to update store: ${errorText}`
      }, response.status);
    }
    
    const responseData = await response.json();
    
    return createJsonResponse({
      success: true,
      message: 'Shopify store updated successfully',
      store: responseData.store
    });
  } catch (error) {
    console.error('Error updating Shopify store:', error);
    return createJsonResponse({
      success: false,
      error: `Error updating Shopify store: ${error.message}`
    }, 500);
  }
}

/**
 * Check if store is used by any campaigns
 */
export async function checkStoreUsage(storeId, env) {
  try {
    // Get all campaigns
    const keys = await env.CAMPAIGNS.list({ prefix: 'campaign:' });
    
    let usedByCampaigns = [];
    
    for (const key of keys.keys) {
      const campaign = await env.CAMPAIGNS.get(key.name, { type: 'json' });
      if (campaign && campaign.shopifyStoreId === storeId) {
        usedByCampaigns.push({
          id: campaign.id,
          name: campaign.name
        });
      }
    }
    
    return usedByCampaigns;
  } catch (error) {
    console.error('Error checking store usage:', error);
    throw error;
  }
}

/**
 * Handle Shopify store usage check
 */
export async function handleShopifyStoreUsageCheck(request, env) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get('id');
    
    if (!storeId) {
      return createJsonResponse({
        success: false,
        error: 'Store ID is required'
      }, 400);
    }
    
    // Check if store is used by any campaigns
    const usingCampaigns = await checkStoreUsage(storeId, env);
    
    return createJsonResponse({
      success: true,
      storeId,
      usedBy: usingCampaigns,
      isUsed: usingCampaigns.length > 0
    });
  } catch (error) {
    console.error('Error checking store usage:', error);
    return createJsonResponse({
      success: false,
      error: `Error checking store usage: ${error.message}`
    }, 500);
  }
}

/**
 * Handle Shopify store delete
 */
export async function handleShopifyStoreDelete(request, env) {
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
      try {
        const formData = await request.formData();
        requestData = Object.fromEntries(formData.entries());
      } catch (e) {
        // If data can't be parsed, check URL parameters
        const url = new URL(request.url);
        const storeId = url.searchParams.get('id');
        requestData = { storeId };
      }
    }
    
    const storeId = requestData.storeId;
    
    if (!storeId) {
      return createJsonResponse({
        success: false,
        error: 'Store ID is required'
      }, 400);
    }
    
    // Check if store is used by any campaigns
    const usingCampaigns = await checkStoreUsage(storeId, env);
    
    if (usingCampaigns.length > 0) {
      return createJsonResponse({
        success: false,
        error: 'Cannot delete store. It is used by one or more campaigns.',
        campaigns: usingCampaigns
      }, 409);
    }
    
    // Delete store via Shopify API Worker
    const response = await fetch(`${env.CONFIG.WORKER_URLS.SHOPIFY}/api/stores/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': env.CONFIG.API_KEYS.SHOPIFY
      },
      body: JSON.stringify({ id: storeId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return createJsonResponse({
        success: false,
        error: `Failed to delete store: ${errorText}`
      }, response.status);
    }
    
    return createJsonResponse({
      success: true,
      message: 'Shopify store deleted successfully',
      storeId
    });
  } catch (error) {
    console.error('Error deleting Shopify store:', error);
    return createJsonResponse({
      success: false,
      error: `Error deleting Shopify store: ${error.message}`
    }, 500);
  }
}