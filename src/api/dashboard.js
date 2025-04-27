/**
 * Dashboard API service
 */

/**
 * Fetch dashboard data
 */
export async function fetchDashboardData() {
  const response = await fetch('/api/dashboard');
  return await response.json();
}

/**
 * Update global settings
 */
export async function updateSettings(settingsData) {
  const response = await fetch('/api/settings/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settingsData)
  });
  return await response.json();
}