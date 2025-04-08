/**
 * affiliateApi.js - Interface with Affluent API for clicks and conversions data
 * Documentation: https://login.affluentco.com/affiliates/api/docs#/Clicks
 */

// API configuration
const API_CONFIG = {
  baseUrl: 'https://login.affluentco.com/affiliates/api/reports',
  endpoints: {
    clicks: '/clicks',
    conversions: '/conversions',
    subaffiliatesummary: '/subaffiliatesummary'
  }
};

/**
 * Retrieves clicks data from Affluent API
 * 
 * @param {Object} options - Request options
 * @param {string} options.api_key - Your Affluent API key
 * @param {string} options.start_date - Start date (YYYY-MM-DD)
 * @param {string} options.end_date - End date (YYYY-MM-DD)
 * @param {string} options.affiliate_id - Filter by affiliate ID
 * @param {Array<string>} options.fields - Array of specific fields to retrieve
 * @returns {Promise<Object>} - Clicks data from Affluent API
 */
async function getClicks(options = {}) {
  // Required parameters check
  if (!options.api_key) {
    throw new Error('API key is required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  
  // Add API key as a query parameter instead of header
  queryParams.append('api_key', options.api_key);
  
  // Add parameters without additional URI encoding (URLSearchParams handles this)
  if (options.start_date) {
    // The API might require a specific format for date-time
    // Format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
    queryParams.append('start_date', options.start_date);
  }
  
  if (options.end_date) {
    queryParams.append('end_date', options.end_date);
  }
  
  if (options.affiliate_id) queryParams.append('affiliate_id', options.affiliate_id);
  
  // Handle fields parameter (array of fields to include)
  if (options.fields && Array.isArray(options.fields)) {
    options.fields.forEach(field => {
      queryParams.append('fields', field);
    });
  }

  // Build request URL
  const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.clicks}?${queryParams.toString()}`;
  try {
    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
      // API key is now in URL parameters, not in Authorization header
    });

    // Check if request was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `API request failed with status ${response.status}: ${
          errorData?.message || response.statusText
        }`
      );
    }

    // Parse and return response data
    return await response.json();
  } catch (error) {
    console.error('Error fetching clicks data:', error);
    throw error;
  }
}

/**
 * Retrieves conversions data from Affluent API
 * 
 * @param {Object} options - Request options
 * @param {string} options.api_key - Your Affluent API key
 * @param {string} options.start_date - Start date (YYYY-MM-DD)
 * @param {string} options.end_date - End date (YYYY-MM-DD)
 * @param {string} options.affiliate_id - Filter by affiliate ID
 * @param {Array<string>} options.fields - Array of specific fields to retrieve
 * @returns {Promise<Object>} - Conversions data from Affluent API
 */
async function getConversions(options = {}) {
  // Required parameters check
  if (!options.api_key) {
    throw new Error('API key is required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  
  // Add API key as a query parameter instead of header
  queryParams.append('api_key', options.api_key);
  
  // Add parameters without additional URI encoding (URLSearchParams handles this)
  if (options.start_date) {
    // The API might require a specific format for date-time
    // Format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
    queryParams.append('start_date', options.start_date);
  }
  
  if (options.end_date) {
    queryParams.append('end_date', options.end_date);
  }
  
  if (options.affiliate_id) queryParams.append('affiliate_id', options.affiliate_id);
  
  // Handle fields parameter (array of fields to include)
  if (options.fields && Array.isArray(options.fields)) {
    options.fields.forEach(field => {
      queryParams.append('fields', field);
    });
  }

  // Build request URL
  const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.conversions}?${queryParams.toString()}`;
  try {
    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
      // API key is now in URL parameters, not in Authorization header
    });

    // Check if request was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `API request failed with status ${response.status}: ${
          errorData?.message || response.statusText
        }`
      );
    }

    // Parse and return response data
    return await response.json();
  } catch (error) {
    console.error('Error fetching conversions data:', error);
    throw error;
  }
}


/**
 * Retrieves subaffiliate summary data from Affluent API
 * 
 * @param {Object} options - Request options
 * @param {string} options.api_key - Your Affluent API key
 * @param {string} options.start_date - Start date (YYYY-MM-DD)
 * @param {string} options.end_date - End date (YYYY-MM-DD)
 * @param {string} options.affiliate_id - Filter by affiliate ID
 * @param {Array<string>} options.fields - Array of specific fields to retrieve
 * @returns {Promise<Object>} - Subaffiliate summary data from Affluent API
 */
async function getSubaffiliateSummary(options = {}) {
  // Required parameters check
  if (!options.api_key) {
    throw new Error('API key is required');
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  
  // Add API key as a query parameter instead of header
  queryParams.append('api_key', options.api_key);
  
  // Add parameters without additional URI encoding (URLSearchParams handles this)
  if (options.start_date) {
    // The API might require a specific format for date-time
    // Format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
    queryParams.append('start_date', options.start_date);
  }
  
  if (options.end_date) {
    queryParams.append('end_date', options.end_date);
  }
  
  if (options.affiliate_id) queryParams.append('affiliate_id', options.affiliate_id);
  
  // Handle fields parameter (array of fields to include)
  if (options.fields && Array.isArray(options.fields)) {
    options.fields.forEach(field => {
      queryParams.append('fields', field);
    });
  }

  // Build request URL
  const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subaffiliatesummary}?${queryParams.toString()}`;
  try {
    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
      // API key is now in URL parameters, not in Authorization header
    });

    // Check if request was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `API request failed with status ${response.status}: ${
          errorData?.message || response.statusText
        }`
      );
    }

    // Parse and return response data
    return await response.json();
  } catch (error) {
    console.error('Error fetching subaffiliate summary data:', error);
    throw error;
  }
}

// Update the export statement to include the new function
export {
  getClicks,
  getConversions,
  getSubaffiliateSummary
};