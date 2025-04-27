/**
 * Dashboard API service
 */

/**
 * Fetch dashboard data
 */
export async function fetchDashboardData() {
  try {
    console.log('Fetching dashboard data...');
    const response = await fetch('/api/dashboard');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard data: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Dashboard data received:', data);
    return data;
  } catch (error) {
    console.error('Error in fetchDashboardData:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch dashboard data'
    };
  }
}

/**
 * Update global settings with improved error handling
 */
export async function updateSettings(settingsData) {
  try {
    console.log('Sending settings update:', settingsData);
    
    const response = await fetch('/api/settings/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settingsData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('Settings update response:', responseData);
    
    return responseData;
  } catch (error) {
    console.error('Error updating settings:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred while updating settings'
    };
  }
}