<template>
  <div class="settings-page">
    <h1 class="text-h4 mb-6 settings-title">
      <v-icon icon="mdi-cog" class="mr-2" size="large"></v-icon>
      Settings
    </h1>
    
    <v-card class="settings-card" elevation="3" rounded="lg">
      <div class="d-flex settings-container">
        <!-- Vertical tabs on the left -->
        <v-navigation-drawer
          permanent
          width="220"
          class="settings-navigation rounded-l-lg blue-sidebar"
          theme="dark"
        >
          <v-list nav>
            <v-list-item
              prepend-icon="mdi-tune"
              :active="activeTab === 'general'"
              @click="activeTab = 'general'"
              rounded="lg"
              class="mb-2"
            >
              <v-list-item-title>General</v-list-item-title>
            </v-list-item>
            
            <v-list-item
              prepend-icon="mdi-api"
              :active="activeTab === 'affluentApis'"
              @click="activeTab = 'affluentApis'"
              rounded="lg"
              class="mb-2"
            >
              <v-list-item-title>Affluent APIs</v-list-item-title>
            </v-list-item>
            
            <v-list-item
              prepend-icon="mdi-account-group"
              :active="activeTab === 'users'"
              @click="activeTab = 'users'"
              rounded="lg"
              class="mb-2"
            >
              <v-list-item-title>Users</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>
        
        <!-- Content area on the right -->
        <div class="settings-content flex-grow-1">
          <v-window v-model="activeTab">
            <!-- General Settings -->
            <v-window-item value="general">
              <div class="pa-6">
                <v-breadcrumbs :items="['Settings', 'General']" class="px-0 pb-4"></v-breadcrumbs>
                <GeneralSettings />
              </div>
            </v-window-item>
            
            <!-- Affluent APIs Settings -->
            <v-window-item value="affluentApis">
              <div class="pa-6">
                <v-breadcrumbs :items="['Settings', 'Affluent APIs']" class="px-0 pb-4"></v-breadcrumbs>
                <AffluentApis />
              </div>
            </v-window-item>
            
            <!-- Users Settings -->
            <v-window-item value="users">
              <div class="pa-6">
                <v-breadcrumbs :items="['Settings', 'Users']" class="px-0 pb-4"></v-breadcrumbs>
                <Users />
              </div>
            </v-window-item>
          </v-window>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AffluentApis from './Components/AffluentApis.vue'
import Users from './Components/Users.vue'
import GeneralSettings from './Components/GeneralSettings.vue'

// Active tab
const activeTab = ref('general')
</script>

<style scoped>
.settings-page {
  padding: 12px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.settings-title {
  color: #333;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.settings-card {
  display: flex;
  min-height: calc(100vh - 180px);
  overflow: hidden;
  border: none;
}

.settings-container {
  height: 100%;
  width: 100%;
}

.settings-navigation {
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}

.blue-sidebar {
  background-color: #1976d2 !important;
}

.settings-content {
  background-color: white;
  height: 100%;
  overflow-y: auto;
}

:deep(.v-list-item--active) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

:deep(.v-window) {
  height: 100%;
}
</style>