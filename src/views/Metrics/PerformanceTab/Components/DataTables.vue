<template>
  <div>
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
import { computed } from 'vue'

// Define props from parent component
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
  filters: {
    type: Object,
    default: () => ({
      offerName: null,
      subId: null
    })
  }
})

// Table headers for clicks
const clicksHeaders = [
  { title: 'Date & Time', key: 'click_date', sortable: true },
  { title: 'Offer Name', key: 'offer.offer_name', sortable: true },
  { title: 'Sub ID', key: 'subid_1', sortable: true }
]

// Table headers for conversions
const conversionsHeaders = [
  { title: 'Date & Time', key: 'conversion_date', sortable: true },
  { title: 'Offer Name', key: 'offer_name', sortable: true },
  { title: 'Sub ID', key: 'subid_1', sortable: true },
  { title: 'Price', key: 'price', sortable: true }
]

// Filtered data based on selected filters
const filteredClicksData = computed(() => {
  let filtered = [...props.clicksData]
  
  if (props.filters.offerName) {
    filtered = filtered.filter(item => 
      item.offer?.offer_name === props.filters.offerName
    )
  }
  
  if (props.filters.subId) {
    filtered = filtered.filter(item => 
      item.subid_1 === props.filters.subId
    )
  }
  
  return filtered
})

const filteredConversionsData = computed(() => {
  let filtered = [...props.conversionsData]
  
  if (props.filters.offerName) {
    filtered = filtered.filter(item => 
      item.offer_name === props.filters.offerName
    )
  }
  
  if (props.filters.subId) {
    filtered = filtered.filter(item => 
      item.subid_1 === props.filters.subId
    )
  }
  
  return filtered
})
</script>