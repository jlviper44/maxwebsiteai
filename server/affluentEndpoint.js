/**
 * affluentEndpoint.js - Cloudflare Worker endpoint for Affluent API clicks, conversions, and subaffiliate summary
 */

import { getClicks, getConversions, getSubaffiliateSummary } from './affiliateApi.js';

/**
 * Handles requests to the Affluent API endpoints
 * 
 * @param {Request} request - The incoming request object
 * @param {string} endpoint - The endpoint to use ('clicks' or 'conversions')
 * @returns {Response} - The response object
 */
export async function handleAffiliateRequest(request, endpoint) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body. JSON expected.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get API key from request body
    const api_key = requestBody.api_key;
    
    if (!api_key) {
      return new Response(
        JSON.stringify({ error: 'API key is required. Please provide it in the request body.' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate date formats
    const startDate = requestBody.start_date;
    const endDate = requestBody.end_date;
    
    // Validate date format if provided (YYYY-MM-DD HH:MM:SS)
    const dateRegex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;
    if (startDate && !dateRegex.test(startDate)) {
      return new Response(
        JSON.stringify({ error: 'Invalid start_date format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS format.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (endDate && !dateRegex.test(endDate)) {
      return new Response(
        JSON.stringify({ error: 'Invalid end_date format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS format.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract fields parameter (should be an array)
    const fields = requestBody.fields;
    
    // Validate fields format if provided
    if (fields !== undefined && !Array.isArray(fields)) {
      return new Response(
        JSON.stringify({ error: 'Invalid fields format. Fields must be an array.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the required parameters from request body
    const params = {
      api_key: api_key,
      start_date: startDate,
      end_date: endDate,
      affiliate_id: requestBody.affiliate_id,
      fields: fields
    };

    // Remove undefined parameters
    Object.keys(params).forEach(key => 
      params[key] === undefined && delete params[key]
    );

    // Choose the correct API function based on endpoint
    let apiFunction;
    if (endpoint === 'clicks') {
      apiFunction = getClicks;
    } else if (endpoint === 'conversions') {
      apiFunction = getConversions;
    } else if (endpoint === 'subaffiliatesummary') {
      apiFunction = getSubaffiliateSummary;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint requested' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch data from Affluent API
    const data = await apiFunction(params);

    // Return the data
    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error(`${endpoint} endpoint error:`, error);

    // Return error response
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { 
        status: error.message.includes('API key') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Helper functions that maintain the original function signatures
 * for backward compatibility
 */
export async function handleClicksRequest(request) {
  return handleAffiliateRequest(request, 'clicks');
}

export async function handleConversionsRequest(request) {
  return handleAffiliateRequest(request, 'conversions');
}

/**
 * Handles requests to the Affluent subaffiliate summary endpoint
 * 
 * @param {Request} request - The incoming request object
 * @returns {Response} - The response object
 */
export async function handleSubaffiliateSummaryRequest(request) {
  return handleAffiliateRequest(request, 'subaffiliatesummary');
}