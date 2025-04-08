<template>
  <div>
    <!-- Date range selection -->
    <div class="date-filters mb-6">
      <v-card class="pa-4 date-card no-border" elevation="0">
        <div class="d-flex flex-wrap align-center justify-space-between">
          <div class="date-range-container d-flex flex-wrap align-center">
            <div class="me-4 mb-2 date-picker-container">
              <label class="text-body-1 mb-1 d-block">Start Date</label>
              <Datepicker 
                v-model="startDateLocal" 
                :max-date="endDateLocal || new Date()"
                auto-apply
                :enable-time-picker="false"
                text-input
                placeholder="Select start date"
                position="bottom"
                @update:model-value="onStartDateChange"
              />
            </div>
            
            <div class="me-4 mb-2 date-picker-container">
              <label class="text-body-1 mb-1 d-block">End Date</label>
              <Datepicker 
                v-model="endDateLocal" 
                :min-date="startDateLocal"
                :max-date="new Date()"
                auto-apply
                :enable-time-picker="false"
                text-input
                placeholder="Select end date"
                position="bottom"
                @update:model-value="onEndDateChange"
              />
            </div>
          </div>
          
          <div class="mb-2">
            <v-btn 
              color="primary" 
              :loading="loadingSubaffiliateSummary"
              :disabled="!startDateLocal || !endDateLocal"
              @click="applyDateFilter"
            >
              Fetch Daily Data
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>
    
    <!-- Loading state with progress indicator -->
    <div v-if="loadingSubaffiliateSummary" class="d-flex flex-column justify-center align-center my-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <span class="mt-2">Loading data for each day in range...</span>
      <div v-if="totalDays > 0" class="mt-2 text-body-2">
        Processed {{ processedDays }} of {{ totalDays }} days ({{ Math.round((processedDays / totalDays) * 100) }}%)
      </div>
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
    
    <!-- Date range info when data is loaded -->
    <div v-if="!loadingSubaffiliateSummary && combinedData.length > 0" class="mb-4">
      <v-alert type="info" density="compact">
        <strong>Data Range:</strong> {{ formatDate(startDateLocal) }} to {{ formatDate(endDateLocal) }} 
        ({{ totalDays }} {{ totalDays === 1 ? 'day' : 'days' }})
      </v-alert>
    </div>
    
    <!-- Subaffiliate Summary Data table -->
    <v-data-table
      v-if="!loadingSubaffiliateSummary && combinedData.length > 0"
      :headers="subaffiliateSummaryHeaders"
      :items="combinedData"
      :items-per-page="10"
      :footer-props="{
        'items-per-page-options': [10, 20, 50, 100]
      }"
      class="elevation-1"
    >
      <!-- Custom formatting for date column -->
      <template v-slot:item.fetched_date="{ item }">
        {{ formatDate(new Date(item.fetched_date)) }}
      </template>
    </v-data-table>
    
    <!-- No data message -->
    <v-alert
      v-if="!loadingSubaffiliateSummary && combinedData.length === 0 && !subaffiliateSummaryError"
      type="info"
      class="my-4"
    >
      No subaffiliate summary data available for the selected period.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import axios from 'axios'

// Define emits
const emit = defineEmits(['date-range-change'])

// Props from parent component
const props = defineProps({
  formatDate: {
    type: Function,
    required: true
  }
})

// Local state variables
const startDateLocal = ref(null)
const endDateLocal = ref(null)
const combinedData = ref([])
const localLoadingState = ref(false)
const localErrorState = ref(null)
const processedDays = ref(0)
const totalDays = ref(0)
const pendingRequests = ref(0) // Track pending requests

// Computed property for loading state
const loadingSubaffiliateSummary = computed(() => {
  return localLoadingState.value
})

// Computed property for error state
const subaffiliateSummaryError = computed(() => {
  return localErrorState.value
})

// Set default dates (today minus 7 days to today)
onMounted(() => {
  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 7)
  
  // Set default date range
  startDateLocal.value = sevenDaysAgo
  endDateLocal.value = today
})

// Handle start date change
const onStartDateChange = (date) => {
  if (date) {
    // Create new Date object for start date
    const startDateObj = new Date(date)
    startDateObj.setHours(0, 0, 0, 0)
    startDateLocal.value = startDateObj
    
    // If end date is before start date, update end date
    if (endDateLocal.value && endDateLocal.value < startDateObj) {
      endDateLocal.value = new Date(startDateObj)
    }
  }
}

// Handle end date change
const onEndDateChange = (date) => {
  if (date) {
    // Create new Date object for end date
    const endDateObj = new Date(date)
    endDateObj.setHours(23, 59, 59, 999)
    endDateLocal.value = endDateObj
  }
}

// Function to format date for API (YYYY-MM-DD HH:MM:SS)
const formatDateForApi = (date, isEndDate = false) => {
  if (!date) return ''
  
  const formattedDate = new Date(date)
  
  if (isEndDate) {
    formattedDate.setHours(23, 59, 59, 999)
  } else {
    formattedDate.setHours(0, 0, 0, 0)
  }
  
  const year = formattedDate.getFullYear()
  const month = String(formattedDate.getMonth() + 1).padStart(2, '0')
  const day = String(formattedDate.getDate()).padStart(2, '0')
  const hours = String(formattedDate.getHours()).padStart(2, '0')
  const minutes = String(formattedDate.getMinutes()).padStart(2, '0')
  const seconds = String(formattedDate.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// Function to get all dates in range
const getDatesInRange = (startDate, endDate) => {
  const dates = []
  const currentDate = new Date(startDate)
  
  // Include the start date
  currentDate.setHours(0, 0, 0, 0)
  
  // End date (set to end of day for comparison)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  
  // Generate all dates in range
  while (currentDate <= end) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

// Get request parameters for API call
const getRequestParams = (startDate, endDate) => {
  const fields = [
    'sub_id',
    'clicks',
    'conversions',
    'revenue',
    'epc',
    'events',
    'date'
  ]
  
  return {
    api_key: "hFct58Jru5Y5cPlP8VGq8Q",
    affiliate_id: "207744",
    start_date: formatDateForApi(startDate, false),
    end_date: formatDateForApi(endDate, true),
    fields: fields
  }
}

// Function to fetch data for a single day
const fetchDayData = async (date) => {
  try {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    
    console.log(`Fetching data for ${dayStart.toLocaleDateString()}`)
    
    const response = await axios.post("/api/subaffiliatesummary", getRequestParams(dayStart, dayEnd))
    
    // Add date information to each record
    let data = []
    if (response.data && Array.isArray(response.data.data)) {
      data = response.data.data.map(item => ({
        ...item,
        fetched_date: dayStart.toISOString().split('T')[0] // Add date in YYYY-MM-DD format
      }))
    } else if (response.data && typeof response.data === 'object') {
      data = Array.isArray(response.data) 
        ? response.data.map(item => ({ ...item, fetched_date: dayStart.toISOString().split('T')[0] }))
        : [{ ...response.data, fetched_date: dayStart.toISOString().split('T')[0] }]
    }
    
    return data
  } catch (error) {
    console.error(`Error fetching data for ${date}:`, error)
    throw error
  }
}

// Apply date filter and fetch data
const applyDateFilter = async () => {
  if (!startDateLocal.value || !endDateLocal.value) return
  
  // Emit the date range change event
  emit('date-range-change', {
    startDate: startDateLocal.value,
    endDate: endDateLocal.value
  })
  
  // Get all dates in range
  const dateRange = getDatesInRange(startDateLocal.value, endDateLocal.value)
  totalDays.value = dateRange.length
  processedDays.value = 0
  pendingRequests.value = dateRange.length
  
  // Clear previous data and error
  combinedData.value = []
  localErrorState.value = null
  
  // Set loading state
  localLoadingState.value = true
  
  try {
    // Create an array to hold all promises
    const promises = dateRange.map(date => {
      // Return a promise that will handle its own completion
      return fetchDayData(date)
        .then(dayData => {
          // Update progress and return data
          processedDays.value++
          return dayData
        })
        .catch(error => {
          // Update progress even on error, but return empty array
          processedDays.value++
          console.error(`Error processing day ${date.toLocaleDateString()}:`, error)
          return [] // Return empty array to continue with other dates
        })
    })
    
    // Wait for all promises to resolve (in parallel)
    const results = await Promise.all(promises)
    
    // Combine all results
    const allData = results.flat()
    combinedData.value = allData
    
    // Check if we got any data
    if (allData.length === 0) {
      localErrorState.value = "No data found for the selected date range."
    }
  } catch (error) {
    console.error("Error fetching daily data:", error)
    localErrorState.value = error.message || "Failed to fetch data for the selected date range."
  } finally {
    localLoadingState.value = false
  }
}

// Table headers for subaffiliate summary
const subaffiliateSummaryHeaders = ref([
  { title: 'Date', key: 'fetched_date', sortable: true },
  { title: 'Sub ID', key: 'sub_id', sortable: true },
  { title: 'Clicks', key: 'clicks', sortable: true },
  { title: 'Conversions', key: 'conversions', sortable: true },
  { title: 'Revenue', key: 'revenue', sortable: true },
  { title: 'EPC', key: 'epc', sortable: true },
  { title: 'Events', key: 'events', sortable: true }
])

// Update headers based on actual data structure when data is loaded
watch(() => combinedData.value, (newData) => {
  if (newData && newData.length > 0) {
    const sampleItem = newData[0]
    
    // Make sure fetched_date is always first
    const updatedHeaders = [
      { title: 'Date', key: 'fetched_date', sortable: true }
    ]
    
    // Add all other keys (except fetched_date which we already added)
    Object.keys(sampleItem)
      .filter(key => key !== 'fetched_date')
      .forEach(key => {
        updatedHeaders.push({
          title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          key: key,
          sortable: true
        })
      })
    
    subaffiliateSummaryHeaders.value = updatedHeaders
  }
}, { immediate: true })
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
  width: 200px;
}

/* Fix for date picker z-index issue */
:deep(.dp__outer_menu) {
  z-index: 100 !important;
}

:deep(.dp__menu) {
  z-index: 100 !important;
  background-color: white !important;
}

:deep(.dp__overlay) {
  z-index: 100 !important;
}

/* Make sure the date picker input doesn't get clipped */
:deep(.dp__input) {
  z-index: 2;
  background-color: white !important;
}

/* Ensure the date picker popup has enough space */
:deep(.dp__instance_calendar) {
  position: absolute;
  margin-top: 0;
  background-color: white !important;
}

/* Set background color for all date picker components */
:deep(.dp__main) {
  background-color: white !important;
}

:deep(.dp__calendar_header) {
  background-color: white !important;
}

:deep(.dp__calendar) {
  background-color: white !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .date-range-container {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>