<template>
  <div>
    <h1 class="text-h4 mb-4">Metrics & Analytics</h1>
    
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
          :startDate="startDate"
          :endDate="endDate"
          :formatDateForDisplay="formatDateForDisplay"
          @date-change="onDateChange"
          @fetch-data="fetchAllData"
        />
      </v-window-item>
      
      <v-window-item value="subaffiliatesummary">
        <SubaffiliateSummaryTab 
          :formatDate="formatDate"
          @date-range-change="onSubaffiliateRangeChange"
        />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import axios from "axios"
import { ref, watch, computed } from 'vue'
import PerformanceTab from './PerformanceTab/PerformanceTab.vue'
import SubaffiliateSummaryTab from './SubaffiliateSummaryTab/SubaffiliateSummaryTab.vue'

// Tab Control
const activeTab = ref('performance')

// Data
const clicksData = ref([])
const conversionsData = ref([])

// Separate loading states for performance data
const loadingClicks = ref(false)
const loadingConversions = ref(false)

// Computed property for overall loading state
const loading = computed(() => {
  return loadingClicks.value || loadingConversions.value
})

// Separate error states for performance data
const clicksError = ref(null)
const conversionsError = ref(null)

// Date states for performance tab
const startDate = ref(null)
const endDate = ref(null)

// Date states for subaffiliate tab (maintained for backward compatibility)
const subaffiliateStartDate = ref(null)
const subaffiliateEndDate = ref(null)

// Set default date to today
const today = new Date()

// Set initial start and end dates to today
startDate.value = new Date(today)
startDate.value.setHours(0, 0, 0, 0)
endDate.value = new Date(today)
endDate.value.setHours(23, 59, 59, 999)

// Set initial subaffiliate date range to last 7 days
subaffiliateStartDate.value = new Date(today)
subaffiliateStartDate.value.setDate(today.getDate() - 7)
subaffiliateStartDate.value.setHours(0, 0, 0, 0)
subaffiliateEndDate.value = new Date(today)
subaffiliateEndDate.value.setHours(23, 59, 59, 999)

// Handle date change for performance tab
const onDateChange = (dates) => {
  if (dates) {
    startDate.value = dates.startDate
    endDate.value = dates.endDate
    
    console.log('Performance date changed:', {
      startDate: startDate.value,
      endDate: endDate.value
    })
  }
}

// Handle date range change for subaffiliate tab
const onSubaffiliateRangeChange = (dates) => {
  if (dates) {
    subaffiliateStartDate.value = dates.startDate
    subaffiliateEndDate.value = dates.endDate
    
    console.log('Subaffiliate date range changed:', {
      startDate: subaffiliateStartDate.value,
      endDate: subaffiliateEndDate.value
    })
  }
}

// Date formatters
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Format for display in the date picker
const formatDateForDisplay = (date) => {
  if (!date) return ''
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

// Function to fetch performance data
const fetchAllData = () => {
  if (!startDate.value || !endDate.value) {
    // Set performance error states to show the same message
    clicksError.value = "Please select both start and end dates"
    conversionsError.value = "Please select both start and end dates"
    return
  }
  
  // Clear previous data
  clicksData.value = []
  conversionsData.value = []
  
  // Clear previous errors
  clicksError.value = null
  conversionsError.value = null
  
  // Fetch performance data types concurrently and independently
  fetchClicksData()
  fetchConversionsData()
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
  }
})
</script>

<style scoped>
/* Component-specific styles (if needed) */
</style>