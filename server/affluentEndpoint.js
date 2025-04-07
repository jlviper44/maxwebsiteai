/**
 * affluentEndpoint.js - Cloudflare Worker endpoint for Affluent API clicks
 */

import { getClicks } from './affiliateApi.js';

/**
 * Handles requests to the Affluent clicks endpoint
 * 
 * @param {Request} request - The incoming request object
 * @returns {Response} - The response object
 */
export async function handleClicksRequest(request) {
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
    
    // Validate date format if provided (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      return new Response(
        JSON.stringify({ error: 'Invalid start_date format. Use YYYY-MM-DD format.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (endDate && !dateRegex.test(endDate)) {
      return new Response(
        JSON.stringify({ error: 'Invalid end_date format. Use YYYY-MM-DD format.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the required parameters from request body
    const params = {
      api_key: api_key,
      start_date: startDate,
      end_date: endDate,
      affiliate_id: requestBody.affiliate_id
    };

    // Remove undefined parameters
    Object.keys(params).forEach(key => 
      params[key] === undefined && delete params[key]
    );

    // Fetch clicks data from Affluent API
    const clicksData = await getClicks(params);

    // Return the clicks data
    return new Response(
      JSON.stringify(clicksData),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Clicks endpoint error:', error);

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