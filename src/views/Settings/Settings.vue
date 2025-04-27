<template>
  <div class="settings-page">
    <h1 class="text-h4 mb-6 settings-title">
      <v-icon icon="mdi-cog" class="mr-2" size="large" color="primary"></v-icon>
      Settings
    </h1>
    
    <v-card class="settings-card elevation-2 rounded-lg" variant="elevated">
      <div class="d-flex settings-container">
        <!-- Vertical tabs on the left -->
        <div class="settings-sidebar rounded-l-lg" :class="isDarkMode ? 'theme-dark' : 'theme-light'">
          <v-list nav class="pa-2">
            <v-list-item
              prepend-icon="mdi-tune"
              :active="activeTab === 'general'"
              @click="activeTab = 'general'"
              rounded="lg"
              class="mb-3 nav-item"
              active-color="primary"
            >
              <v-list-item-title>General</v-list-item-title>
            </v-list-item>
            
            <v-list-item
              prepend-icon="mdi-api"
              :active="activeTab === 'affluentApis'"
              @click="activeTab = 'affluentApis'"
              rounded="lg"
              class="mb-3 nav-item"
              active-color="primary"
            >
              <v-list-item-title>Affluent APIs</v-list-item-title>
            </v-list-item>
            
            <v-list-item
              prepend-icon="mdi-account-group"
              :active="activeTab === 'users'"
              @click="activeTab = 'users'"
              rounded="lg"
              class="mb-3 nav-item"
              active-color="primary"
            >
              <v-list-item-title>Users</v-list-item-title>
            </v-list-item>
          </v-list>
          
          <div class="pa-4 mt-auto">
            <v-divider class="mb-3"></v-divider>
            <div class="d-flex align-center">
              <v-icon icon="mdi-information-outline" size="small" class="me-2" color="primary"></v-icon>
              <span class="text-caption text-medium-emphasis">Settings version 1.2.0</span>
            </div>
          </div>
        </div>
        
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
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import AffluentApis from './Components/AffluentApis.vue'
import Users from './Components/Users.vue'
import GeneralSettings from './Components/GeneralSettings.vue'

// Initialize Vuetify theme
const theme = useTheme();

// Get current theme
const isDarkMode = computed(() => {
  return theme.global.current.value.dark;
});

// Active tab
const activeTab = ref('general')
</script>

<style>
:root {
  --settings-page-bg: #f5f7fa;
  --settings-title-color: #333333;
  --settings-card-bg: #ffffff;
  --settings-nav-bg: #ffffff;
  --settings-nav-bg-light: #ffffff;
  --settings-nav-text-light: #333333;
  --settings-nav-bg-dark: #1e1e1e;
  --settings-nav-text-dark: #ffffff;
  --settings-content-bg: #ffffff;
  --nav-item-hover: rgba(25, 118, 210, 0.08);
  --nav-item-active: rgba(25, 118, 210, 0.15);
  --transition-speed: 0.3s;
}

[data-theme="dark"] {
  --settings-page-bg: #121212;
  --settings-title-color: #ffffff;
  --settings-card-bg: #1e1e1e;
  --settings-nav-bg: #1e1e1e;
  --settings-nav-bg-light: #ffffff;
  --settings-nav-text-light: #333333;
  --settings-nav-bg-dark: #1e1e1e;
  --settings-nav-text-dark: #ffffff;
  --settings-content-bg: #1e1e1e;
  --nav-item-hover: rgba(100, 181, 246, 0.08);
  --nav-item-active: rgba(100, 181, 246, 0.15);
}
</style>

<style scoped>
.settings-page {
  padding: 16px;
  background-color: var(--settings-page-bg);
  min-height: calc(100vh - 64px);
  transition: background-color var(--transition-speed) ease;
}

.settings-title {
  color: var(--settings-title-color);
  font-weight: 600;
  display: flex;
  align-items: center;
  transition: color var(--transition-speed) ease;
}

.settings-card {
  display: flex;
  min-height: calc(100vh - 180px);
  overflow: hidden;
  background-color: var(--settings-card-bg) !important;
  transition: background-color var(--transition-speed) ease;
  border: none;
}

.settings-container {
  height: 100%;
  width: 100%;
}

.settings-navigation {
  border-right: 1px solid rgba(var(--v-border-color), 0.12);
  background-color: var(--settings-nav-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.settings-sidebar {
  width: 240px;
  min-width: 240px;
  border-right: 1px solid rgba(var(--v-border-color), 0.12);
  background-color: var(--settings-nav-bg);
  transition: background-color var(--transition-speed) ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.theme-dark {
  background-color: var(--settings-nav-bg-dark) !important;
  color: var(--settings-nav-text-dark);
}

.theme-light {
  background-color: var(--settings-nav-bg-light) !important;
  color: var(--settings-nav-text-light);
}

.settings-content {
  background-color: var(--settings-content-bg);
  height: 100%;
  overflow-y: auto;
  transition: background-color var(--transition-speed) ease;
}

.nav-item {
  transition: all var(--transition-speed) ease;
}

.nav-item:hover {
  background-color: var(--nav-item-hover) !important;
}

:deep(.v-list-item--active) {
  background-color: var(--nav-item-active) !important;
  font-weight: 500;
}

:deep(.v-window) {
  height: 100%;
}

@media (max-width: 600px) {
  .settings-navigation {
    width: 80px !important;
  }
  
  .settings-content {
    padding: 8px;
  }
  
  :deep(.v-list-item-title) {
    font-size: 0.75rem;
  }
}
</style>