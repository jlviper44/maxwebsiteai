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
              :loading="loading"
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
      <v-window-item value="performance">
        <PerformanceTab 
          :clicksData="clicksData"
          :conversionsData="conversionsData"
          :loadingClicks="loadingClicks"
          :loadingConversions="loadingConversions"
          :clicksError="clicksError"
          :conversionsError="conversionsError"
          :formatDateAndTime="formatDateAndTime"
        />
      </v-window-item>
      
      <v-window-item value="subaffiliatesummary">
        <SubaffiliateSummaryTab 
          :subaffiliateSummaryData="subaffiliateSummaryData"
          :loadingSubaffiliateSummary="loadingSubaffiliateSummary"
          :subaffiliateSummaryError="subaffiliateSummaryError"
          :formatDate="formatDate"
        />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import axios from "axios"
import { ref, watch, computed } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import PerformanceTab from './PerformanceTab.vue'
import SubaffiliateSummaryTab from './SubaffiliateSummaryTab.vue'

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

// Computed property for overall loading state
const loading = computed(() => {
  return loadingClicks.value || loadingConversions.value || loadingSubaffiliateSummary.value
})

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
  
  // Clear previous errors
  clicksError.value = null
  conversionsError.value = null
  subaffiliateSummaryError.value = null
  
  // Fetch all three data types concurrently and independently
  fetchClicksData()
  fetchConversionsData()
  fetchSubaffiliateSummaryData()
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