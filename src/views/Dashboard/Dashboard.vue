<template>
  <div class="dashboard">
    <v-row>
      <v-col cols="12" md="6">
        <!-- Global Settings Card -->
        <v-card class="mb-4 elevation-2 settings-card">
          <v-card-title class="text-h5 pb-2">
            <v-icon start icon="mdi-cog" class="mr-2"></v-icon>
            Global Settings
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-2">Loading settings...</p>
            </div>
            
            <v-form v-else @submit.prevent="saveSettings">
              <div class="d-flex align-center mb-6">
                <v-switch
                  v-model="settings.tikTokRoutingEnabled"
                  color="primary"
                  label="TikTok Traffic Routing"
                  hide-details
                  class="pb-0"
                ></v-switch>
                <v-chip
                  class="ml-2"
                  :color="settings.tikTokRoutingEnabled ? 'success' : 'error'"
                  size="small"
                  variant="elevated"
                >
                  {{ settings.tikTokRoutingEnabled ? 'Enabled' : 'Disabled' }}
                </v-chip>
              </div>
              <div class="mb-6 ml-12">
                <div class="text-body-2 text-medium-emphasis">
                  When enabled, TikTok traffic will be automatically detected and routed.
                </div>
              </div>
              
              <div class="d-flex align-center mb-6">
                <v-switch
                  v-model="settings.darkModeEnabled"
                  color="primary"
                  label="Dark Mode"
                  hide-details
                  class="pb-0"
                ></v-switch>
                <v-chip
                  class="ml-2"
                  :color="settings.darkModeEnabled ? 'success' : 'error'"
                  size="small"
                  variant="elevated"
                >
                  {{ settings.darkModeEnabled ? 'Enabled' : 'Disabled' }}
                </v-chip>
              </div>
              <div class="mb-6 ml-12">
                <div class="text-body-2 text-medium-emphasis">
                  Toggle dark mode for the admin interface.
                </div>
              </div>
              
              <v-btn
                color="primary"
                type="submit"
                :loading="saving"
                variant="elevated"
                prepend-icon="mdi-content-save"
              >
                Save Settings
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <!-- Quick Stats Card -->
        <v-card class="mb-4 elevation-2 stats-card">
          <v-card-title class="text-h5 pb-2">
            <v-icon start icon="mdi-chart-bar" class="mr-2"></v-icon>
            Quick Stats
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-2">Loading stats...</p>
            </div>
            
            <div v-else class="stats-grid">
              <div class="stats-item">
                <div class="stats-value">{{ stats.campaigns }}</div>
                <div class="stats-label">Total Campaigns</div>
              </div>
              <div class="stats-item">
                <div class="stats-value">{{ stats.activeCampaigns }}</div>
                <div class="stats-label">Active Campaigns</div>
              </div>
              <div class="stats-item">
                <div class="stats-value">{{ stats.templates }}</div>
                <div class="stats-label">Templates</div>
              </div>
              <div class="stats-item">
                <div class="stats-value">{{ stats.stores }}</div>
                <div class="stats-label">Shopify Stores</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Traffic Overview Card -->
    <v-card class="mb-4 elevation-2 traffic-card">
      <v-card-title class="text-h5 pb-2">
        <v-icon start icon="mdi-traffic-light" class="mr-2"></v-icon>
        Traffic Overview
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <div v-if="loading" class="text-center py-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">Loading traffic data...</p>
        </div>
        
        <div v-else>
          <div class="traffic-stats-grid">
            <v-card variant="flat" class="traffic-stat-card tiktok">
              <div class="d-flex align-center">
                <v-icon icon="mdi-music-note" size="large" class="mr-2"></v-icon>
                <div>
                  <div class="text-h5">{{ stats.totalTikTokClicks }}</div>
                  <div class="text-caption">TikTok Clicks</div>
                </div>
              </div>
            </v-card>
            
            <v-card variant="flat" class="traffic-stat-card non-tiktok">
              <div class="d-flex align-center">
                <v-icon icon="mdi-earth" size="large" class="mr-2"></v-icon>
                <div>
                  <div class="text-h5">{{ stats.totalNonTikTokClicks }}</div>
                  <div class="text-caption">Non-TikTok Clicks</div>
                </div>
              </div>
            </v-card>
            
            <v-card variant="flat" class="traffic-stat-card total">
              <div class="d-flex align-center">
                <v-icon icon="mdi-cursor-default-click" size="large" class="mr-2"></v-icon>
                <div>
                  <div class="text-h5">{{ stats.totalClicks }}</div>
                  <div class="text-caption">Total Clicks</div>
                </div>
              </div>
            </v-card>
            
            <v-card variant="flat" class="traffic-stat-card percentage">
              <div class="d-flex align-center">
                <v-icon icon="mdi-percent" size="large" class="mr-2"></v-icon>
                <div>
                  <div class="text-h5">{{ stats.conversionRate }}%</div>
                  <div class="text-caption">TikTok Percentage</div>
                </div>
              </div>
            </v-card>
          </div>
          
          <!-- Traffic Chart -->
          <div class="chart-container mt-6" v-if="stats.totalClicks > 0">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-chart-pie" class="mr-2"></v-icon>
              <div class="text-h6">Traffic Distribution</div>
            </div>
            
            <div class="px-2">
              <div class="d-flex justify-space-between mb-1">
                <span class="text-caption">TikTok</span>
                <span class="text-caption">{{ stats.conversionRate }}%</span>
              </div>
              <v-progress-linear
                :model-value="tikTokPercentage"
                height="24"
                color="primary"
                class="mb-3 rounded-lg"
              >
                <template v-slot:default="{ value }">
                  <strong>{{ stats.totalTikTokClicks }}</strong>
                </template>
              </v-progress-linear>
              
              <div class="d-flex justify-space-between mb-1">
                <span class="text-caption">Other Sources</span>
                <span class="text-caption">{{ nonTikTokPercentage }}%</span>
              </div>
              <v-progress-linear
                :model-value="nonTikTokPercentage"
                height="24"
                color="error"
                class="rounded-lg"
              >
                <template v-slot:default="{ value }">
                  <strong>{{ stats.totalNonTikTokClicks }}</strong>
                </template>
              </v-progress-linear>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Quick Access Cards -->
    <v-row>
      <v-col cols="12" md="4">
        <v-card height="100%" class="action-card elevation-2 h-100">
          <v-card-title class="text-h5 pb-2">
            <v-icon start icon="mdi-bullhorn" class="mr-2"></v-icon>
            Campaigns
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pt-4">
            <p>Manage your TikTok traffic campaigns. Create new campaigns, edit existing ones, or view statistics.</p>
          </v-card-text>
          <v-card-actions class="justify-center pa-4">
            <v-btn
              block
              color="primary"
              to="/campaigns"
              variant="elevated"
              prepend-icon="mdi-arrow-right"
            >
              Manage Campaigns
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card height="100%" class="action-card elevation-2 h-100">
          <v-card-title class="text-h5 pb-2">
            <v-icon start icon="mdi-file-document-outline" class="mr-2"></v-icon>
            Templates
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pt-4">
            <p>Manage HTML templates or Google Form redirects that are used in your campaigns.</p>
          </v-card-text>
          <v-card-actions class="justify-center pa-4">
            <v-btn
              block
              color="primary"
              to="/templates"
              variant="elevated"
              prepend-icon="mdi-arrow-right"
            >
              Manage Templates
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card height="100%" class="action-card elevation-2 h-100">
          <v-card-title class="text-h5 pb-2">
            <v-icon start icon="mdi-shopping" class="mr-2"></v-icon>
            Shopify Stores
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pt-4">
            <p>Connect and manage your Shopify stores to create cloaked pages automatically.</p>
          </v-card-text>
          <v-card-actions class="justify-center pa-4">
            <v-btn
              block
              color="primary"
              to="/shopify"
              variant="elevated"
              prepend-icon="mdi-arrow-right"
            >
              Manage Shopify Stores
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    
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
import { ref, computed, onMounted, watch } from 'vue';
import { fetchDashboardData, updateSettings } from '@/api/dashboard';
import { useTheme } from 'vuetify';

// Initialize Vuetify theme
const theme = useTheme();

// Data state
const loading = ref(true);
const saving = ref(false);
const settings = ref({
  tikTokRoutingEnabled: false,
  darkModeEnabled: false
});
const stats = ref({
  campaigns: 0,
  activeCampaigns: 0,
  templates: 0,
  stores: 0,
  totalTikTokClicks: 0,
  totalNonTikTokClicks: 0,
  totalClicks: 0,
  conversionRate: 0
});

const snackbar = ref({
  show: false,
  text: '',
  color: 'info'
});

// Computed properties
const tikTokPercentage = computed(() => {
  return parseFloat(stats.value.conversionRate);
});

const nonTikTokPercentage = computed(() => {
  return stats.value.totalClicks > 0 
    ? (100 - parseFloat(stats.value.conversionRate)).toFixed(1) 
    : 0;
});

// Watch for dark mode changes
watch(() => settings.value.darkModeEnabled, (newValue) => {
  applyDarkMode(newValue);
});

// Fetch dashboard data when component mounts
onMounted(async () => {
  await fetchDashboardInfo();
  
  // Initialize theme based on current settings
  applyDarkMode(settings.value.darkModeEnabled);
});

// Fetch dashboard data
async function fetchDashboardInfo() {
  loading.value = true;
  try {
    console.log('Fetching dashboard data...');
    const response = await fetchDashboardData();
    
    if (response.success) {
      settings.value = response.settings;
      stats.value = response.stats;
      console.log('Dashboard data loaded:', { settings: settings.value, stats: stats.value });
    } else {
      showSnackbar('Failed to load dashboard data: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    showSnackbar('Failed to load dashboard data', 'error');
  } finally {
    loading.value = false;
  }
}

// Save settings
async function saveSettings() {
  saving.value = true;
  try {
    console.log('Saving settings:', settings.value);
    
    const settingsToSave = {
      tikTokRoutingEnabled: settings.value.tikTokRoutingEnabled,
      darkModeEnabled: settings.value.darkModeEnabled
    };
    
    const response = await updateSettings(settingsToSave);
    
    if (response.success) {
      showSnackbar('Settings saved successfully', 'success');
      
      // Update settings
      settings.value = response.settings || settings.value;
    } else {
      console.error('Settings save failed:', response.error);
      showSnackbar('Failed to save settings: ' + (response.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error in saveSettings:', error);
    showSnackbar('Failed to save settings: ' + error.message, 'error');
  } finally {
    saving.value = false;
  }
}

// Apply dark mode - improved to use Vuetify's theme system
function applyDarkMode(enabled) {
  try {
    // Update Vuetify theme
    theme.global.name.value = enabled ? 'dark' : 'light';
    
    // Store in localStorage for persistence
    localStorage.setItem('darkMode', enabled ? 'true' : 'false');
    
    // Set HTML attribute for any custom CSS
    document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
    
    // Dispatch event for theme changes that other components can listen for
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { darkMode: enabled } 
    }));
  } catch (error) {
    console.warn('Error applying dark mode:', error);
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
/* Global styles that apply to both light and dark themes */
:root {
  --card-bg: #ffffff;
  --card-text: #333333;
  --stats-item-bg: #f5f5f5;
  --stats-value-color: #1976d2;
  --stats-label-color: #666666;
  --chart-bg: #f9f9f9;
}

[data-theme="dark"] {
  --card-bg: #1e1e1e;
  --card-text: #ffffff;
  --stats-item-bg: #2d2d2d;
  --stats-value-color: #64b5f6;
  --stats-label-color: #b0bec5;
  --chart-bg: #2d2d2d;
}
</style>

<style scoped>
.dashboard {
  padding: 16px;
}

/* Card styles with theme support */
.v-card {
  transition: all 0.3s ease;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.stats-item {
  text-align: center;
  background-color: var(--stats-item-bg);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--stats-value-color);
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: var(--stats-label-color);
  font-weight: 500;
}

.chart-container {
  padding: 16px;
  background-color: var(--chart-bg);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.action-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-5px);
}

.action-card .v-card-text {
  flex-grow: 1;
}

/* Traffic stats grid */
.traffic-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.traffic-stat-card {
  padding: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.traffic-stat-card.tiktok {
  background-color: rgba(25, 118, 210, 0.1);
}

.traffic-stat-card.non-tiktok {
  background-color: rgba(231, 76, 60, 0.1);
}

.traffic-stat-card.total {
  background-color: rgba(46, 204, 113, 0.1);
}

.traffic-stat-card.percentage {
  background-color: rgba(156, 39, 176, 0.1);
}

/* Loading state */
.v-progress-circular {
  margin: 0 auto;
}
</style>