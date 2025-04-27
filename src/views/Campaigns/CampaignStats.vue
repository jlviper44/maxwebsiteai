<template>
  <div class="campaign-stats">
    <v-card elevation="2" rounded="lg" class="stats-card">
      <v-card-title class="text-h5 pb-2 d-flex align-center">
        <v-icon icon="mdi-chart-box" color="primary" class="mr-2"></v-icon>
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
      
      <v-divider></v-divider>
      
      <v-card-text v-if="loading">
        <div class="text-center py-6">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="mt-4 text-medium-emphasis">Loading campaign statistics...</p>
        </div>
      </v-card-text>
      
      <v-card-text v-else-if="!campaign">
        <div class="text-center py-6">
          <v-icon icon="mdi-alert-circle" color="error" size="64" class="mb-4"></v-icon>
          <p class="text-h6">Campaign not found</p>
          <p class="text-medium-emphasis mb-4">The campaign may have been deleted.</p>
          <v-btn color="primary" to="/campaigns" class="mt-4" variant="elevated" prepend-icon="mdi-arrow-left">
            Back to Campaigns
          </v-btn>
        </div>
      </v-card-text>
      
      <v-card-text v-else class="pt-4">
        <div class="detail-grid pa-2">
          <v-card variant="flat" class="detail-item py-2 px-3">
            <div class="detail-label mb-1">Campaign Status</div>
            <div class="detail-value">
              <v-chip
                :color="campaign.active ? 'success' : 'error'"
                size="small"
                variant="elevated"
              >
                {{ campaign.active ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>
          </v-card>
          
          <v-card variant="flat" class="detail-item py-2 px-3">
            <div class="detail-label mb-1">Campaign ID</div>
            <div class="detail-value">{{ campaign.id }}</div>
          </v-card>
          
          <v-card variant="flat" class="detail-item py-2 px-3">
            <div class="detail-label mb-1">Landing Page</div>
            <div class="detail-value">
              <div class="d-flex align-center">
                <v-btn 
                  size="small" 
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-content-copy"
                  @click="copyLink(landingPageUrl)"
                  class="mr-2"
                >
                  Copy URL
                </v-btn>
                <v-btn 
                  size="small" 
                  variant="tonal"
                  color="secondary"
                  prepend-icon="mdi-refresh"
                  @click="refreshLink"
                  :loading="refreshing"
                >
                  Refresh Link
                </v-btn>
              </div>
            </div>
          </v-card>
          
          <v-card variant="flat" class="detail-item py-2 px-3">
            <div class="detail-label mb-1">Created</div>
            <div class="detail-value">{{ dates.created }}</div>
          </v-card>
          
          <v-card variant="flat" class="detail-item py-2 px-3">
            <div class="detail-label mb-1">Last Visit</div>
            <div class="detail-value">{{ dates.lastVisit }}</div>
          </v-card>
          
          <v-card variant="flat" class="detail-item py-2 px-3">
            <div class="detail-label mb-1">Template</div>
            <div class="detail-value">{{ template.name }} ({{ template.type }})</div>
          </v-card>
          
          <v-card variant="flat" class="detail-item py-2 px-3">
            <div class="detail-label mb-1">Whitehat Template</div>
            <div class="detail-value">{{ whitehatTemplate }}</div>
          </v-card>
          
          <v-card variant="flat" class="detail-item py-2 px-3">
            <div class="detail-label mb-1">TikTok Routing</div>
            <div class="detail-value">
              <v-chip 
                :color="campaign.tikTokRoutingEnabled ? 'success' : 'error'"
                size="small"
                variant="elevated"
              >
                {{ campaign.tikTokRoutingEnabled ? 'Enabled' : 'Disabled' }}
              </v-chip>
            </div>
          </v-card>
          
          <v-card variant="flat" class="detail-item py-2 px-3 threshold-item">
            <div class="detail-label mb-1">Whitehat Threshold</div>
            <div class="detail-value">
              <div class="d-flex align-center">
                <v-text-field
                  v-model="whitehatThreshold"
                  type="number"
                  :rules="[v => v >= 0 || 'Must be at least 0']"
                  density="compact"
                  variant="outlined"
                  style="width: 100px"
                  hide-details
                  class="threshold-input"
                ></v-text-field>
                
                <v-btn
                  color="primary"
                  size="small"
                  variant="elevated"
                  prepend-icon="mdi-check"
                  class="ml-2"
                  @click="updateThreshold"
                  :loading="updatingThreshold"
                >
                  Update
                </v-btn>
              </div>
              
              <div class="threshold-info mt-2 text-medium-emphasis">
                First <strong>{{ campaign.whitehatThreshold }}</strong> clicks will see whitehat content regardless of traffic source.
                <v-chip 
                  size="small"
                  :color="whitehatStatus.active ? 'success' : 'error'"
                  variant="elevated"
                  class="ml-2"
                >
                  {{ whitehatStatus.active ? `Active (${whitehatStatus.remaining} left)` : 'Inactive (threshold reached)' }}
                </v-chip>
              </div>
            </div>
          </v-card>
        </div>
        
        <v-divider class="my-6"></v-divider>
        
        <div class="d-flex align-center mb-4">
          <v-icon icon="mdi-trending-up" color="primary" class="mr-2"></v-icon>
          <h3 class="text-h6">Traffic Statistics</h3>
        </div>
        
        <div class="traffic-stats-grid">
          <v-card variant="flat" class="traffic-stat-card tiktok">
            <div class="d-flex align-center">
              <v-icon icon="mdi-music-note" size="large" class="mr-2"></v-icon>
              <div>
                <div class="stats-value">{{ stats.tiktok }}</div>
                <div class="stats-label">TikTok Clicks</div>
              </div>
            </div>
          </v-card>
          
          <v-card variant="flat" class="traffic-stat-card non-tiktok">
            <div class="d-flex align-center">
              <v-icon icon="mdi-earth" size="large" class="mr-2"></v-icon>
              <div>
                <div class="stats-value">{{ stats.nonTiktok }}</div>
                <div class="stats-label">Non-TikTok Clicks</div>
              </div>
            </div>
          </v-card>
          
          <v-card variant="flat" class="traffic-stat-card total">
            <div class="d-flex align-center">
              <v-icon icon="mdi-cursor-default-click" size="large" class="mr-2"></v-icon>
              <div>
                <div class="stats-value">{{ totalClicks }}</div>
                <div class="stats-label">Total Clicks</div>
              </div>
            </div>
          </v-card>
          
          <v-card variant="flat" class="traffic-stat-card percentage">
            <div class="d-flex align-center">
              <v-icon icon="mdi-percent" size="large" class="mr-2"></v-icon>
              <div>
                <div class="stats-value">{{ percentages.tiktok }}%</div>
                <div class="stats-label">TikTok Percentage</div>
              </div>
            </div>
          </v-card>
        </div>
        
        <div class="chart-container mt-6 rounded-lg pa-4">
          <div v-if="totalClicks > 0">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-chart-pie" class="mr-2"></v-icon>
              <div class="text-h6">Traffic Distribution</div>
            </div>
            
            <div class="px-2">
              <div class="d-flex justify-space-between mb-1">
                <span class="text-caption">TikTok</span>
                <span class="text-caption">{{ percentages.tiktok }}%</span>
              </div>
              <v-progress-linear
                :model-value="parseFloat(percentages.tiktok)"
                height="24"
                color="primary"
                class="mb-3 rounded-lg"
              >
                <template v-slot:default>
                  <strong>{{ stats.tiktok }}</strong>
                </template>
              </v-progress-linear>
              
              <div class="d-flex justify-space-between mb-1">
                <span class="text-caption">Other Sources</span>
                <span class="text-caption">{{ percentages.nonTiktok }}%</span>
              </div>
              <v-progress-linear
                :model-value="parseFloat(percentages.nonTiktok)"
                height="24"
                color="error"
                class="rounded-lg"
              >
                <template v-slot:default>
                  <strong>{{ stats.nonTiktok }}</strong>
                </template>
              </v-progress-linear>
            </div>
          </div>
          
          <div v-else class="text-center py-4">
            <v-icon icon="mdi-chart-timeline-variant" color="info" size="48" class="mb-2 opacity-50"></v-icon>
            <p class="text-medium-emphasis">No traffic data available yet.</p>
          </div>
        </div>
        
        <div class="actions mt-6 d-flex justify-center">
          <v-btn
            color="primary"
            variant="elevated"
            :to="`/campaigns/edit/${campaign.id}`"
            prepend-icon="mdi-pencil"
            class="mr-4"
          >
            Edit Campaign
          </v-btn>
          
          <v-btn
            variant="tonal"
            to="/campaigns"
            prepend-icon="mdi-arrow-left"
          >
            Back to Campaigns
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

<style>
:root {
  --detail-item-bg: #f5f7fa;
  --detail-label-color: #666666;
  --detail-value-color: #333333;
  --stats-item-bg: rgba(25, 118, 210, 0.05);
  --tiktok-card-bg: rgba(25, 118, 210, 0.1);
  --non-tiktok-card-bg: rgba(231, 76, 60, 0.1);
  --total-card-bg: rgba(46, 204, 113, 0.1);
  --percentage-card-bg: rgba(156, 39, 176, 0.1);
  --chart-bg: #f9f9f9;
  --transition-speed: 0.3s;
}

[data-theme="dark"] {
  --detail-item-bg: #1e1e1e;
  --detail-label-color: #b0bec5;
  --detail-value-color: #ffffff;
  --stats-item-bg: rgba(100, 181, 246, 0.05);
  --tiktok-card-bg: rgba(100, 181, 246, 0.15);
  --non-tiktok-card-bg: rgba(229, 115, 115, 0.15);
  --total-card-bg: rgba(129, 199, 132, 0.15);
  --percentage-card-bg: rgba(206, 147, 216, 0.15);
  --chart-bg: #1e1e1e;
}
</style>

<style scoped>
.campaign-stats {
  padding: 16px;
}

.stats-card {
  transition: all var(--transition-speed) ease;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 16px;
}

.detail-item {
  border-radius: 8px;
  background-color: var(--detail-item-bg);
  transition: background-color var(--transition-speed) ease;
}

.detail-label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--detail-label-color);
  transition: color var(--transition-speed) ease;
}

.detail-value {
  color: var(--detail-value-color);
  transition: color var(--transition-speed) ease;
}

.threshold-item {
  grid-column: 1 / -1;
}

.threshold-input {
  max-width: 120px;
}

.threshold-info {
  font-size: 0.875rem;
}

.traffic-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-gap: 16px;
  margin-top: 16px;
}

.traffic-stat-card {
  padding: 16px;
  border-radius: 8px;
  transition: all var(--transition-speed) ease;
}

.traffic-stat-card.tiktok {
  background-color: var(--tiktok-card-bg);
}

.traffic-stat-card.non-tiktok {
  background-color: var(--non-tiktok-card-bg);
}

.traffic-stat-card.total {
  background-color: var(--total-card-bg);
}

.traffic-stat-card.percentage {
  background-color: var(--percentage-card-bg);
}

.stats-value {
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1.2;
}

.stats-label {
  font-size: 0.875rem;
  color: var(--detail-label-color);
  transition: color var(--transition-speed) ease;
}

.chart-container {
  background-color: var(--chart-bg);
  transition: background-color var(--transition-speed) ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.actions {
  margin-top: 32px;
}

@media (max-width: 600px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .traffic-stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .actions {
    flex-direction: column;
  }
  
  .actions .v-btn {
    width: 100%;
    margin-right: 0 !important;
    margin-bottom: 8px;
  }
}
</style>