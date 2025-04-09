<template>
  <div>
    <!-- Date range and Sub ID selection -->
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
        
        <!-- Sub ID Filter -->
        <div class="mt-4">
          <v-autocomplete
            v-model="selectedSubId"
            :items="availableSubIds"
            label="Filter by Sub ID"
            clearable
            placeholder="All Sub IDs"
            density="comfortable"
            variant="outlined"
            hide-details
            class="max-w-md"
            @update:model-value="filterBySubId"
          >
            <template v-slot:prepend-inner>
              <v-icon>mdi-filter-variant</v-icon>
            </template>
          </v-autocomplete>
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
    
    <!-- Chart Section -->
    <div class="mb-6">
      <v-card class="pa-4">
        <h3 class="text-h6 mb-4">Subaffiliate Metrics Trend</h3>
        <SubaffiliateLineChart
          :data="displayData"
          :start-date="startDateLocal"
          :end-date="endDateLocal"
        />
      </v-card>
    </div>
    
    <!-- Table Section -->
    <div>
      <v-card class="pa-4">
        <h3 class="text-h6 mb-4">Subaffiliate Data</h3>
        <SubaffiliateSummaryTable
          :data="displayData"
          :loading="loadingSubaffiliateSummary"
          :error="subaffiliateSummaryError"
          :start-date="startDateLocal"
          :end-date="endDateLocal"
          :format-date="formatDate"
        />
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import axios from 'axios'
import SubaffiliateSummaryTable from './Components/SubaffiliateSummaryTable.vue'
import SubaffiliateLineChart from './Components/SubaffiliateChartComponent.vue'

// Local state variables
const startDateLocal = ref(null)
const endDateLocal = ref(null)
const combinedData = ref([])
const filteredData = ref([])
const selectedSubId = ref(null)
const localLoadingState = ref(false)
const localErrorState = ref(null)
const processedDays = ref(0)
const totalDays = ref(0)
const pendingRequests = ref(0) // Track pending requests

// Define formatDate function internally instead of receiving as prop
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Computed property for loading state
const loadingSubaffiliateSummary = computed(() => {
  return localLoadingState.value
})

// Computed property for error state
const subaffiliateSummaryError = computed(() => {
  return localErrorState.value
})

// Computed property to get unique Sub IDs from data
const availableSubIds = computed(() => {
  if (!combinedData.value || combinedData.value.length === 0) return []
  
  const subIds = [...new Set(combinedData.value.map(item => item.sub_id))]
  return subIds.sort()
})

// Computed property to get final data to display (either filtered or all)
const displayData = computed(() => {
  if (selectedSubId.value && filteredData.value.length > 0) {
    return filteredData.value;
  }
  return combinedData.value;
})

// Filter data by Sub ID
const filterBySubId = () => {
  if (!selectedSubId.value) {
    // If no Sub ID is selected, show all data
    filteredData.value = [];
    return;
  }
  
  // Filter the combined data by the selected Sub ID
  filteredData.value = [...combinedData.value.filter(item => 
    item.sub_id === selectedSubId.value
  )];
}

// Watch for changes in the selected Sub ID
watch(selectedSubId, () => {
  filterBySubId();
});

// Watch for changes in combined data to update filtered data if needed
watch(combinedData, () => {
  if (selectedSubId.value) {
    filterBySubId();
  }
}, { deep: true });

// Set default dates (today minus 7 days to today)
onMounted(() => {
  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 7)
  
  // Set default date range
  startDateLocal.value = sevenDaysAgo
  endDateLocal.value = today
  
  // Fetch data automatically on mount with a slight delay
  // to ensure all components are properly mounted
  setTimeout(() => {
    applyDateFilter()
  }, 100)
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
  
  // Get all dates in range
  const dateRange = getDatesInRange(startDateLocal.value, endDateLocal.value)
  totalDays.value = dateRange.length
  processedDays.value = 0
  pendingRequests.value = dateRange.length
  
  // Clear previous data, filtered data, and error
  combinedData.value = []
  filteredData.value = []
  selectedSubId.value = null
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

/* Max width for autocomplete */
.max-w-md {
  max-width: 400px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .date-range-container {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>