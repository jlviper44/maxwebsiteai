<template>
  <div>
    <!-- Date range selection -->
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

    <!-- Hourly Chart Component -->
    <HourlyChart 
      :clicks-data="clicksData"
      :conversions-data="conversionsData"
      :loading="loadingClicks || loadingConversions"
      :filters="filters"
    />
    
    <!-- Filters for Performance Tab -->
    <v-card class="mb-4 pa-4" elevation="1">
      <div class="d-flex flex-wrap align-center">
        <v-autocomplete
          v-model="filters.offerName"
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
          v-model="filters.subId"
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
    
    <!-- Data Tables Component -->
    <DataTables
      :clicks-data="clicksData"
      :conversions-data="conversionsData"
      :loading-clicks="loadingClicks"
      :loading-conversions="loadingConversions"
      :clicks-error="clicksError"
      :conversions-error="conversionsError"
      :format-date-and-time="formatDateAndTime"
      :filters="filters"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import HourlyChart from './Components/HourlyChart.vue'
import DataTables from './Components/DataTables.vue'

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

// Filter state
const filters = ref({
  offerName: null,
  subId: null
})

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

// Function to apply filters
const applyFilters = () => {
  // Filters are automatically applied through computed properties
  console.log('Applying filters - Offer:', filters.value.offerName, 'Sub ID:', filters.value.subId)
}

// Function to clear filters
const clearFilters = () => {
  filters.value.offerName = null
  filters.value.subId = null
}

// Initialize with current dates
onMounted(() => {
  // Initialize the selectedDate with the parent component's date
  if (props.startDate) {
    selectedDate.value = new Date(props.startDate)
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
</style>