<template>
  <v-card class="mb-4 pa-4" elevation="1">
    <h3 class="text-h6 mb-3">Hourly Performance</h3>
    <div v-if="loading" class="d-flex justify-center align-center my-4">
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
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Chart from 'chart.js/auto'

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
  loading: {
    type: Boolean,
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

// Chart reference and instance
const hourlyChartRef = ref(null)
let hourlyChart = null

// Computed properties for filtered data based on props.filters
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

// Watch for data changes to update the chart
watch([() => filteredClicksData.value, () => filteredConversionsData.value], () => {
  if (!props.loading) {
    nextTick(() => {
      updateChart()
    })
  }
}, { deep: true, immediate: true })

// Initialize chart when component is mounted and watch for loading states to finish
onMounted(() => {
  nextTick(() => {
    if (!props.loading && (filteredClicksData.value.length > 0 || filteredConversionsData.value.length > 0)) {
      updateChart()
    }
  })
})

// Watch specifically for the loading state to transition from true to false
watch(() => props.loading, (newLoading, oldLoading) => {
  if (oldLoading && !newLoading) {
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