<template>
  <div>
    <h1 class="text-h4 mb-4">Metrics & Analytics</h1>
    
    <!-- Tabs for Performance and Subaffiliate Summary -->
    <v-tabs v-model="activeTab" class="mb-4" color="primary">
      <v-tab value="performance">Performance</v-tab>
      <v-tab value="subaffiliatesummary">Subaffiliate Summary</v-tab>
    </v-tabs>
    
    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <v-window-item value="performance">
        <PerformanceTab />
      </v-window-item>
      
      <v-window-item value="subaffiliatesummary">
        <SubaffiliateSummaryTab />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PerformanceTab from './PerformanceTab/PerformanceTab.vue'
import SubaffiliateSummaryTab from './SubaffiliateSummaryTab/SubaffiliateSummaryTab.vue'

// Tab Control
const activeTab = ref('performance')
</script>

<style scoped>
/* Component-specific styles (if needed) */
</style>