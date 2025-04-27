<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      app
      permanent
      :width="260"
      elevation="2"
      rounded="lg"
      class="navigation-drawer"
    >
      <div class="pa-4">
        <div class="d-flex align-center">
          <v-icon icon="mdi-music-note" size="large" color="primary" class="me-3"></v-icon>
          <div class="app-title text-h6 font-weight-bold text-primary">
            TikTok Campaign Admin
          </div>
        </div>
      </div>

      <v-divider class="my-3"></v-divider>

      <v-list nav class="px-2">
        <v-list-item 
          v-for="item in menuItems" 
          :key="item.title" 
          :to="item.path" 
          :value="item.title"
          rounded="lg" 
          class="mb-2"
          :active-color="isActiveRoute(item.path) ? 'primary' : undefined"
          :active-class="isActiveRoute(item.path) ? 'active-nav-item' : ''"
        >
          <template v-slot:prepend>
            <v-icon :icon="item.icon" :color="isActiveRoute(item.path) ? 'primary' : undefined"></v-icon>
          </template>
          <v-list-item-title class="nav-item-text">{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
      
      <template v-slot:append>
        <v-divider class="mb-3"></v-divider>
        <div class="px-4 pb-4">
          <v-card variant="flat" class="theme-toggle rounded-lg pa-2" :class="{'theme-toggle-dark': darkMode}">
            <v-switch
              v-model="darkMode"
              color="primary"
              hide-details
              density="compact"
              @change="toggleDarkMode"
            >
              <template v-slot:prepend>
                <v-icon :icon="darkMode ? 'mdi-weather-night' : 'mdi-weather-sunny'" 
                       :color="darkMode ? 'primary' : 'warning'"></v-icon>
              </template>
              <template v-slot:label>
                <span class="ml-2">{{ darkMode ? 'Dark' : 'Light' }} Mode</span>
              </template>
            </v-switch>
          </v-card>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar 
      app 
      elevation="1" 
      class="app-bar"
      height="64"
    >
      <v-app-bar-title class="text-capitalize font-weight-medium">
        {{ currentRouteName }}
      </v-app-bar-title>
      
      <v-spacer></v-spacer>
      
      <v-badge
        color="error"
        content="2"
        dot
        location="bottom end"
        offset-x="3"
        offset-y="3"
      >
        <v-btn icon class="mr-2">
          <v-icon>mdi-bell</v-icon>
        </v-btn>
      </v-badge>
      
      <v-menu transition="slide-y-transition">
        <template v-slot:activator="{ props }">
          <v-btn 
            class="ml-2 user-menu-btn" 
            variant="tonal" 
            v-bind="props"
          >
            <v-avatar size="32" color="primary" class="mr-2">
              <v-icon icon="mdi-account" color="white"></v-icon>
            </v-avatar>
            <span class="d-none d-sm-inline">Admin</span>
            <v-icon icon="mdi-chevron-down" size="small" class="ml-1"></v-icon>
          </v-btn>
        </template>
        <v-list class="pa-2" width="200" rounded="lg" elevation="2">
          <v-list-item link rounded="lg" prepend-icon="mdi-account-outline">
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item>
          <v-list-item link rounded="lg" prepend-icon="mdi-cog-outline">
            <v-list-item-title>Account Settings</v-list-item-title>
          </v-list-item>
          <v-divider class="my-2"></v-divider>
          <v-list-item link rounded="lg" prepend-icon="mdi-logout" color="error">
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container fluid class="main-container pa-4">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { RouterView, useRoute, useRouter } from 'vue-router'
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useTheme } from 'vuetify'
import { useDisplay } from 'vuetify'

const route = useRoute()
const router = useRouter()
const theme = useTheme()
const { mobile } = useDisplay()
const drawer = ref(true)
const darkMode = ref(theme.global.current.value.dark)
const isMobile = computed(() => mobile.value)

// Navigation menu items
const menuItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', path: '/' },
  { title: 'Metrics', icon: 'mdi-chart-bar', path: '/metrics' },
  { title: 'Campaigns', icon: 'mdi-bullhorn', path: '/campaigns' },
  { title: 'Templates', icon: 'mdi-file-document-outline', path: '/templates' },
  { title: 'Shopify Stores', icon: 'mdi-shopping', path: '/shopify' },
  { title: 'Settings', icon: 'mdi-cog', path: '/settings' }
]

// Check if route is active
function isActiveRoute(path) {
  if (path === '/' && route.path === '/') return true
  if (path !== '/' && route.path.startsWith(path)) return true
  return false
}

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

// Initialize and cleanup
onMounted(() => {
  // Add event listener for theme changes
  window.addEventListener('themeChange', handleThemeChange)
  
  // Initialize from localStorage if available
  const storedTheme = localStorage.getItem('darkMode')
  if (storedTheme !== null) {
    darkMode.value = storedTheme === 'true'
    theme.global.name.value = darkMode.value ? 'dark' : 'light'
  }
  
  // Always keep the drawer visible regardless of screen size
  drawer.value = true
})

onBeforeUnmount(() => {
  // Remove event listener to prevent memory leaks
  window.removeEventListener('themeChange', handleThemeChange)
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

// Always keep drawer visible regardless of screen size
watch(
  () => mobile.value,
  (isMobileView) => {
    // Always keep drawer visible
    drawer.value = true
  }
)
</script>

<style>
/* Global styles */
:root {
  --nav-bg: #ffffff;
  --main-bg: #f5f7fa;
  --card-bg: #ffffff;
  --active-nav-bg: rgba(25, 118, 210, 0.1);
  --theme-toggle-bg: #f0f5ff;
  --transition-speed: 0.3s;
}

[data-theme="dark"] {
  --nav-bg: #1e1e1e;
  --main-bg: #121212;
  --card-bg: #1e1e1e;
  --active-nav-bg: rgba(100, 181, 246, 0.15);
  --theme-toggle-bg: rgba(25, 118, 210, 0.2);
}

/* Transition animation for route changes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Main container styles */
.main-container {
  background-color: var(--main-bg);
  min-height: calc(100vh - 64px);
  transition: background-color var(--transition-speed) ease;
  border-radius: 0;
}

/* Navigation drawer styles */
.navigation-drawer {
  background-color: var(--nav-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 700;
  transition: color var(--transition-speed) ease;
}

.active-nav-item {
  background-color: var(--active-nav-bg) !important;
  font-weight: 600;
}

.nav-item-text {
  font-size: 0.9375rem;
  transition: color var(--transition-speed) ease;
}

/* Theme toggle styles */
.theme-toggle {
  background-color: var(--theme-toggle-bg);
  transition: background-color var(--transition-speed) ease;
}

.theme-toggle-dark {
  background-color: var(--active-nav-bg);
}

/* App bar styles */
.app-bar {
  background-color: var(--nav-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

/* User menu button */
.user-menu-btn {
  min-width: auto;
  padding: 0 12px;
}

/* Ensure content has proper spacing */
.v-navigation-drawer {
  top: 0 !important;
  padding-top: 0;
}

@media (max-width: 600px) {
  .main-container {
    padding: 12px !important;
  }
}
</style>