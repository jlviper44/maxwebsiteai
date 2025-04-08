<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
    <div v-if="!data || data.length === 0" class="no-data-message">
      No data available for chart visualization
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  }
});

const chartCanvas = ref(null);
let chart = null;

// Computed property to sort data by date
const sortedData = computed(() => {
  if (!props.data || props.data.length === 0) return [];
  
  return [...props.data].sort((a, b) => {
    return new Date(a.fetched_date) - new Date(b.fetched_date);
  });
});

// Generate datasets for chart
const generateChartData = () => {
  if (!sortedData.value || sortedData.value.length === 0) return null;
  
  // Extract unique dates for x-axis
  const dates = [...new Set(sortedData.value.map(item => item.fetched_date))].sort();
  
  // Prepare datasets for each metric
  const metrics = {
    clicks: {
      label: 'Clicks',
      borderColor: '#1976D2',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      data: [],
      yAxisID: 'count'
    },
    conversions: {
      label: 'Conversions',
      borderColor: '#43A047',
      backgroundColor: 'rgba(67, 160, 71, 0.1)',
      data: [],
      yAxisID: 'count'
    },
    revenue: {
      label: 'Revenue',
      borderColor: '#F57C00',
      backgroundColor: 'rgba(245, 124, 0, 0.1)',
      data: [],
      yAxisID: 'revenue'
    },
    epc: {
      label: 'EPC',
      borderColor: '#9C27B0',
      backgroundColor: 'rgba(156, 39, 176, 0.1)',
      data: [],
      yAxisID: 'epc'
    },
    events: {
      label: 'Events',
      borderColor: '#E53935',
      backgroundColor: 'rgba(229, 57, 53, 0.1)',
      data: [],
      yAxisID: 'count'
    }
  };
  
  // Aggregate data by date for each metric
  dates.forEach(date => {
    const dayData = sortedData.value.filter(item => item.fetched_date === date);
    
    // Sum all metrics for the day
    const dayTotals = dayData.reduce((totals, item) => {
      // Ensure all needed properties exist and are numbers
      totals.clicks += Number(item.clicks || 0);
      totals.conversions += Number(item.conversions || 0);
      totals.revenue += Number(item.revenue || 0);
      totals.epc += Number(item.epc || 0);
      totals.events += Number(item.events || 0);
      return totals;
    }, { clicks: 0, conversions: 0, revenue: 0, epc: 0, events: 0 });
    
    // Update each metric's dataset
    Object.keys(metrics).forEach(key => {
      metrics[key].data.push(dayTotals[key]);
    });
  });
  
  // Format dates for display
  const formattedDates = dates.map(dateStr => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  });
  
  return {
    labels: formattedDates,
    datasets: Object.values(metrics)
  };
};

// Initialize or update chart
const initOrUpdateChart = () => {
  const chartData = generateChartData();
  
  if (!chartData) return;
  
  const ctx = chartCanvas.value.getContext('2d');
  
  // Destroy existing chart if it exists
  if (chart) {
    chart.destroy();
  }
  
  // Create new chart
  chart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false
        },
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        title: {
          display: true,
          text: 'Subaffiliate Metrics Over Time'
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date'
          }
        },
        count: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Count'
          },
          grid: {
            drawOnChartArea: false
          }
        },
        revenue: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Revenue ($)'
          },
          grid: {
            drawOnChartArea: false
          }
        },
        epc: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'EPC'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
};

// Initialize chart when component is mounted
onMounted(() => {
  if (props.data && props.data.length > 0) {
    initOrUpdateChart();
  }
});

// Watch for changes in data and update chart
watch(() => props.data, () => {
  if (props.data && props.data.length > 0) {
    initOrUpdateChart();
  }
}, { deep: true });

// Watch for changes in date range
watch([() => props.startDate, () => props.endDate], () => {
  if (props.data && props.data.length > 0) {
    initOrUpdateChart();
  }
});
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
  margin: 20px 0;
}

.no-data-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #757575;
  font-size: 1rem;
}
</style>