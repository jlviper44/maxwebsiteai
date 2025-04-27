<template>
  <div class="campaigns-view">
    <div class="header-actions">
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus"
        to="/campaigns/create"
      >
        Create New Campaign
      </v-btn>
    </div>
    
    <v-card class="mt-4">
      <v-card-title>Your Campaigns</v-card-title>
      <v-card-text>
        <div v-if="loading" class="text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p>Loading campaigns...</p>
        </div>
        
        <div v-else-if="campaigns.length === 0" class="empty-state">
          <p>No campaigns found. Create your first campaign to get started.</p>
        </div>
        
        <v-table v-else>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Copy / Refresh Link</th>
              <th>Redirect Domain</th>
              <th>Traffic Routing</th>
              <th>TikTok Clicks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="campaign in campaigns" :key="campaign.id">
              <td>{{ campaign.name }}</td>
              <td>
                <v-chip
                  :color="campaign.active ? 'success' : 'error'"
                  size="small"
                >
                  {{ campaign.active ? 'Active' : 'Inactive' }}
                </v-chip>
              </td>
              <td>
                <div class="d-flex align-center">
                  <v-btn 
                    size="small" 
                    variant="text" 
                    @click="copyLink(getCampaignLink(campaign))"
                  >
                    Copy
                  </v-btn>
                  <v-btn 
                    size="small" 
                    variant="text" 
                    @click="refreshLink(campaign.id)"
                    :loading="refreshingId === campaign.id"
                  >
                    Refresh
                  </v-btn>
                </div>
              </td>
              <td>{{ formatRedirectDomain(campaign.redirectDomain) }}</td>
              <td>
                <span :class="campaign.tikTokRoutingEnabled ? 'text-success' : 'text-error'">
                  {{ campaign.tikTokRoutingEnabled ? 'Enabled' : 'Disabled' }}
                </span>
              </td>
              <td>
                {{ calculateTikTokStats(campaign).tiktok }}
                ({{ calculateTikTokStats(campaign).percentage }}%)
              </td>
              <td>
                <div class="d-flex gap-2">
                  <v-btn 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                    :to="`/campaigns/edit/${campaign.id}`"
                  >
                    Edit
                  </v-btn>
                  <v-btn 
                    size="small" 
                    color="info" 
                    variant="outlined" 
                    :to="`/campaigns/stats/${campaign.id}`"
                  >
                    Stats
                  </v-btn>
                  <v-btn 
                    size="small" 
                    color="error" 
                    variant="outlined" 
                    @click="confirmDelete(campaign)"
                  >
                    Delete
                  </v-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title>Delete Campaign</v-card-title>
        <v-card-text>
          Are you sure you want to delete the campaign "{{ campaignToDelete?.name }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="text" @click="deleteCampaign" :loading="deleting">Delete</v-btn>
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

<style scoped>
.campaigns-view {
  padding: 16px;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: rgba(0, 0, 0, 0.6);
}

.text-success {
  color: rgb(76, 175, 80);
}

.text-error {
  color: rgb(244, 67, 54);
}
</style>