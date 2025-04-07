/**
 * affiliateApi.js - Interface with Affluent API for clicks data
 * Documentation: https://login.affluentco.com/affiliates/api/docs#/Clicks
 */

// API configuration
const API_CONFIG = {
  baseUrl: 'https://login.affluentco.com/affiliates/api/reports',
  endpoints: {
    clicks: '/clicks',
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
  
  // Add parameters with proper URI encoding
  // The dates need to be properly URI encoded in the final URL
  if (options.start_date) {
    const encodedStartDate = encodeURIComponent(options.start_date);
    queryParams.append('start_date', encodedStartDate);
  }
  
  if (options.end_date) {
    const encodedEndDate = encodeURIComponent(options.end_date);
    queryParams.append('end_date', encodedEndDate);
  }
  
  if (options.affiliate_id) queryParams.append('affiliate_id', options.affiliate_id);

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

// Export function
export {
  getClicks
};