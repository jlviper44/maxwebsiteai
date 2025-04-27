<template>
  <div>
    <v-alert type="info" variant="tonal" class="mb-6 info-alert rounded-lg elevation-1" border="start">
      <template v-slot:prepend>
        <v-icon icon="mdi-information" color="info" class="mr-2"></v-icon>
      </template>
      <div>
        <span class="font-weight-medium">Global Settings</span>
        <p class="text-body-2 mt-1">
          Manage global system settings that affect the entire application.
        </p>
      </div>
    </v-alert>
    
    <div v-if="loading" class="d-flex justify-center align-center my-8 loading-container">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
      <span class="ml-4 text-body-1">Loading settings...</span>
    </div>
    
    <div v-else>
      <h3 class="text-h6 mb-4 section-title d-flex align-center">
        <v-icon icon="mdi-monitor-dashboard" color="primary" class="mr-2"></v-icon>
        User Interface
      </h3>
      
      <v-card variant="elevated" class="mb-6 settings-card rounded-lg elevation-2">
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap align-center py-2 setting-item">
            <div class="mr-4">
              <v-switch
                v-model="settings.darkModeEnabled"
                color="primary"
                hide-details
              ></v-switch>
            </div>
            <div class="setting-content">
              <div class="d-flex align-center flex-wrap">
                <span class="font-weight-medium text-body-1">Dark Mode</span>
                <v-chip
                  class="ml-2"
                  :color="settings.darkModeEnabled ? 'success' : 'error'"
                  size="small"
                  variant="elevated"
                >
                  {{ settings.darkModeEnabled ? 'Enabled' : 'Disabled' }}
                </v-chip>
              </div>
              <div class="text-body-2 text-medium-emphasis mt-1 setting-description">
                Toggle dark mode for the admin interface. This affects all users.
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
      
      <h3 class="text-h6 mb-4 section-title d-flex align-center">
        <v-icon icon="mdi-traffic-light" color="primary" class="mr-2"></v-icon>
        Traffic Settings
      </h3>
      
      <v-card variant="elevated" class="mb-6 settings-card rounded-lg elevation-2">
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap align-center py-2 setting-item">
            <div class="mr-4">
              <v-switch
                v-model="settings.tikTokRoutingEnabled"
                color="primary"
                hide-details
              ></v-switch>
            </div>
            <div class="setting-content">
              <div class="d-flex align-center flex-wrap">
                <span class="font-weight-medium text-body-1">TikTok Traffic Routing</span>
                <v-chip
                  class="ml-2"
                  :color="settings.tikTokRoutingEnabled ? 'success' : 'error'"
                  size="small"
                  variant="elevated"
                >
                  {{ settings.tikTokRoutingEnabled ? 'Enabled' : 'Disabled' }}
                </v-chip>
              </div>
              <div class="text-body-2 text-medium-emphasis mt-1 setting-description">
                When enabled, TikTok traffic will be automatically detected and routed to your campaign affiliate offers. 
                When disabled, all traffic will be treated as non-TikTok traffic.
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
      
      <h3 class="text-h6 mb-4 section-title d-flex align-center">
        <v-icon icon="mdi-chart-areaspline" color="primary" class="mr-2"></v-icon>
        System Statistics
      </h3>
      
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card rounded-lg elevation-2">
            <v-card-text class="text-center pa-4">
              <v-icon icon="mdi-bullhorn" color="primary" size="large" class="mb-2"></v-icon>
              <div class="text-h4 font-weight-bold mb-1 stats-value">{{ stats.campaigns || 0 }}</div>
              <div class="text-body-1 stats-label">Total Campaigns</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card rounded-lg elevation-2">
            <v-card-text class="text-center pa-4">
              <v-icon icon="mdi-check-circle" color="success" size="large" class="mb-2"></v-icon>
              <div class="text-h4 font-weight-bold mb-1 stats-value">{{ stats.activeCampaigns || 0 }}</div>
              <div class="text-body-1 stats-label">Active Campaigns</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card rounded-lg elevation-2">
            <v-card-text class="text-center pa-4">
              <v-icon icon="mdi-file-document-outline" color="info" size="large" class="mb-2"></v-icon>
              <div class="text-h4 font-weight-bold mb-1 stats-value">{{ stats.templates || 0 }}</div>
              <div class="text-body-1 stats-label">Templates</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card rounded-lg elevation-2">
            <v-card-text class="text-center pa-4">
              <v-icon icon="mdi-shopping" color="purple" size="large" class="mb-2"></v-icon>
              <div class="text-h4 font-weight-bold mb-1 stats-value">{{ stats.stores || 0 }}</div>
              <div class="text-body-1 stats-label">Shopify Stores</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <h3 class="text-h6 mb-4 mt-6 section-title d-flex align-center">
        <v-icon icon="mdi-chart-bar" color="primary" class="mr-2"></v-icon>
        Traffic Overview
      </h3>
      
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="traffic-card tiktok-card rounded-lg elevation-2">
            <v-card-text class="text-center pa-4">
              <v-icon icon="mdi-music-note" color="primary" size="large" class="mb-2"></v-icon>
              <div class="text-h4 font-weight-bold mb-1 tiktok-value">{{ stats.totalTikTokClicks || 0 }}</div>
              <div class="text-body-1 traffic-label">TikTok Clicks</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card class="traffic-card other-card rounded-lg elevation-2">
            <v-card-text class="text-center pa-4">
              <v-icon icon="mdi-earth" color="error" size="large" class="mb-2"></v-icon>
              <div class="text-h4 font-weight-bold mb-1 other-value">{{ stats.totalNonTikTokClicks || 0 }}</div>
              <div class="text-body-1 traffic-label">Non-TikTok Clicks</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card class="traffic-card total-card rounded-lg elevation-2">
            <v-card-text class="text-center pa-4">
              <v-icon icon="mdi-cursor-default-click" color="success" size="large" class="mb-2"></v-icon>
              <div class="text-h4 font-weight-bold mb-1 total-value">{{ stats.totalClicks || 0 }}</div>
              <div class="text-body-1 traffic-label">Total Clicks</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Traffic Chart -->
      <v-card class="mt-4 chart-card rounded-lg elevation-2" variant="elevated">
        <v-card-title class="pa-4 d-flex align-center">
          <v-icon icon="mdi-poll" color="primary" class="mr-2"></v-icon>
          <span class="text-h6">Traffic Distribution</span>
          <v-spacer></v-spacer>
          <div class="text-body-2 text-medium-emphasis d-none d-sm-block">TikTok: {{ stats.conversionRate || 0 }}%</div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-4">
          <div v-if="hasTrafficData">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-caption">TikTok</span>
              <span class="text-caption font-weight-medium">{{ stats.conversionRate || 0 }}%</span>
            </div>
            <v-progress-linear
              :model-value="parseFloat(stats.conversionRate)"
              height="24"
              color="primary"
              class="mb-4 rounded-lg"
              bg-opacity="0.2"
            >
              <template v-slot:default>
                <span class="white--text font-weight-medium">{{ stats.totalTikTokClicks || 0 }}</span>
              </template>
            </v-progress-linear>
            
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-caption">Non-TikTok</span>
              <span class="text-caption font-weight-medium">{{ nonTikTokPercentage }}%</span>
            </div>
            <v-progress-linear
              :model-value="nonTikTokPercentage"
              height="24"
              color="error"
              class="rounded-lg"
              bg-opacity="0.2"
            >
              <template v-slot:default>
                <span class="white--text font-weight-medium">{{ stats.totalNonTikTokClicks || 0 }}</span>
              </template>
            </v-progress-linear>
          </div>
          
          <div v-else class="text-center py-8 empty-state">
            <v-icon icon="mdi-chart-timeline-variant" size="64" class="mb-3 opacity-50"></v-icon>
            <p class="text-h6 mb-2">No Traffic Data</p>
            <p class="text-body-2">No traffic data available yet. Data will appear here once your campaigns receive traffic.</p>
          </div>
        </v-card-text>
      </v-card>
      
      <div class="d-flex mt-6">
        <v-btn
          color="primary"
          @click="saveSettings"
          :loading="saving"
          variant="elevated"
          prepend-icon="mdi-content-save"
          size="large"
          min-width="150"
        >
          Save Settings
        </v-btn>
      </div>
    </div>
    
    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTheme } from 'vuetify'
import { fetchDashboardData, updateSettings } from '@/api/dashboard';

// Initialize Vuetify theme
const theme = useTheme();

// Get current theme
const isDarkMode = computed(() => {
  return theme.global.current.value.dark;
});

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
const hasTrafficData = computed(() => {
  return stats.value.totalClicks > 0;
});

const nonTikTokPercentage = computed(() => {
  return stats.value.totalClicks > 0 
    ? (100 - parseFloat(stats.value.conversionRate)).toFixed(1) 
    : 0;
});

// Fetch dashboard data when component mounts
onMounted(async () => {
  await fetchDashboardInfo();
});

// Fetch dashboard data
async function fetchDashboardInfo() {
  loading.value = true;
  try {
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
      
      // Apply dark mode if changed
      applyDarkMode(settings.value.darkModeEnabled);
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

// Apply dark mode
function applyDarkMode(enabled) {
  try {
    // Use direct theme switching via localStorage and document attribute
    localStorage.setItem('darkMode', enabled ? 'true' : 'false');
    document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
    
    // Update Vuetify theme
    theme.global.name.value = enabled ? 'dark' : 'light';
    
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
:root {
  --info-alert-bg: #f0f7ff;
  --section-title-color: #333333;
  --settings-card-bg: #ffffff;
  --stats-card-bg: #ffffff;
  --traffic-card-bg: #ffffff;
  --chart-card-bg: #ffffff;
  --stats-value-color: #333333;
  --stats-label-color: #757575;
  --tiktok-value-color: #1976d2;
  --other-value-color: #e53935;
  --total-value-color: #43a047;
  --traffic-label-color: #757575;
  --setting-description-color: #757575;
  --empty-state-color: #757575;
  --loading-text-color: #757575;
  --transition-speed: 0.3s;
  
  --tiktok-card-bg: rgba(25, 118, 210, 0.05);
  --other-card-bg: rgba(229, 57, 53, 0.05);
  --total-card-bg: rgba(67, 160, 71, 0.05);
}

[data-theme="dark"] {
  --info-alert-bg: rgba(25, 118, 210, 0.1);
  --section-title-color: #e0e0e0;
  --settings-card-bg: #1e1e1e;
  --stats-card-bg: #1e1e1e;
  --traffic-card-bg: #1e1e1e;
  --chart-card-bg: #1e1e1e;
  --stats-value-color: #e0e0e0;
  --stats-label-color: #b0bec5;
  --tiktok-value-color: #64b5f6;
  --other-value-color: #ef9a9a;
  --total-value-color: #81c784;
  --traffic-label-color: #b0bec5;
  --setting-description-color: #b0bec5;
  --empty-state-color: #b0bec5;
  --loading-text-color: #b0bec5;
  
  --tiktok-card-bg: rgba(100, 181, 246, 0.1);
  --other-card-bg: rgba(239, 154, 154, 0.1);
  --total-card-bg: rgba(129, 199, 132, 0.1);
}
</style>

<style scoped>
.info-alert {
  background-color: var(--info-alert-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.section-title {
  color: var(--section-title-color);
  transition: color var(--transition-speed) ease;
}

.settings-card {
  background-color: var(--settings-card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.stats-card {
  background-color: var(--stats-card-bg) !important;
  transition: all var(--transition-speed) ease;
  height: 100%;
}

.traffic-card {
  background-color: var(--traffic-card-bg) !important;
  transition: all var(--transition-speed) ease;
  height: 100%;
}

.chart-card {
  background-color: var(--chart-card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.tiktok-card {
  background-color: var(--tiktok-card-bg) !important;
}

.other-card {
  background-color: var(--other-card-bg) !important;
}

.total-card {
  background-color: var(--total-card-bg) !important;
}

.stats-value {
  color: var(--stats-value-color);
  transition: color var(--transition-speed) ease;
}

.stats-label {
  color: var(--stats-label-color);
  transition: color var(--transition-speed) ease;
}

.tiktok-value {
  color: var(--tiktok-value-color);
  transition: color var(--transition-speed) ease;
}

.other-value {
  color: var(--other-value-color);
  transition: color var(--transition-speed) ease;
}

.total-value {
  color: var(--total-value-color);
  transition: color var(--transition-speed) ease;
}

.traffic-label {
  color: var(--traffic-label-color);
  transition: color var(--transition-speed) ease;
}

.setting-description {
  color: var(--setting-description-color);
  transition: color var(--transition-speed) ease;
}

.setting-item {
  transition: all var(--transition-speed) ease;
}

.empty-state {
  color: var(--empty-state-color);
  transition: color var(--transition-speed) ease;
}

.loading-container {
  min-height: 200px;
}

.loading-container span {
  color: var(--loading-text-color);
  transition: color var(--transition-speed) ease;
}

@media (max-width: 960px) {
  .setting-content {
    width: 100%;
    margin-top: 8px;
  }
}
</style>