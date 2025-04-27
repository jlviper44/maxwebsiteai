/**
 * API Services
 */

// Campaign API

/**
 * Fetch all campaigns
 */
export async function fetchCampaigns() {
  const response = await fetch('/api/campaigns');
  return await response.json();
}

/**
 * Fetch a single campaign by ID
 */
export async function fetchCampaign(id) {
  const response = await fetch(`/api/campaigns?id=${id}`);
  return await response.json();
}

/**
 * Fetch campaign statistics
 */
export async function fetchCampaignStats(id) {
  const response = await fetch(`/api/campaigns/stats?id=${id}`);
  return await response.json();
}

/**
 * Create a new campaign
 */
export async function createCampaign(campaignData) {
  const response = await fetch('/api/campaigns/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(campaignData)
  });
  return await response.json();
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(campaignData) {
  const response = await fetch('/api/campaigns/edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(campaignData)
  });
  return await response.json();
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id) {
  const response = await fetch(`/api/campaigns/delete?id=${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

/**
 * Refresh a campaign link
 */
export async function refreshCampaignLink(id) {
  const response = await fetch(`/api/campaigns/refresh?id=${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

/**
 * Update a campaign's whitehat threshold
 */
export async function updateCampaignThreshold(id, threshold) {
  const response = await fetch('/api/campaigns/update-threshold', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      campaignId: id,
      whitehatThreshold: threshold
    })
  });
  return await response.json();
}

// Template API

/**
 * Fetch all templates
 */
export async function fetchTemplates() {
  const response = await fetch('/api/templates');
  return await response.json();
}

// Store API

/**
 * Fetch all Shopify stores
 */
export async function fetchStores() {
  const response = await fetch('/api/stores');
  return await response.json();
}