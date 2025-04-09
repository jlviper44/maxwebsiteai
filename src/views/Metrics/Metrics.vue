<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h4">Metrics & Analytics</h1>
      
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
        return-object
        @update:model-value="onAPIChange"
      >
        <template v-slot:prepend>
          <v-icon>mdi-api</v-icon>
        </template>
        <template v-slot:item="{ item, props }">
          <v-list-item v-bind="props" :title="item.raw.name"></v-list-item>
        </template>
        <template v-slot:selection="{ item }">
          <span>{{ item.raw.name }}</span>
        </template>
      </v-select>
    </div>
    
    <!-- Tabs for Performance and Subaffiliate Summary -->
    <v-tabs v-model="activeTab" class="mb-4" color="primary">
      <v-tab value="performance">Performance</v-tab>
      <v-tab value="subaffiliatesummary">Subaffiliate Summary</v-tab>
    </v-tabs>
    
    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <v-window-item value="performance">
        <PerformanceTab :api-key="selectedAPI?.api_key" :affiliate-id="selectedAPI?.affiliate_id" />
      </v-window-item>
      
      <v-window-item value="subaffiliatesummary">
        <SubaffiliateSummaryTab :api-key="selectedAPI?.api_key" :affiliate-id="selectedAPI?.affiliate_id" />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import PerformanceTab from './PerformanceTab/PerformanceTab.vue'
import SubaffiliateSummaryTab from './SubaffiliateSummaryTab/SubaffiliateSummaryTab.vue'

// Tab Control
const activeTab = ref('performance')

// FluentAPI state
const fluentAPIs = ref([])
const selectedAPI = ref(null)
const loadingAPIs = ref(false)

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
    } else {
      console.warn('No FluentAPIs found in database')
    }
  } catch (error) {
    console.error('Error fetching FluentAPIs:', error)
  } finally {
    loadingAPIs.value = false
  }
}

// Handle API change
const onAPIChange = (api) => {
  console.log('Selected FluentAPI changed:', api)
  
  // Add visual feedback for the user
  if (api) {
    // Display a small notification or toast message (you can implement a proper toast system)
    // For now, just log it
    console.log(`Now using API: ${api.name}`)
  }
  
  // The API change is automatically reflected in the selectedAPI ref
  // and passed to child components via props which will trigger the watchers to refresh data
}

// Fetch FluentAPIs on component mount
onMounted(() => {
  fetchFluentAPIs()
})
</script>

<style scoped>
.api-selector {
  max-width: 300px;
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
}
</style>