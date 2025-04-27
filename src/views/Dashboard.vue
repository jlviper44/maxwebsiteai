<template>
  <div>
    <h1 class="text-h4 mb-4">Dashboard</h1>
    
    
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Sample data - in a real app, you would fetch this from your API
const userCount = ref(1248)
const revenue = ref(84621)
const orderCount = ref(356)

const recentActivity = ref([
  { 
    icon: 'mdi-account', 
    title: 'New User Registered', 
    description: 'John Doe has registered a new account', 
    time: '5m ago' 
  },
  { 
    icon: 'mdi-cart', 
    title: 'New Order Placed', 
    description: 'Order #38293 has been placed', 
    time: '1h ago' 
  },
  { 
    icon: 'mdi-currency-usd', 
    title: 'Payment Received', 
    description: 'Payment for order #38290 has been received', 
    time: '3h ago' 
  },
  { 
    icon: 'mdi-alert', 
    title: 'System Alert', 
    description: 'Server load is high - optimizations recommended', 
    time: '5h ago' 
  }
])

// Example of how you might fetch data from your API
onMounted(async () => {
  try {
    // In a real app, you would uncomment and modify these lines
    // const res = await fetch('/api/dashboard-stats')
    // const data = await res.json()
    // userCount.value = data.userCount
    // revenue.value = data.revenue
    // orderCount.value = data.orderCount
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  }
})
</script>