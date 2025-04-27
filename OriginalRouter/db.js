/**
 * Database operations
 */

/**
 * Get all campaigns
 */
async function getAllCampaigns() {
  try {
    // List all campaign keys
    const campaignsList = await CAMPAIGNS.list({ prefix: 'campaign:' });
    
    // Fetch each campaign
    const campaigns = [];
    for (const key of campaignsList.keys) {
      try {
        const campaignData = await CAMPAIGNS.get(key.name, { type: 'json' });
        if (campaignData && campaignData.id) {
          campaigns.push(campaignData);
        }
      } catch (error) {
        console.error(`Error fetching campaign ${key.name}:`, error);
      }
    }
    
    return campaigns;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
}