<template>
  <div class="metrics-view">
    <v-card class="mb-4 elevation-2 rounded-lg header-card">
      <v-card-text class="pa-4">
        <div class="d-flex flex-wrap align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon icon="mdi-chart-areaspline" color="primary" size="large" class="mr-3"></v-icon>
            <h1 class="text-h4 font-weight-medium">Metrics & Analytics</h1>
          </div>
          
          <!-- API Selection Dropdown -->
          <v-select
            v-model="selectedAPI"
            :items="fluentAPIs"
            item-title="name"
            item-value="name"
            label="Select FluentAPI"
            variant="outlined"
            density="comfortable"
            class="api-selector"
            :loading="loadingAPIs"
            :disabled="loadingAPIs"
            prepend-inner-icon="mdi-api"
            return-object
            @update:model-value="onAPIChange"
            hide-details
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props" :title="item.raw.name" rounded="lg"></v-list-item>
            </template>
            <template v-slot:selection="{ item }">
              <span>{{ item.raw.name }}</span>
            </template>
            <template v-slot:append>
              <v-icon v-if="selectedAPI" icon="mdi-check-circle" color="success" class="ml-2"></v-icon>
            </template>
          </v-select>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Tabs for Performance and Subaffiliate Summary -->
    <v-card class="elevation-2 rounded-lg tabs-card">
      <v-tabs 
        v-model="activeTab" 
        color="primary"
        slider-color="primary"
        align-tabs="center"
        class="tab-header"
        grow
      >
        <v-tab value="performance" class="tab-item">
          <v-icon icon="mdi-chart-line" class="mr-2"></v-icon>
          Performance
        </v-tab>
        <v-tab value="subaffiliatesummary" class="tab-item">
          <v-icon icon="mdi-account-group" class="mr-2"></v-icon>
          Subaffiliate Summary
        </v-tab>
      </v-tabs>
      
      <v-divider></v-divider>
      
      <!-- Tab Content -->
      <v-window v-model="activeTab" class="tab-content">
        <v-window-item value="performance">
          <div class="pa-4">
            <PerformanceTab :api-key="selectedAPI?.api_key" :affiliate-id="selectedAPI?.affiliate_id" />
          </div>
        </v-window-item>
        
        <v-window-item value="subaffiliatesummary">
          <div class="pa-4">
            <SubaffiliateSummaryTab :api-key="selectedAPI?.api_key" :affiliate-id="selectedAPI?.affiliate_id" />
          </div>
        </v-window-item>
      </v-window>
    </v-card>
    
    <!-- Snackbar for API change notifications -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="showSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTheme } from 'vuetify'
import axios from 'axios'
import PerformanceTab from './PerformanceTab/PerformanceTab.vue'
import SubaffiliateSummaryTab from './SubaffiliateSummaryTab/SubaffiliateSummaryTab.vue'

// Initialize Vuetify theme
const theme = useTheme();

// Tab Control
const activeTab = ref('performance')

// FluentAPI state
const fluentAPIs = ref([])
const selectedAPI = ref(null)
const loadingAPIs = ref(false)

// Snackbar state
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Get current theme
const isDarkMode = computed(() => {
  return theme.global.current.value.dark;
});

// Function to fetch available FluentAPIs from the database
const fetchFluentAPIs = async () => {
  try {
    loadingAPIs.value = true
    
    // Use rawsql endpoint to fetch all FluentAPIs
    const response = await axios.post('/api/rawsql', {
      query: 'SELECT * FROM FluentAPIs'
    })
    
    console.log('Raw SQL response:', response)
    
    // We need to check if the data is directly in response.data or nested in response.data.data
    let apiData = []
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        // Direct array in response.data
        apiData = response.data
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Nested array in response.data.data
        apiData = response.data.data
      }
    }
    
    console.log('Processed API data:', apiData)
    
    // Normalize the API data to ensure consistent property casing
    const normalizedApiData = apiData.map(api => {
      // Check if it's using lowercase or uppercase property names
      const normalizedApi = {}
      
      // Get all keys in this object
      const keys = Object.keys(api)
      
      // Find the keys for name, api_key, and affiliate_id (case-insensitive)
      const nameKey = keys.find(k => k.toLowerCase() === 'name')
      const apiKeyKey = keys.find(k => k.toLowerCase() === 'api_key')
      const affiliateIdKey = keys.find(k => k.toLowerCase() === 'affiliate_id')
      
      // Normalize to our expected property names
      normalizedApi.name = nameKey ? api[nameKey] : 'Unknown API'
      normalizedApi.api_key = apiKeyKey ? api[apiKeyKey] : null
      normalizedApi.affiliate_id = affiliateIdKey ? api[affiliateIdKey] : null
      
      return normalizedApi
    })
    
    console.log('Normalized API data:', normalizedApiData)
    
    if (normalizedApiData.length > 0) {
      fluentAPIs.value = normalizedApiData
      
      // Set default selected API (first in the list)
      selectedAPI.value = fluentAPIs.value[0]
      console.log('Selected API set to:', selectedAPI.value)
      
      // Show success notification
      showNotification(`Connected to API: ${selectedAPI.value.name}`, 'success')
    } else {
      console.warn('No FluentAPIs found in database')
      showNotification('No FluentAPIs found in database', 'error')
    }
  } catch (error) {
    console.error('Error fetching FluentAPIs:', error)
    showNotification('Error fetching FluentAPIs: ' + (error.message || 'Unknown error'), 'error')
  } finally {
    loadingAPIs.value = false
  }
}

// Helper function to show notifications
const showNotification = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  showSnackbar.value = true
}

// Handle API change
const onAPIChange = (api) => {
  console.log('Selected FluentAPI changed:', api)
  
  // Add visual feedback for the user
  if (api) {
    showNotification(`Now using API: ${api.name}`, 'info')
  }
  
  // The API change is automatically reflected in the selectedAPI ref
  // and passed to child components via props which will trigger the watchers to refresh data
}

// Fetch FluentAPIs on component mount
onMounted(() => {
  fetchFluentAPIs()
})
</script>

<style>
:root {
  --header-bg: #ffffff;
  --tabs-bg: #ffffff;
  --card-border: rgba(0, 0, 0, 0.12);
  --tab-active-bg: rgba(25, 118, 210, 0.08);
  --transition-speed: 0.3s;
}

[data-theme="dark"] {
  --header-bg: #1e1e1e;
  --tabs-bg: #1e1e1e;
  --card-border: rgba(255, 255, 255, 0.12);
  --tab-active-bg: rgba(100, 181, 246, 0.15);
}
</style>

<style scoped>
.metrics-view {
  padding: 16px;
}

.header-card {
  background-color: var(--header-bg) !important;
  transition: background-color var(--transition-speed) ease;
  border-bottom: 1px solid var(--card-border);
}

.tabs-card {
  background-color: var(--tabs-bg) !important;
  transition: background-color var(--transition-speed) ease;
  overflow: hidden;
}

.api-selector {
  max-width: 300px;
  transition: all var(--transition-speed) ease;
}

.tab-header {
  border-bottom: 1px solid var(--card-border);
  transition: border-color var(--transition-speed) ease;
}

.tab-item {
  min-height: 48px;
  transition: background-color var(--transition-speed) ease;
}

.tab-item.v-tab--selected {
  background-color: var(--tab-active-bg);
}

.tab-content {
  min-height: 600px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .d-flex {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .api-selector {
    margin-top: 16px;
    max-width: 100%;
    width: 100%;
  }
  
  .tab-content {
    min-height: 400px;
  }
}
</style>