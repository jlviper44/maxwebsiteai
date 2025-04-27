<template>
  <div class="dashboard">
    <v-row>
      <v-col cols="12" md="6">
        <!-- Global Settings Card -->
        <v-card class="mb-4">
          <v-card-title>Global Settings</v-card-title>
          <v-card-text>
            <div v-if="loading" class="text-center">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p>Loading settings...</p>
            </div>
            
            <v-form v-else @submit.prevent="saveSettings">
              <div class="d-flex align-center mb-4">
                <v-switch
                  v-model="settings.tikTokRoutingEnabled"
                  color="primary"
                  label="TikTok Traffic Routing"
                  hide-details
                ></v-switch>
                <v-chip
                  class="ml-2"
                  :color="settings.tikTokRoutingEnabled ? 'success' : 'error'"
                  size="small"
                >
                  {{ settings.tikTokRoutingEnabled ? 'Enabled' : 'Disabled' }}
                </v-chip>
              </div>
              <div class="mb-4">
                <div class="text-body-2 text-medium-emphasis">
                  When enabled, TikTok traffic will be automatically detected and routed.
                </div>
              </div>
              
              <div class="d-flex align-center mb-4">
                <v-switch
                  v-model="settings.darkModeEnabled"
                  color="primary"
                  label="Dark Mode"
                  hide-details
                ></v-switch>
                <v-chip
                  class="ml-2"
                  :color="settings.darkModeEnabled ? 'success' : 'error'"
                  size="small"
                >
                  {{ settings.darkModeEnabled ? 'Enabled' : 'Disabled' }}
                </v-chip>
              </div>
              <div class="mb-4">
                <div class="text-body-2 text-medium-emphasis">
                  Toggle dark mode for the admin interface.
                </div>
              </div>
              
              <v-btn
                color="primary"
                type="submit"
                :loading="saving"
              >
                Save Settings
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <!-- Quick Stats Card -->
        <v-card class="mb-4">
          <v-card-title>Quick Stats</v-card-title>
          <v-card-text>
            <div v-if="loading" class="text-center">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p>Loading stats...</p>
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
    <v-card class="mb-4">
      <v-card-title>Traffic Overview</v-card-title>
      <v-card-text>
        <div v-if="loading" class="text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p>Loading traffic data...</p>
        </div>
        
        <div v-else class="stats-grid">
          <div class="stats-item">
            <div class="stats-value">{{ stats.totalTikTokClicks }}</div>
            <div class="stats-label">TikTok Clicks</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">{{ stats.totalNonTikTokClicks }}</div>
            <div class="stats-label">Non-TikTok Clicks</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">{{ stats.totalClicks }}</div>
            <div class="stats-label">Total Clicks</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">{{ stats.conversionRate }}%</div>
            <div class="stats-label">TikTok Percentage</div>
          </div>
        </div>
        
        <!-- Traffic Chart -->
        <div class="chart-container mt-4" v-if="stats.totalClicks > 0">
          <div class="chart-title">Traffic Distribution</div>
          <v-progress-linear
            :model-value="tikTokPercentage"
            height="40"
            color="primary"
            class="mb-1"
          >
            <template v-slot:default="{ value }">
              <span class="white--text">TikTok: {{ stats.totalTikTokClicks }} ({{ stats.conversionRate }}%)</span>
            </template>
          </v-progress-linear>
          
          <v-progress-linear
            :model-value="nonTikTokPercentage"
            height="40"
            color="error"
          >
            <template v-slot:default="{ value }">
              <span class="white--text">Non-TikTok: {{ stats.totalNonTikTokClicks }} ({{ nonTikTokPercentage }}%)</span>
            </template>
          </v-progress-linear>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Quick Access Cards -->
    <v-row>
      <v-col cols="12" md="4">
        <v-card height="100%" class="action-card">
          <v-card-title>Campaigns</v-card-title>
          <v-card-text>
            <p>Manage your TikTok traffic campaigns. Create new campaigns, edit existing ones, or view statistics.</p>
          </v-card-text>
          <v-card-actions class="d-flex justify-center">
            <v-btn
              block
              color="primary"
              to="/campaigns"
            >
              Manage Campaigns
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card height="100%" class="action-card">
          <v-card-title>Templates</v-card-title>
          <v-card-text>
            <p>Manage HTML templates or Google Form redirects that are used in your campaigns.</p>
          </v-card-text>
          <v-card-actions class="d-flex justify-center">
            <v-btn
              block
              color="primary"
              to="/templates"
            >
              Manage Templates
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card height="100%" class="action-card">
          <v-card-title>Shopify Stores</v-card-title>
          <v-card-text>
            <p>Connect and manage your Shopify stores to create cloaked pages automatically.</p>
          </v-card-text>
          <v-card-actions class="d-flex justify-center">
            <v-btn
              block
              color="primary"
              to="/shopify"
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
import { ref, computed, onMounted } from 'vue';
import { fetchDashboardData, updateSettings } from '@/api/dashboard';

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

// Fetch dashboard data when component mounts
onMounted(async () => {
  await fetchDashboardInfo();
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

<style scoped>
.dashboard {
  padding: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stats-item {
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stats-label {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

.chart-container {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.chart-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}

.action-card {
  display: flex;
  flex-direction: column;
}

.action-card .v-card-text {
  flex-grow: 1;
}
</style>