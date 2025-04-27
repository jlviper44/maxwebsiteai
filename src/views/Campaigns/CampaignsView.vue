<template>
  <div class="campaigns-view">
    <div class="header-actions mb-4">
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus"
        to="/campaigns/create"
        variant="elevated"
        class="create-btn"
      >
        Create New Campaign
      </v-btn>
    </div>
    
    <v-card elevation="2" rounded="lg" class="campaigns-card">
      <v-card-title class="text-h5 pb-2 d-flex align-center">
        <v-icon icon="mdi-bullhorn" color="primary" class="mr-2"></v-icon>
        Your Campaigns
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text>
        <div v-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="mt-4 text-medium-emphasis">Loading campaigns...</p>
        </div>
        
        <div v-else-if="campaigns.length === 0" class="empty-state py-8">
          <v-icon icon="mdi-bullhorn-outline" size="64" class="mb-4 opacity-50"></v-icon>
          <p class="text-h6">No campaigns found</p>
          <p class="text-medium-emphasis mb-4">Create your first campaign to get started.</p>
          <v-btn 
            color="primary" 
            prepend-icon="mdi-plus" 
            to="/campaigns/create" 
            variant="elevated"
          >
            Create New Campaign
          </v-btn>
        </div>
        
        <div v-else class="table-container">
          <v-table class="campaigns-table">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Status</th>
                <th class="text-left">Actions</th>
                <th class="text-left">Redirect Domain</th>
                <th class="text-left">Traffic Routing</th>
                <th class="text-left">TikTok Clicks</th>
                <th class="text-center">Manage</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="campaign in campaigns" :key="campaign.id" class="campaign-row">
                <td>
                  <div class="font-weight-medium">{{ campaign.name }}</div>
                </td>
                <td>
                  <v-chip
                    :color="campaign.active ? 'success' : 'error'"
                    size="small"
                    variant="elevated"
                  >
                    {{ campaign.active ? 'Active' : 'Inactive' }}
                  </v-chip>
                </td>
                <td>
                  <div class="d-flex align-center">
                    <v-btn 
                      size="small" 
                      variant="tonal"
                      color="primary"
                      prepend-icon="mdi-content-copy"
                      @click="copyLink(getCampaignLink(campaign))"
                      class="mr-1"
                      density="comfortable"
                    >
                      Copy
                    </v-btn>
                    <v-btn 
                      size="small" 
                      variant="tonal"
                      color="secondary"
                      prepend-icon="mdi-refresh"
                      @click="refreshLink(campaign.id)"
                      :loading="refreshingId === campaign.id"
                      density="comfortable"
                    >
                      Refresh
                    </v-btn>
                  </div>
                </td>
                <td class="domain-cell">
                  <div class="domain-text">{{ formatRedirectDomain(campaign.redirectDomain) }}</div>
                </td>
                <td>
                  <v-chip
                    :color="campaign.tikTokRoutingEnabled ? 'success' : 'error'"
                    size="small"
                    variant="elevated"
                  >
                    {{ campaign.tikTokRoutingEnabled ? 'Enabled' : 'Disabled' }}
                  </v-chip>
                </td>
                <td>
                  <div class="d-flex align-center">
                    <div class="tiktok-stats mr-2">
                      {{ calculateTikTokStats(campaign).tiktok }}
                    </div>
                    <v-chip
                      size="x-small"
                      :color="getPercentageColor(calculateTikTokStats(campaign).percentage)"
                    >
                      {{ calculateTikTokStats(campaign).percentage }}%
                    </v-chip>
                  </div>
                </td>
                <td>
                  <div class="d-flex gap-2 justify-center">
                    <v-btn 
                      size="small" 
                      color="primary" 
                      variant="tonal" 
                      :to="`/campaigns/edit/${campaign.id}`"
                      icon
                      density="comfortable"
                    >
                      <v-icon>mdi-pencil</v-icon>
                      <v-tooltip activator="parent" location="top">Edit</v-tooltip>
                    </v-btn>
                    <v-btn 
                      size="small" 
                      color="info" 
                      variant="tonal" 
                      :to="`/campaigns/stats/${campaign.id}`"
                      icon
                      density="comfortable"
                    >
                      <v-icon>mdi-chart-bar</v-icon>
                      <v-tooltip activator="parent" location="top">Stats</v-tooltip>
                    </v-btn>
                    <v-btn 
                      size="small" 
                      color="error" 
                      variant="tonal" 
                      @click="confirmDelete(campaign)"
                      icon
                      density="comfortable"
                    >
                      <v-icon>mdi-delete</v-icon>
                      <v-tooltip activator="parent" location="top">Delete</v-tooltip>
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px" :scrim="true">
      <v-card elevation="24" rounded="lg" class="delete-dialog">
        <v-card-title class="text-h5 pb-2">
          <v-icon icon="mdi-alert-circle" color="error" class="mr-2"></v-icon>
          Delete Campaign
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pt-4">
          <p>Are you sure you want to delete the campaign "<strong>{{ campaignToDelete?.name }}</strong>"?</p>
          <p class="text-medium-emphasis mt-2">This action cannot be undone.</p>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="tonal" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="elevated" @click="deleteCampaign" :loading="deleting" prepend-icon="mdi-delete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const campaigns = ref([]);
const loading = ref(true);
const refreshingId = ref(null);
const deleteDialog = ref(false);
const campaignToDelete = ref(null);
const deleting = ref(false);
const snackbar = ref({
  show: false,
  text: '',
  color: 'info'
});

// Fetch campaigns when component mounts
onMounted(async () => {
  await fetchCampaigns();
});

// Fetch all campaigns
async function fetchCampaigns() {
  loading.value = true;
  try {
    const response = await fetch('/api/campaigns');
    const data = await response.json();
    
    if (data.success) {
      campaigns.value = data.campaigns;
    } else {
      showSnackbar('Failed to load campaigns: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    showSnackbar('Failed to load campaigns', 'error');
  } finally {
    loading.value = false;
  }
}

// Format redirect domain for display
function formatRedirectDomain(domain) {
  if (!domain) return 'Random';
  return domain.replace('https://', '');
}

// Get campaign link
function getCampaignLink(campaign) {
  if (campaign.shopifyPage && campaign.shopifyPage.fullUrl) {
    return campaign.shopifyPage.fullUrl;
  } else if (campaign.redirectDomain) {
    return `${campaign.redirectDomain}/${campaign.subid}`;
  } else {
    return `/campaigns/link/${campaign.id}`;
  }
}

// Copy link to clipboard
function copyLink(link) {
  navigator.clipboard.writeText(link)
    .then(() => {
      showSnackbar('Link copied to clipboard', 'success');
    })
    .catch(err => {
      console.error('Failed to copy link:', err);
      showSnackbar('Failed to copy link', 'error');
    });
}

// Refresh campaign link
async function refreshLink(campaignId) {
  refreshingId.value = campaignId;
  try {
    const response = await fetch(`/api/campaigns/refresh?id=${campaignId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSnackbar('Campaign link refreshed successfully', 'success');
      // Refresh the campaigns list to get the updated URL
      await fetchCampaigns();
    } else {
      showSnackbar('Failed to refresh link: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error refreshing campaign link:', error);
    showSnackbar('Failed to refresh link', 'error');
  } finally {
    refreshingId.value = null;
  }
}

// Calculate TikTok stats
function calculateTikTokStats(campaign) {
  const tiktokStats = campaign.stats?.tiktok || 0;
  const nonTiktokStats = campaign.stats?.nonTiktok || 0;
  const totalClicks = tiktokStats + nonTiktokStats;
  let clickRate = 0;
  
  if (totalClicks > 0) {
    clickRate = ((tiktokStats / totalClicks) * 100).toFixed(1);
  }
  
  return {
    tiktok: tiktokStats,
    percentage: clickRate
  };
}

// Get percentage color
function getPercentageColor(percentage) {
  const numPercentage = parseFloat(percentage);
  if (numPercentage >= 70) return 'success';
  if (numPercentage >= 40) return 'info';
  if (numPercentage >= 10) return 'warning';
  return 'error';
}

// Confirm deletion
function confirmDelete(campaign) {
  campaignToDelete.value = campaign;
  deleteDialog.value = true;
}

// Delete campaign
async function deleteCampaign() {
  if (!campaignToDelete.value) return;
  
  deleting.value = true;
  try {
    const response = await fetch(`/api/campaigns/delete?id=${campaignToDelete.value.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSnackbar('Campaign deleted successfully', 'success');
      await fetchCampaigns();
      deleteDialog.value = false;
    } else {
      showSnackbar('Failed to delete campaign: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error deleting campaign:', error);
    showSnackbar('Failed to delete campaign', 'error');
  } finally {
    deleting.value = false;
  }
}

// Show snackbar notification
function showSnackbar(text, color = 'info') {
  snackbar.value = {
    show: true,
    text,
    color
  };
}
</script>

<style>
:root {
  --table-bg: #ffffff;
  --table-header-bg: #f5f7fa;
  --table-row-hover: rgba(25, 118, 210, 0.05);
  --table-border-color: rgba(0, 0, 0, 0.12);
  --transition-speed: 0.3s;
}

[data-theme="dark"] {
  --table-bg: #1e1e1e;
  --table-header-bg: #2d2d2d;
  --table-row-hover: rgba(100, 181, 246, 0.1);
  --table-border-color: rgba(255, 255, 255, 0.12);
}
</style>

<style scoped>
.campaigns-view {
  padding: 16px;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
}

.create-btn {
  transition: transform var(--transition-speed) ease;
}

.create-btn:hover {
  transform: translateY(-2px);
}

.campaigns-card {
  transition: all var(--transition-speed) ease;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
}

.campaigns-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  background-color: var(--table-bg);
  transition: background-color var(--transition-speed) ease;
}

.campaigns-table th {
  background-color: var(--table-header-bg);
  font-weight: 600;
  font-size: 0.875rem;
  padding: 12px 16px;
  white-space: nowrap;
  transition: background-color var(--transition-speed) ease;
}

.campaigns-table tr {
  transition: background-color var(--transition-speed) ease;
}

.campaigns-table tr:hover {
  background-color: var(--table-row-hover);
}

.campaigns-table td {
  padding: 12px 16px;
  vertical-align: middle;
  border-bottom: 1px solid var(--table-border-color);
  transition: border-color var(--transition-speed) ease;
}

.domain-cell {
  max-width: 120px;
}

.domain-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tiktok-stats {
  font-weight: 500;
}

.delete-dialog {
  transition: all var(--transition-speed) ease;
}

@media (max-width: 1200px) {
  .campaigns-table th:nth-child(4),
  .campaigns-table td:nth-child(4) {
    display: none;
  }
}

@media (max-width: 960px) {
  .campaigns-table th:nth-child(5),
  .campaigns-table td:nth-child(5) {
    display: none;
  }
}

@media (max-width: 600px) {
  .campaigns-table th:nth-child(6),
  .campaigns-table td:nth-child(6) {
    display: none;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .create-btn {
    width: 100%;
  }
}
</style>