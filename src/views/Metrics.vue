<template>
  <div>
    <h1 class="text-h4 mb-4">Metrics & Analytics</h1>
    
    <!-- Date range selection -->
    <div class="date-filters mb-6">
      <v-card class="pa-4 date-card no-border" elevation="0">
        <div class="d-flex flex-wrap align-center">
          <div class="me-4 mb-2 date-picker-container">
            <label class="text-body-1 mb-1 d-block">Start Date</label>
            <Datepicker 
              v-model="startDate" 
              :max-date="endDate || new Date()"
              auto-apply
              :enable-time-picker="false"
              text-input
              placeholder="Select start date"
              :format="formatDateForDisplay"
              position="bottom"
            />
          </div>
          
          <div class="me-4 mb-2 date-picker-container">
            <label class="text-body-1 mb-1 d-block">End Date</label>
            <Datepicker 
              v-model="endDate" 
              :min-date="startDate"
              :max-date="new Date()"
              auto-apply
              :enable-time-picker="false"
              text-input
              placeholder="Select end date"
              :format="formatDateForDisplay"
              position="bottom"
            />
          </div>
          
          <div class="mb-2 mt-4">
            <v-btn 
              color="primary" 
              :loading="loadingClicks || loadingConversions || loadingSubaffiliateSummary"
              :disabled="!startDate || !endDate"
              @click="fetchAllData"
            >
              Apply Filters
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>
    
    <!-- Tabs for Performance and Subaffiliate Summary -->
    <v-tabs v-model="activeTab" class="mb-4" color="primary">
      <v-tab value="performance">Performance</v-tab>
      <v-tab value="subaffiliatesummary">Subaffiliate Summary</v-tab>
    </v-tabs>
    
    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <!-- Performance Tab (Combines Clicks and Conversions) -->
      <v-window-item value="performance">
        <!-- Filters for Performance Tab -->
        <v-card class="mb-4 pa-4" elevation="1">
          <div class="d-flex flex-wrap align-center">
            <v-autocomplete
              v-model="offerNameFilter"
              :items="offerNameOptions"
              label="Filter by Offer Name"
              variant="outlined"
              clearable
              class="me-4 mb-2"
              style="min-width: 250px;"
              density="comfortable"
              hide-details
              @update:model-value="applyFilters"
            ></v-autocomplete>
            
            <v-autocomplete
              v-model="subIdFilter"
              :items="subIdOptions"
              label="Filter by Sub ID"
              variant="outlined"
              clearable
              class="me-4 mb-2"
              style="min-width: 250px;"
              density="comfortable"
              hide-details
              @update:model-value="applyFilters"
            ></v-autocomplete>
            
            <v-btn 
              color="secondary" 
              variant="text" 
              class="mb-2"
              @click="clearFilters"
            >
              Clear Filters
            </v-btn>
          </div>
        </v-card>
        
        <!-- Error message container for both tables -->
        <div class="mb-4">
          <v-alert
            v-if="clicksError"
            type="error"
            class="mb-2"
            closable
          >
            {{ clicksError }}
          </v-alert>
          
          <v-alert
            v-if="conversionsError"
            type="error"
            class="mb-2"
            closable
          >
            {{ conversionsError }}
          </v-alert>
        </div>
        
        <!-- Side-by-side tables using grid layout -->
        <v-row>
          <!-- Clicks Table Column -->
          <v-col cols="12" md="6">
            <h3 class="text-h6 mb-3">Clicks</h3>
            
            <!-- Loading state -->
            <div v-if="loadingClicks" class="d-flex justify-center align-center my-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <span class="ml-2">Loading clicks data...</span>
            </div>
            
            <!-- Clicks Data table -->
            <v-data-table
              v-if="!loadingClicks && filteredClicksData.length > 0"
              :headers="clicksHeaders"
              :items="filteredClicksData"
              :items-per-page="10"
              :footer-props="{
                'items-per-page-options': [10, 20, 50]
              }"
              class="elevation-1"
              density="compact"
            >
              <!-- Custom formatting for date columns to include time -->
              <template v-slot:item.click_date="{ item }">
                {{ formatDateAndTime(item.click_date) }}
              </template>
            </v-data-table>
            
            <!-- No data message -->
            <v-alert
              v-if="!loadingClicks && filteredClicksData.length === 0 && !clicksError"
              type="info"
              class="my-4"
            >
              No clicks data available for the selected filters.
            </v-alert>
          </v-col>
          
          <!-- Conversions Table Column -->
          <v-col cols="12" md="6">
            <h3 class="text-h6 mb-3">Conversions</h3>
            
            <!-- Loading state -->
            <div v-if="loadingConversions" class="d-flex justify-center align-center my-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <span class="ml-2">Loading conversions data...</span>
            </div>
            
            <!-- Conversions Data table -->
            <v-data-table
              v-if="!loadingConversions && filteredConversionsData.length > 0"
              :headers="conversionsHeaders"
              :items="filteredConversionsData"
              :items-per-page="10"
              :footer-props="{
                'items-per-page-options': [10, 20, 50]
              }"
              class="elevation-1"
              density="compact"
            >
              <!-- Custom formatting for date columns to include time -->
              <template v-slot:item.conversion_date="{ item }">
                {{ formatDateAndTime(item.conversion_date) }}
              </template>
            </v-data-table>
            
            <!-- No data message -->
            <v-alert
              v-if="!loadingConversions && filteredConversionsData.length === 0 && !conversionsError"
              type="info"
              class="my-4"
            >
              No conversions data available for the selected filters.
            </v-alert>
          </v-col>
        </v-row>
      </v-window-item>
      
      <!-- Subaffiliate Summary Tab (unchanged) -->
      <v-window-item value="subaffiliatesummary">
        <!-- Loading state -->
        <div v-if="loadingSubaffiliateSummary" class="d-flex justify-center align-center my-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <span class="ml-2">Loading subaffiliate summary data...</span>
        </div>
        
        <!-- Error message -->
        <v-alert
          v-if="subaffiliateSummaryError"
          type="error"
          class="mb-4"
          closable
        >
          {{ subaffiliateSummaryError }}
        </v-alert>
        
        <!-- Subaffiliate Summary Data table -->
        <v-data-table
          v-if="!loadingSubaffiliateSummary && subaffiliateSummaryData.length > 0"
          :headers="subaffiliateSummaryHeaders"
          :items="subaffiliateSummaryData"
          :items-per-page="10"
          :footer-props="{
            'items-per-page-options': [10, 20, 50, 100]
          }"
          class="elevation-1"
        >
          <!-- Custom formatting for date columns if needed -->
          <template v-slot:item.date="{ item }">
            {{ formatDate(item.date) }}
          </template>
        </v-data-table>
        
        <!-- No data message -->
        <v-alert
          v-if="!loadingSubaffiliateSummary && subaffiliateSummaryData.length === 0 && !subaffiliateSummaryError"
          type="info"
          class="my-4"
        >
          No subaffiliate summary data available for the selected period.
        </v-alert>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import axios from "axios"
import { ref, watch, computed } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

// Tab Control
const activeTab = ref('performance')

// Data
const clicksData = ref([])
const conversionsData = ref([])
const subaffiliateSummaryData = ref([])

// Separate loading states for each data type
const loadingClicks = ref(false)
const loadingConversions = ref(false)
const loadingSubaffiliateSummary = ref(false)

// Separate error states for each data type
const clicksError = ref(null)
const conversionsError = ref(null)
const subaffiliateSummaryError = ref(null)

const startDate = ref(null)
const endDate = ref(null)

// Set default date range (yesterday to today)
const today = new Date()
endDate.value = today

const yesterday = new Date()
yesterday.setDate(today.getDate() - 1)
startDate.value = yesterday

// Filter values
const offerNameFilter = ref(null)
const subIdFilter = ref(null)

// Table headers for clicks - adjust based on actual API response structure
const clicksHeaders = ref([
  { title: 'Date & Time', key: 'click_date', sortable: true },
  { title: 'Offer Name', key: 'offer.offer_name', sortable: true },
  { title: 'Sub ID', key: 'subid_1', sortable: true }
])

// Table headers for conversions - adjust based on actual API response structure
const conversionsHeaders = ref([
  { title: 'Date & Time', key: 'conversion_date', sortable: true },
  { title: 'Offer Name', key: 'offer_name', sortable: true },
  { title: 'Sub ID', key: 'subid_1', sortable: true },
  { title: 'Price', key: 'price', sortable: true }
])

// Table headers for subaffiliate summary - adjust based on actual API response structure
const subaffiliateSummaryHeaders = ref([
  { title: 'Sub ID', key: 'sub_id', sortable: true },
  { title: 'Clicks', key: 'clicks', sortable: true },
  { title: 'Conversions', key: 'conversions', sortable: true },
  { title: 'Revenue', key: 'revenue', sortable: true },
  { title: 'EPC', key: 'epc', sortable: true },
  { title: 'Events', key: 'events', sortable: true }
])

// Date formatters
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// New formatter to include both date and time
const formatDateAndTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// Format for API requests (YYYY-MM-DD HH:MM:SS)
const formatDateForApi = (date, isEndDate = false) => {
  if (!date) return ''
  
  // Create a new date object to avoid modifying the original
  const formattedDate = new Date(date)
  
  // Set time to 00:00:00 for start date or 23:59:59 for end date
  if (isEndDate) {
    formattedDate.setHours(23, 59, 59, 999)
  } else {
    formattedDate.setHours(0, 0, 0, 0)
  }
  
  // Format as YYYY-MM-DD HH:MM:SS
  const year = formattedDate.getFullYear()
  const month = String(formattedDate.getMonth() + 1).padStart(2, '0')
  const day = String(formattedDate.getDate()).padStart(2, '0')
  const hours = String(formattedDate.getHours()).padStart(2, '0')
  const minutes = String(formattedDate.getMinutes()).padStart(2, '0')
  const seconds = String(formattedDate.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// Format for display in the datepicker
const formatDateForDisplay = (date) => {
  return date.toLocaleDateString()
}

// Define field arrays for each data type
const clicksFields = [
  'click_date',
  'offer',
  'subid_1'
]

const conversionsFields = [
  'conversion_date',
  'offer_name',
  'subid_1',
  'price'
]

const subaffiliateSummaryFields = [
  'sub_id',
  'clicks',
  'conversions',
  'revenue',
  'epc',
  'events'
]

// Computed properties for filter options
const offerNameOptions = computed(() => {
  const clicksOffers = clicksData.value
    .map(item => item.offer?.offer_name)
    .filter(name => name)
  
  const conversionOffers = conversionsData.value
    .map(item => item.offer_name)
    .filter(name => name)
  
  // Combine unique offer names from both datasets
  return [...new Set([...clicksOffers, ...conversionOffers])].sort()
})

const subIdOptions = computed(() => {
  const clicksSubIds = clicksData.value
    .map(item => item.subid_1)
    .filter(id => id)
  
  const conversionSubIds = conversionsData.value
    .map(item => item.subid_1)
    .filter(id => id)
  
  // Combine unique subids from both datasets
  return [...new Set([...clicksSubIds, ...conversionSubIds])].sort()
})

// Filtered data based on selected filters
const filteredClicksData = computed(() => {
  let filtered = [...clicksData.value]
  
  if (offerNameFilter.value) {
    filtered = filtered.filter(item => 
      item.offer?.offer_name === offerNameFilter.value
    )
  }
  
  if (subIdFilter.value) {
    filtered = filtered.filter(item => 
      item.subid_1 === subIdFilter.value
    )
  }
  
  return filtered
})

const filteredConversionsData = computed(() => {
  let filtered = [...conversionsData.value]
  
  if (offerNameFilter.value) {
    filtered = filtered.filter(item => 
      item.offer_name === offerNameFilter.value
    )
  }
  
  if (subIdFilter.value) {
    filtered = filtered.filter(item => 
      item.subid_1 === subIdFilter.value
    )
  }
  
  return filtered
})

// Function to prepare common request parameters
const getRequestParams = (fields = []) => {
  return {
    api_key: "hFct58Jru5Y5cPlP8VGq8Q",
    affiliate_id: "207744",
    start_date: formatDateForApi(startDate.value, false),
    end_date: formatDateForApi(endDate.value, true),
    fields: fields
  }
}

// Function to fetch clicks data
const fetchClicksData = async () => {
  if (!startDate.value || !endDate.value) return
  
  try {
    loadingClicks.value = true
    clicksError.value = null
    
    const response = await axios.post("/api/clicks", getRequestParams(clicksFields))
    
    // Process clicks data
    if (response.data && Array.isArray(response.data.data)) {
      clicksData.value = response.data.data
    } else if (response.data && typeof response.data === 'object') {
      clicksData.value = Array.isArray(response.data) ? response.data : [response.data]
    }
    
    console.log('Clicks API Response:', response)
  } catch (err) {
    console.error(`Error fetching clicks data:`, err)
    clicksError.value = err.response?.data?.error || err.message || `Failed to fetch clicks data`
  } finally {
    loadingClicks.value = false
  }
}

// Function to fetch conversions data
const fetchConversionsData = async () => {
  if (!startDate.value || !endDate.value) return
  
  try {
    loadingConversions.value = true
    conversionsError.value = null
    
    const response = await axios.post("/api/conversions", getRequestParams(conversionsFields))
    
    // Process conversions data
    if (response.data && Array.isArray(response.data.data)) {
      conversionsData.value = response.data.data
    } else if (response.data && typeof response.data === 'object') {
      conversionsData.value = Array.isArray(response.data) ? response.data : [response.data]
    }
    
    console.log('Conversions API Response:', response)
  } catch (err) {
    console.error(`Error fetching conversions data:`, err)
    conversionsError.value = err.response?.data?.error || err.message || `Failed to fetch conversions data`
  } finally {
    loadingConversions.value = false
  }
}

// Function to fetch subaffiliate summary data
const fetchSubaffiliateSummaryData = async () => {
  if (!startDate.value || !endDate.value) return
  
  try {
    loadingSubaffiliateSummary.value = true
    subaffiliateSummaryError.value = null
    
    const response = await axios.post("/api/subaffiliatesummary", getRequestParams(subaffiliateSummaryFields))
    
    // Process subaffiliate summary data
    if (response.data && Array.isArray(response.data.data)) {
      subaffiliateSummaryData.value = response.data.data
    } else if (response.data && typeof response.data === 'object') {
      subaffiliateSummaryData.value = Array.isArray(response.data) ? response.data : [response.data]
    }
    
    // Adjust headers based on actual data structure if needed
    if (subaffiliateSummaryData.value.length > 0) {
      const sampleItem = subaffiliateSummaryData.value[0]
      subaffiliateSummaryHeaders.value = Object.keys(sampleItem).map(key => ({
        title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        key: key,
        sortable: true
      }))
    }
    
    console.log('Subaffiliate Summary API Response:', response)
  } catch (err) {
    console.error(`Error fetching subaffiliate summary data:`, err)
    subaffiliateSummaryError.value = err.response?.data?.error || err.message || `Failed to fetch subaffiliate summary data`
  } finally {
    loadingSubaffiliateSummary.value = false
  }
}

// Function to fetch all data types concurrently
const fetchAllData = () => {
  if (!startDate.value || !endDate.value) {
    // Set all error states to show the same message
    clicksError.value = "Please select both start and end dates"
    conversionsError.value = "Please select both start and end dates"
    subaffiliateSummaryError.value = "Please select both start and end dates"
    return
  }
  
  // Clear previous data
  clicksData.value = []
  conversionsData.value = []
  subaffiliateSummaryData.value = []
  
  // Clear filters
  clearFilters()
  
  // Clear previous errors
  clicksError.value = null
  conversionsError.value = null
  subaffiliateSummaryError.value = null
  
  // Fetch all three data types concurrently and independently
  fetchClicksData()
  fetchConversionsData()
  fetchSubaffiliateSummaryData()
}

// Function to apply filters
const applyFilters = () => {
  // Filters are automatically applied through computed properties
  console.log('Applying filters - Offer:', offerNameFilter.value, 'Sub ID:', subIdFilter.value)
}

// Function to clear filters
const clearFilters = () => {
  offerNameFilter.value = null
  subIdFilter.value = null
}

// Fetch data when the component is mounted
fetchAllData()

// Watch for tab changes to ensure the current tab's data is loaded if it hasn't been already
watch(activeTab, (newTab) => {
  if (newTab === 'performance') {
    // Load both clicks and conversions data if they're not already loaded
    if (clicksData.value.length === 0 && !loadingClicks.value && !clicksError.value) {
      fetchClicksData()
    }
    if (conversionsData.value.length === 0 && !loadingConversions.value && !conversionsError.value) {
      fetchConversionsData()
    }
  } else if (newTab === 'subaffiliatesummary' && subaffiliateSummaryData.value.length === 0 && !loadingSubaffiliateSummary.value && !subaffiliateSummaryError.value) {
    fetchSubaffiliateSummaryData()
  }
})
</script>

<style scoped>
.chart-placeholder {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 4px;
}

/* Date picker container and positioning fixes */
.date-card {
  overflow: visible !important;
  position: relative;
  z-index: 1;
}

/* Remove card border */
.no-border {
  border: none !important;
  box-shadow: none !important;
}

.date-picker-container {
  position: relative;
  z-index: 2;
}

/* Fix for date picker z-index issue */
:deep(.dp__outer_menu) {
  z-index: 100 !important;
}

:deep(.dp__menu) {
  z-index: 100 !important;
}

:deep(.dp__overlay) {
  z-index: 100 !important;
}

/* Make sure the date picker input doesn't get clipped */
:deep(.dp__input) {
  z-index: 2;
}

/* Ensure the date picker popup has enough space */
:deep(.dp__instance_calendar) {
  position: absolute;
  margin-top: 0;
}
</style>