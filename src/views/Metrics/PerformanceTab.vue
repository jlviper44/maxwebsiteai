<template>
  <div>
    <!-- Date range selection (moved from Metrics.vue) -->
    <div class="date-filters mb-6">
      <v-card class="pa-4 date-card no-border" elevation="0">
        <div class="d-flex flex-wrap align-center">
          <div class="me-4 mb-2 date-picker-container">
            <label class="text-body-1 mb-1 d-block">Date</label>
            <Datepicker 
              v-model="selectedDate" 
              :max-date="new Date()"
              auto-apply
              :enable-time-picker="false"
              text-input
              placeholder="Select date"
              :format="formatDateForDisplay"
              position="bottom"
              @update:model-value="onSelectedDateChange"
            />
          </div>
          
          <div class="mb-2 mt-4">
            <v-btn 
              color="primary" 
              :loading="loadingClicks || loadingConversions"
              :disabled="!startDate || !endDate"
              @click="applyDateFilter"
            >
              Apply Filters
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>

    <!-- Hourly Chart -->
    <v-card class="mb-4 pa-4" elevation="1">
      <h3 class="text-h6 mb-3">Hourly Performance</h3>
      <div v-if="loadingClicks || loadingConversions" class="d-flex justify-center align-center my-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <span class="ml-2">Loading chart data...</span>
      </div>
      <div v-else-if="!clicksData.length && !conversionsData.length" class="my-4">
        <v-alert type="info">No data available for the chart.</v-alert>
      </div>
      <div v-else class="chart-container">
        <canvas ref="hourlyChartRef"></canvas>
      </div>
    </v-card>
    
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
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

// Define emits
const emit = defineEmits(['date-change', 'fetch-data'])

// Props from parent component
const props = defineProps({
  clicksData: {
    type: Array,
    required: true
  },
  conversionsData: {
    type: Array,
    required: true
  },
  loadingClicks: {
    type: Boolean,
    required: true
  },
  loadingConversions: {
    type: Boolean,
    required: true
  },
  clicksError: {
    type: String,
    default: null
  },
  conversionsError: {
    type: String,
    default: null
  },
  formatDateAndTime: {
    type: Function,
    required: true
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  formatDateForDisplay: {
    type: Function,
    required: true
  }
})

// Local date state
const selectedDate = ref(new Date())

// Handle date change
const onSelectedDateChange = (date) => {
  if (date) {
    // Create new Date objects for start and end
    const selectedDateObj = new Date(date)
    
    // Set start time to 00:00:00
    const startDateObj = new Date(selectedDateObj)
    startDateObj.setHours(0, 0, 0, 0)
    
    // Set end time to 23:59:59
    const endDateObj = new Date(selectedDateObj)
    endDateObj.setHours(23, 59, 59, 999)
    
    // Emit the date change to parent component
    emit('date-change', {
      startDate: startDateObj,
      endDate: endDateObj
    })
  }
}

// Trigger fetch data in parent component
const applyDateFilter = () => {
  emit('fetch-data')
}

// Filter values
const offerNameFilter = ref(null)
const subIdFilter = ref(null)

// Table headers for clicks
const clicksHeaders = ref([
  { title: 'Date & Time', key: 'click_date', sortable: true },
  { title: 'Offer Name', key: 'offer.offer_name', sortable: true },
  { title: 'Sub ID', key: 'subid_1', sortable: true }
])

// Table headers for conversions
const conversionsHeaders = ref([
  { title: 'Date & Time', key: 'conversion_date', sortable: true },
  { title: 'Offer Name', key: 'offer_name', sortable: true },
  { title: 'Sub ID', key: 'subid_1', sortable: true },
  { title: 'Price', key: 'price', sortable: true }
])

// Computed properties for filter options
const offerNameOptions = computed(() => {
  const clicksOffers = props.clicksData
    .map(item => item.offer?.offer_name)
    .filter(name => name)
  
  const conversionOffers = props.conversionsData
    .map(item => item.offer_name)
    .filter(name => name)
  
  // Combine unique offer names from both datasets
  return [...new Set([...clicksOffers, ...conversionOffers])].sort()
})

const subIdOptions = computed(() => {
  const clicksSubIds = props.clicksData
    .map(item => item.subid_1)
    .filter(id => id)
  
  const conversionSubIds = props.conversionsData
    .map(item => item.subid_1)
    .filter(id => id)
  
  // Combine unique subids from both datasets
  return [...new Set([...clicksSubIds, ...conversionSubIds])].sort()
})

// Filtered data based on selected filters
const filteredClicksData = computed(() => {
  let filtered = [...props.clicksData]
  
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
  let filtered = [...props.conversionsData]
  
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

// Chart reference and instance
const hourlyChartRef = ref(null)
let hourlyChart = null

// Function to group clicks data by hour
const groupClicksByHour = (clicksData) => {
  // Initialize an array to hold click counts for each hour (0-23)
  const hourlyClicks = Array(24).fill(0)
  
  // Process each click
  clicksData.forEach(click => {
    if (!click.click_date) return
    
    // Parse the timestamp to a Date object
    const clickDate = new Date(click.click_date)
    
    // Get the hour in local time
    const hour = clickDate.getHours()
    
    // Increment the count for that hour
    hourlyClicks[hour]++
  })
  
  return hourlyClicks
}

// Function to group conversions data by hour and sum prices
const groupConversionsByHour = (conversionsData) => {
  // Initialize an array to hold conversion price sums for each hour (0-23)
  const hourlyConversions = Array(24).fill(0)
  
  // Process each conversion
  conversionsData.forEach(conversion => {
    if (!conversion.conversion_date || !conversion.price) return
    
    // Parse the timestamp to a Date object
    const conversionDate = new Date(conversion.conversion_date)
    
    // Get the hour in local time
    const hour = conversionDate.getHours()
    
    // Add the price to the sum for that hour
    hourlyConversions[hour] += parseFloat(conversion.price) || 0
  })
  
  return hourlyConversions
}

// Function to create and update the chart
const updateChart = () => {
  console.log('Updating chart with data', { 
    clicksLength: filteredClicksData.value.length, 
    conversionsLength: filteredConversionsData.value.length 
  })
  
  if (!hourlyChartRef.value) {
    console.log('Chart reference not available yet')
    return
  }
  
  // If a chart instance already exists, destroy it
  if (hourlyChart) {
    console.log('Destroying existing chart')
    hourlyChart.destroy()
  }
  
  // Process data
  const hourlyClicksData = groupClicksByHour(filteredClicksData.value)
  const hourlyConversionsData = groupConversionsByHour(filteredConversionsData.value)
  
  // Create labels for 24 hours (0-23)
  const labels = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0') + ':00')
  
  // Get chart context
  const ctx = hourlyChartRef.value.getContext('2d')
  
  // Create new chart
  hourlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Clicks',
          data: hourlyClicksData,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.2,
          yAxisID: 'y',
        },
        {
          label: 'Revenue ($)',
          data: hourlyConversionsData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.2,
          yAxisID: 'y1',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Hour (24h format)'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Click Count'
          },
          beginAtZero: true,
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Conversion Revenue ($)'
          },
          beginAtZero: true,
          grid: {
            drawOnChartArea: false, // only want the grid lines for one axis to show up
          },
        }
      }
    }
  })
}

// Initialize with current dates
onMounted(() => {
  // Initialize the selectedDate with the parent component's date
  if (props.startDate) {
    selectedDate.value = new Date(props.startDate)
  }
})

// Watch for data changes to update the chart
watch([() => props.clicksData, () => props.conversionsData, offerNameFilter, subIdFilter], () => {
  if (!props.loadingClicks && !props.loadingConversions) {
    nextTick(() => {
      updateChart()
    })
  }
}, { deep: true, immediate: true })

// Initialize chart when component is mounted and watch for loading states to finish
onMounted(() => {
  nextTick(() => {
    if (!props.loadingClicks && !props.loadingConversions && (props.clicksData.length > 0 || props.conversionsData.length > 0)) {
      updateChart()
    }
  })
})

// Watch specifically for the loading state to transition from true to false
watch([() => props.loadingClicks, () => props.loadingConversions], ([newLoadingClicks, newLoadingConversions], [oldLoadingClicks, oldLoadingConversions]) => {
  if ((oldLoadingClicks && !newLoadingClicks) || (oldLoadingConversions && !newLoadingConversions)) {
    // Loading just finished, update the chart
    nextTick(() => {
      updateChart()
    })
  }
})

// Clean up chart instance when component is unmounted
onUnmounted(() => {
  if (hourlyChart) {
    hourlyChart.destroy()
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
  width: 250px;
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

.chart-container {
  height: 400px;
  position: relative;
  margin-bottom: 20px;
}

.chart-placeholder {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 4px;
}

</style>