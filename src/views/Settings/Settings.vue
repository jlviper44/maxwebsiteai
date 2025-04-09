<template>
  <div>
    <h1 class="text-h4 mb-4">Settings</h1>
    
    <v-card>
      <v-tabs v-model="activeTab" bg-color="primary">
        <v-tab value="affluentApis">Affluent APIs</v-tab>
      </v-tabs>
      
      <v-card-text>
        <v-window v-model="activeTab">
          <!-- Affluent APIs Settings -->
          <v-window-item value="affluentApis">
            <div class="mt-4">
              <AffluentApis />
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AffluentApis from './Components/AffluentApis.vue'

// Active tab
const activeTab = ref('affluentApis')
</script>