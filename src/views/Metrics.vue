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
              @click="fetchClicksData"
            >
              Apply Filters
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center align-center my-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <span class="ml-2">Loading data...</span>
    </div>
    
    <!-- Error message -->
    <v-alert
      v-if="error"
      type="error"
      class="mb-4"
      closable
    >
      {{ error }}
    </v-alert>
    
    <!-- Data table -->
    <v-data-table
      v-if="!loading && clicksData.length > 0"
      :headers="headers"
      :items="clicksData"
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
      v-if="!loading && clicksData.length === 0 && !error"
      type="info"
      class="my-4"
    >
      No clicks data available for the selected period.
    </v-alert>
  </div>
</template>

<script setup>
import axios from "axios"
import { ref } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

// Data
const clicksData = ref([])
const loading = ref(false)
const error = ref(null)
const startDate = ref(null)
const endDate = ref(null)

// Set default date range (last 30 days)
const today = new Date()
endDate.value = today

const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)
startDate.value = thirtyDaysAgo

// Table headers - adjust based on actual API response structure
const headers = ref([
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Affiliate ID', key: 'affiliate_id', sortable: true },
  { title: 'Merchant', key: 'merchant_name', sortable: true },
  { title: 'Clicks', key: 'clicks', sortable: true },
  { title: 'Conversions', key: 'conversions', sortable: true },
  { title: 'Revenue', key: 'revenue', sortable: true }
])

// Date formatters
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Format for API requests (YYYY-MM-DD)
const formatDateForApi = (date) => {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

// Format for display in the datepicker
const formatDateForDisplay = (date) => {
  return date.toLocaleDateString()
}

// Function to fetch data when date filters are applied
const fetchClicksData = async () => {
  if (!startDate.value || !endDate.value) {
    error.value = "Please select both start and end dates"
    return
  }
  
  try {
    loading.value = true
    error.value = null
    
    const response = await axios.post("/api/clicks", {
      api_key: "hFct58Jru5Y5cPlP8VGq8Q",
      affiliate_id: "207744",
      start_date: formatDateForApi(startDate.value),
      end_date: formatDateForApi(endDate.value)
    })
    
    // Check if response has data property and it's an array
    if (response.data && Array.isArray(response.data.data)) {
      clicksData.value = response.data.data
    } else if (response.data && typeof response.data === 'object') {
      // If the response structure is different, adjust accordingly
      // This is a fallback in case the API returns a different structure
      clicksData.value = Array.isArray(response.data) ? response.data : [response.data]
    }
    
    // Adjust headers based on actual data structure if needed
    if (clicksData.value.length > 0) {
      const sampleItem = clicksData.value[0]
      headers.value = Object.keys(sampleItem).map(key => ({
        title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        key: key,
        sortable: true
      }))
    }
    
    console.log('API Response:', response)
  } catch (err) {
    console.error('Error fetching clicks data:', err)
    error.value = err.response?.data?.error || err.message || 'Failed to fetch clicks data'
  } finally {
    loading.value = false
  }
}
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