<template>
  <div>
    <!-- Subaffiliate Summary Data table -->
    <v-data-table
      v-if="!loading && data.length > 0"
      :headers="tableHeaders"
      :items="data"
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
      v-if="!loading && data.length === 0 && !error"
      type="info"
      class="my-4"
    >
      No subaffiliate summary data available for the selected period.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

// Props from parent component
const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    required: true
  },
  error: {
    type: String,
    default: null
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  formatDate: {
    type: Function,
    required: true
  }
})

// Table headers for subaffiliate summary
const tableHeaders = ref([
  { title: 'Date', key: 'fetched_date', sortable: true },
  { title: 'Sub ID', key: 'sub_id', sortable: true },
  { title: 'Clicks', key: 'clicks', sortable: true },
  { title: 'Conversions', key: 'conversions', sortable: true },
  { title: 'Revenue', key: 'revenue', sortable: true },
  { title: 'EPC', key: 'epc', sortable: true },
  { title: 'Events', key: 'events', sortable: true }
])

// Update headers based on actual data structure when data is loaded
watch(() => props.data, (newData) => {
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
    
    tableHeaders.value = updatedHeaders
  }
}, { immediate: true, deep: true })
</script>