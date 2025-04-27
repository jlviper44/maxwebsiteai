<template>
  <div class="campaign-stats">
    <v-card>
      <v-card-title>
        Statistics for: {{ campaign?.name }}
        <v-btn
          icon 
          color="primary" 
          variant="text" 
          class="ml-auto"
          to="/campaigns"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-card-text v-if="loading">
        <div class="text-center py-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">Loading campaign statistics...</p>
        </div>
      </v-card-text>
      
      <v-card-text v-else-if="!campaign">
        <div class="text-center py-4">
          <p>Campaign not found. The campaign may have been deleted.</p>
          <v-btn color="primary" to="/campaigns" class="mt-4">Back to Campaigns</v-btn>
        </div>
      </v-card-text>
      
      <v-card-text v-else>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Campaign Status</div>
            <div class="detail-value">
              <v-chip :color="campaign.active ? 'success' : 'error'" size="small">
                {{ campaign.active ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">Campaign ID</div>
            <div class="detail-value">{{ campaign.id }}</div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">Landing Page</div>
            <div class="detail-value">
              <div class="d-flex align-center">
                <v-btn 
                  size="small" 
                  variant="text"
                  @click="copyLink(landingPageUrl)"
                >
                  Copy URL
                </v-btn>
                <v-btn 
                  size="small" 
                  variant="text"
                  @click="refreshLink"
                  :loading="refreshing"
                >
                  Refresh Link
                </v-btn>
              </div>
            </div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">Created</div>
            <div class="detail-value">{{ dates.created }}</div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">Last Visit</div>
            <div class="detail-value">{{ dates.lastVisit }}</div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">Template</div>
            <div class="detail-value">{{ template.name }} ({{ template.type }})</div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">Whitehat Template</div>
            <div class="detail-value">{{ whitehatTemplate }}</div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">TikTok Routing</div>
            <div class="detail-value">
              <span :class="campaign.tikTokRoutingEnabled ? 'text-success' : 'text-error'">
                {{ campaign.tikTokRoutingEnabled ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">Whitehat Threshold</div>
            <div class="detail-value">
              <div class="d-flex align-center">
                <v-text-field
                  v-model="whitehatThreshold"
                  type="number"
                  :rules="[v => v >= 0 || 'Must be at least 0']"
                  density="compact"
                  style="width: 100px"
                  hide-details
                ></v-text-field>
                
                <v-btn
                  color="primary"
                  size="small"
                  class="ml-2"
                  @click="updateThreshold"
                  :loading="updatingThreshold"
                >
                  Update
                </v-btn>
              </div>
              
              <div class="mt-2">
                First <strong>{{ campaign.whitehatThreshold }}</strong> clicks will see whitehat content regardless of traffic source.
                <v-chip 
                  size="small"
                  :color="whitehatStatus.active ? 'success' : 'error'"
                  class="ml-2"
                >
                  {{ whitehatStatus.active ? `Active (${whitehatStatus.remaining} left)` : 'Inactive (threshold reached)' }}
                </v-chip>
              </div>
            </div>
          </div>
        </div>
        
        <v-divider class="my-4"></v-divider>
        
        <h3 class="text-h6 mb-4">Traffic Statistics</h3>
        
        <div class="stats-grid">
          <div class="stats-card">
            <div class="stats-value">{{ stats.tiktok }}</div>
            <div class="stats-label">TikTok Clicks</div>
          </div>
          
          <div class="stats-card">
            <div class="stats-value">{{ stats.nonTiktok }}</div>
            <div class="stats-label">Non-TikTok Clicks</div>
          </div>
          
          <div class="stats-card">
            <div class="stats-value">{{ totalClicks }}</div>
            <div class="stats-label">Total Clicks</div>
          </div>
          
          <div class="stats-card">
            <div class="stats-value">{{ percentages.tiktok }}%</div>
            <div class="stats-label">TikTok Percentage</div>
          </div>
        </div>
        
        <div class="chart-container mt-6">
          <v-progress-linear
            v-if="totalClicks > 0"
            :model-value="parseFloat(percentages.tiktok)"
            height="40"
            color="primary"
          >
            <template v-slot:default="{ value }">
              <span class="white--text">TikTok: {{ stats.tiktok }} ({{ percentages.tiktok }}%)</span>
            </template>
          </v-progress-linear>
          
          <v-progress-linear
            v-if="totalClicks > 0"
            :model-value="parseFloat(percentages.nonTiktok)"
            height="40"
            color="error"
            class="mt-1"
          >
            <template v-slot:default="{ value }">
              <span class="white--text">Non-TikTok: {{ stats.nonTiktok }} ({{ percentages.nonTiktok }}%)</span>
            </template>
          </v-progress-linear>
          
          <div v-if="totalClicks === 0" class="text-center py-4">
            <p>No traffic data available yet.</p>
          </div>
        </div>
        
        <div class="actions mt-6">
          <v-btn
            color="primary"
            :to="`/campaigns/edit/${campaign.id}`"
          >
            Edit Campaign
          </v-btn>
          
          <v-btn
            variant="text"
            to="/campaigns"
            class="ml-4"
          >
            ← Back to Campaigns
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
    
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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const campaignId = computed(() => route.params.id);

const campaign = ref(null);
const stats = ref({ tiktok: 0, nonTiktok: 0 });
const template = ref({ name: 'Unknown', type: 'Unknown' });
const whitehatTemplate = ref('None');
const dates = ref({ created: 'Unknown', lastVisit: 'Never' });
const percentages = ref({ tiktok: '0.0', nonTiktok: '0.0' });
const whitehatStatus = ref({ active: false, remaining: 0 });
const whitehatThreshold = ref(1);

const loading = ref(true);
const refreshing = ref(false);
const updatingThreshold = ref(false);

const snackbar = ref({
  show: false,
  text: '',
  color: 'info'
});

// Computed campaign landing page URL
const landingPageUrl = computed(() => {
  if (!campaign.value) return '';
  
  if (campaign.value.shopifyPage && campaign.value.shopifyPage.fullUrl) {
    return campaign.value.shopifyPage.fullUrl;
  } else if (campaign.value.redirectDomain) {
    return `${campaign.value.redirectDomain}/${campaign.value.subid}`;
  } else {
    return `/campaigns/link/${campaign.value.id}`;
  }
});

// Computed total clicks
const totalClicks = computed(() => {
  return stats.value.tiktok + stats.value.nonTiktok;
});

// Fetch campaign stats when component mounts
onMounted(async () => {
  await fetchCampaignStats();
});

// Fetch campaign stats
async function fetchCampaignStats() {
  loading.value = true;
  try {
    const response = await fetch(`/api/campaigns/stats?id=${campaignId.value}`);
    const data = await response.json();
    
    if (data.success) {
      campaign.value = data.campaign;
      stats.value = data.stats;
      template.value = data.template;
      whitehatTemplate.value = data.whitehatTemplate;
      dates.value = data.dates;
      percentages.value = data.percentages;
      whitehatStatus.value = data.whitehatStatus;
      whitehatThreshold.value = data.campaign.whitehatThreshold || 1;
    } else {
      showSnackbar('Failed to load campaign stats: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    showSnackbar('Failed to load campaign stats', 'error');
  } finally {
    loading.value = false;
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
async function refreshLink() {
  refreshing.value = true;
  try {
    const response = await fetch(`/api/campaigns/refresh?id=${campaignId.value}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSnackbar('Campaign link refreshed successfully', 'success');
      // Refresh the campaign stats to get the updated URL
      await fetchCampaignStats();
    } else {
      showSnackbar('Failed to refresh link: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error refreshing campaign link:', error);
    showSnackbar('Failed to refresh link', 'error');
  } finally {
    refreshing.value = false;
  }
}

// Update whitehat threshold
async function updateThreshold() {
  const threshold = parseInt(whitehatThreshold.value);
  
  if (isNaN(threshold) || threshold < 0) {
    showSnackbar('Invalid threshold value', 'error');
    return;
  }
  
  updatingThreshold.value = true;
  try {
    const response = await fetch('/api/campaigns/update-threshold', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        campaignId: campaignId.value,
        whitehatThreshold: threshold
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSnackbar('Whitehat threshold updated successfully', 'success');
      await fetchCampaignStats();
    } else {
      showSnackbar('Failed to update threshold: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error updating threshold:', error);
    showSnackbar('Failed to update threshold', 'error');
  } finally {
    updatingThreshold.value = false;
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
.campaign-stats {
  padding: 16px;
}

.detail-grid {
  display: grid;
  grid-gap: 16px;
}

.detail-item {
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  padding-bottom: 12px;
}

.detail-label {
  flex: 0 0 150px;
  font-weight: bold;
}

.detail-value {
  flex: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  grid-gap: 16px;
  margin-top: 32px;
}

.stats-card {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stats-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.chart-container {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.text-success {
  color: rgb(76, 175, 80);
}

.text-error {
  color: rgb(244, 67, 54);
}
</style>