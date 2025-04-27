/**
 * Dashboard API service
 */

/**
 * Fetch dashboard data
 */
export async function fetchDashboardData() {
  try {
    const response = await fetch('/api/dashboard');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in fetchDashboardData:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch dashboard data'
    };
  }
}

/**
 * Update global settings with retry logic
 */
export async function updateSettings(settingsData, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch('/api/settings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settingsData)
      });
      
      // Check if the response was ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }
      
      return result;
    } catch (error) {
      console.error(`Settings update failed (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      // If we've reached max retries, return an error response
      if (retries >= maxRetries) {
        return {
          success: false,
          error: error.message || 'Failed to update settings after multiple attempts'
        };
      }
      
      // Wait before trying again (with exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
}