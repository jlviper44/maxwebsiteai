<template>
  <div>
    <h1 class="text-h4 mb-4">Dashboard</h1>
    
    <v-row>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-account-group</v-icon>
            Users
          </v-card-title>
          <v-card-text class="text-h4 text-center">
            {{ userCount }}
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-chart-line</v-icon>
            Revenue
          </v-card-title>
          <v-card-text class="text-h4 text-center">
            ${{ revenue.toLocaleString() }}
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-cart</v-icon>
            Orders
          </v-card-title>
          <v-card-text class="text-h4 text-center">
            {{ orderCount }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row class="mt-6">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Recent Activity</v-card-title>
          <v-list lines="two">
            <v-list-item v-for="(item, index) in recentActivity" :key="index">
              <template v-slot:prepend>
                <v-avatar color="primary">
                  <v-icon color="white">{{ item.icon }}</v-icon>
                </v-avatar>
              </template>
              
              <v-list-item-title>{{ item.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
              
              <template v-slot:append>
                <v-chip size="small">{{ item.time }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-btn prepend-icon="mdi-plus" block class="mb-3" color="primary">Add New Item</v-btn>
            <v-btn prepend-icon="mdi-download" block class="mb-3" variant="outlined">Export Data</v-btn>
            <v-btn prepend-icon="mdi-refresh" block variant="outlined">Refresh Stats</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
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