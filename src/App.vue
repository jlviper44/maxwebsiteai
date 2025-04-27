<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      app
      permanent
    >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-h6">
            TikTok Campaign Admin
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-divider class="my-4"></v-divider>

      <v-list nav>
        <v-list-item v-for="item in menuItems" :key="item.title" :to="item.path" rounded="lg" class="mb-1">
          <template v-slot:prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
      
      <template v-slot:append>
        <v-list>
          <v-list-item>
            <v-switch
              v-model="darkMode"
              color="primary"
              hide-details
              @change="toggleDarkMode"
            >
              <template v-slot:prepend>
                <v-icon>{{ darkMode ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
              </template>
              <template v-slot:label>
                <span class="ml-2">{{ darkMode ? 'Dark' : 'Light' }} Mode</span>
              </template>
            </v-switch>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-app-bar app elevation="1">
      <v-app-bar-title>{{ currentRouteName }}</v-app-bar-title>
      <v-spacer></v-spacer>
      
      <v-btn icon>
        <v-icon>mdi-bell</v-icon>
      </v-btn>
      
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item>
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container fluid class="main-container">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router'
import { ref, computed, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'

const route = useRoute()
const theme = useTheme()
const drawer = ref(true)
const darkMode = ref(theme.global.current.value.dark)

// Navigation menu items
const menuItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', path: '/' },
  { title: 'Campaigns', icon: 'mdi-bullhorn', path: '/campaigns' },
  { title: 'Templates', icon: 'mdi-file-document-outline', path: '/templates' },
  { title: 'Shopify Stores', icon: 'mdi-shopping', path: '/shopify' },
  { title: 'Settings', icon: 'mdi-cog', path: '/settings' }
]

// Get current page name for title
const currentRouteName = computed(() => {
  if (route.name === 'campaigns') return 'Campaigns'
  if (route.name === 'campaign-create') return 'Create Campaign'
  if (route.name === 'campaign-edit') return 'Edit Campaign'
  if (route.name === 'campaign-stats') return 'Campaign Statistics'
  if (route.name === 'templates') return 'Templates'
  if (route.name === 'template-create') return 'Create Template'
  if (route.name === 'template-edit') return 'Edit Template'
  if (route.name === 'shopify') return 'Shopify Stores'
  if (route.name === 'shopify-add') return 'Add Shopify Store'
  if (route.name === 'shopify-edit') return 'Edit Shopify Store'
  if (route.name === 'settings') return 'Settings'
  return route.name?.toString().charAt(0).toUpperCase() + route.name?.toString().slice(1) || 'Dashboard'
})

// Toggle dark mode
function toggleDarkMode() {
  theme.global.name.value = darkMode.value ? 'dark' : 'light'
  
  // Store preference in localStorage
  localStorage.setItem('darkMode', darkMode.value ? 'true' : 'false')
  
  // Dispatch event for other components to respond to
  window.dispatchEvent(new CustomEvent('themeChange', { 
    detail: { darkMode: darkMode.value } 
  }))
}

// Listen for theme changes in other components
function handleThemeChange(event) {
  darkMode.value = event.detail.darkMode
}

// Listen for theme changes
onMounted(() => {
  window.addEventListener('themeChange', handleThemeChange)
  
  // Initialize from localStorage if available
  const storedTheme = localStorage.getItem('darkMode')
  if (storedTheme !== null) {
    darkMode.value = storedTheme === 'true'
    theme.global.name.value = darkMode.value ? 'dark' : 'light'
  }
})

// Watch for theme changes from Vuetify
watch(
  () => theme.global.current.value.dark,
  (isDark) => {
    if (darkMode.value !== isDark) {
      darkMode.value = isDark
    }
  }
)
</script>

<style>
/* Global styles */
.main-container {
  padding: 16px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.theme--dark .main-container {
  background-color: #121212;
}

/* Ensure content has proper spacing */
.v-navigation-drawer {
  top: 0 !important;
  padding-top: 10px;
}

/* Fix for Vuetify 3 container */
.v-container {
  width: 100%;
  padding: 16px;
  margin-right: auto;
  margin-left: auto;
}

/* Fix for Vuetify 3 navigation drawer */
.v-list-item__content {
  padding: 0 !important;
}
</style>