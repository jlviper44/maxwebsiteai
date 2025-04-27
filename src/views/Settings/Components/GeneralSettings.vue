<template>
  <div>
    <v-alert type="info" variant="tonal">
      Manage global system settings that affect the entire application.
    </v-alert>
    
    <div v-if="loading" class="d-flex justify-center align-center mt-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <span class="ml-2">Loading settings...</span>
    </div>
    
    <div v-else>
      <h3 class="text-h6 mt-6 mb-4">User Interface</h3>
      
      <v-card variant="outlined" class="mb-5">
        <v-card-text>
          <div class="d-flex align-center mb-2">
            <v-switch
              v-model="settings.darkModeEnabled"
              color="primary"
              hide-details
            ></v-switch>
            <div class="ml-3">
              <span class="font-weight-medium">Dark Mode</span>
              <v-chip
                class="ml-2"
                :color="settings.darkModeEnabled ? 'success' : 'error'"
                size="x-small"
              >
                {{ settings.darkModeEnabled ? 'Enabled' : 'Disabled' }}
              </v-chip>
              <div class="text-body-2 text-medium-emphasis mt-1">
                Toggle dark mode for the admin interface. This affects all users.
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
      
      <h3 class="text-h6 mb-4">Traffic Settings</h3>
      
      <v-card variant="outlined" class="mb-5">
        <v-card-text>
          <div class="d-flex align-center mb-2">
            <v-switch
              v-model="settings.tikTokRoutingEnabled"
              color="primary"
              hide-details
            ></v-switch>
            <div class="ml-3">
              <span class="font-weight-medium">TikTok Traffic Routing</span>
              <v-chip
                class="ml-2"
                :color="settings.tikTokRoutingEnabled ? 'success' : 'error'"
                size="x-small"
              >
                {{ settings.tikTokRoutingEnabled ? 'Enabled' : 'Disabled' }}
              </v-chip>
              <div class="text-body-2 text-medium-emphasis mt-1">
                When enabled, TikTok traffic will be automatically detected and routed to your campaign affiliate offers. 
                When disabled, all traffic will be treated as non-TikTok traffic.
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
      
      <h3 class="text-h6 mb-4">System Statistics</h3>
      
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card">
            <v-card-text class="text-center">
              <div class="text-h4 font-weight-bold mb-1">{{ stats.campaigns || 0 }}</div>
              <div class="text-body-1">Total Campaigns</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card">
            <v-card-text class="text-center">
              <div class="text-h4 font-weight-bold mb-1">{{ stats.activeCampaigns || 0 }}</div>
              <div class="text-body-1">Active Campaigns</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card">
            <v-card-text class="text-center">
              <div class="text-h4 font-weight-bold mb-1">{{ stats.templates || 0 }}</div>
              <div class="text-body-1">Templates</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card">
            <v-card-text class="text-center">
              <div class="text-h4 font-weight-bold mb-1">{{ stats.stores || 0 }}</div>
              <div class="text-body-1">Shopify Stores</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <h3 class="text-h6 mb-4 mt-6">Traffic Overview</h3>
      
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="stats-card">
            <v-card-text class="text-center">
              <div class="text-h4 font-weight-bold mb-1">{{ stats.totalTikTokClicks || 0 }}</div>
              <div class="text-body-1">TikTok Clicks</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card class="stats-card">
            <v-card-text class="text-center">
              <div class="text-h4 font-weight-bold mb-1">{{ stats.totalNonTikTokClicks || 0 }}</div>
              <div class="text-body-1">Non-TikTok Clicks</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card class="stats-card">
            <v-card-text class="text-center">
              <div class="text-h4 font-weight-bold mb-1">{{ stats.totalClicks || 0 }}</div>
              <div class="text-body-1">Total Clicks</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Traffic Chart -->
      <v-card class="mt-4" variant="outlined">
        <v-card-text>
          <div class="d-flex justify-space-between align-center mb-4">
            <div class="text-subtitle-1 font-weight-medium">Traffic Distribution</div>
            <div class="text-body-2">TikTok: {{ stats.conversionRate || 0 }}%</div>
          </div>
          
          <v-progress-linear
            v-if="hasTrafficData"
            :model-value="parseFloat(stats.conversionRate)"
            height="24"
            color="primary"
            class="mb-1 rounded"
          >
            <template v-slot:default>
              <span class="text-caption white--text">TikTok</span>
            </template>
          </v-progress-linear>
          
          <v-progress-linear
            v-if="hasTrafficData"
            :model-value="nonTikTokPercentage"
            height="24"
            color="error"
            class="rounded"
          >
            <template v-slot:default>
              <span class="text-caption white--text">Non-TikTok</span>
            </template>
          </v-progress-linear>
          
          <div v-if="!hasTrafficData" class="text-center py-4">
            <p>No traffic data available yet.</p>
          </div>
        </v-card-text>
      </v-card>
      
      <div class="d-flex mt-6">
        <v-btn
          color="primary"
          @click="saveSettings"
          :loading="saving"
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
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          text
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue';
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
    const response = await updateSettings({
      tikTokRoutingEnabled: settings.value.tikTokRoutingEnabled,
      darkModeEnabled: settings.value.darkModeEnabled
    });
    
    if (response.success) {
      showSnackbar('Settings saved successfully', 'success');
      
      // Update settings
      settings.value = response.settings;
      
      // Apply dark mode if changed
      applyDarkMode(settings.value.darkModeEnabled);
    } else {
      showSnackbar('Failed to save settings: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showSnackbar('Failed to save settings', 'error');
  } finally {
    saving.value = false;
  }
}

// Apply dark mode
function applyDarkMode(enabled) {
  try {
    // Try to use Vuetify's theme system
    const vuetify = getCurrentInstance()?.appContext.config.globalProperties.$vuetify;
    if (vuetify && vuetify.theme) {
      vuetify.theme.global.name.value = enabled ? 'dark' : 'light';
    } else {
      // Fallback to manual class toggle
      document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
    }
    
    // Store in localStorage for persistence
    localStorage.setItem('darkMode', enabled ? 'true' : 'false');
    
    // Dispatch event for other components to respond to
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { darkMode: enabled } 
    }));
  } catch (error) {
    console.warn('Error applying dark mode:', error);
    // Fallback method
    document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
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
.stats-card {
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>