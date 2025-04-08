<template>
  <div>
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

// Props from parent component
const props = defineProps({
  subaffiliateSummaryData: {
    type: Array,
    required: true
  },
  loadingSubaffiliateSummary: {
    type: Boolean,
    required: true
  },
  subaffiliateSummaryError: {
    type: String,
    default: null
  },
  formatDate: {
    type: Function,
    required: true
  }
})

// Table headers for subaffiliate summary
const subaffiliateSummaryHeaders = ref([
  { title: 'Sub ID', key: 'sub_id', sortable: true },
  { title: 'Clicks', key: 'clicks', sortable: true },
  { title: 'Conversions', key: 'conversions', sortable: true },
  { title: 'Revenue', key: 'revenue', sortable: true },
  { title: 'EPC', key: 'epc', sortable: true },
  { title: 'Events', key: 'events', sortable: true }
])

// Update headers based on actual data structure when data is loaded
watch(() => props.subaffiliateSummaryData, (newData) => {
  if (newData && newData.length > 0) {
    const sampleItem = newData[0]
    subaffiliateSummaryHeaders.value = Object.keys(sampleItem).map(key => ({
      title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      key: key,
      sortable: true
    }))
  }
}, { immediate: true })
</script>

<style scoped>
/* Component-specific styles (if needed) */
</style>