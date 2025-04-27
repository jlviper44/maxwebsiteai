import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

// Create Vuetify instance with theme support
const vuetify = createVuetify({
  components: {
    ...components,
  },
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#1976d2',
          secondary: '#2ecc71',
          accent: '#9c27b0',
          error: '#e74c3c',
          warning: '#f39c12',
          info: '#3498db',
          success: '#2ecc71',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#1976d2',
          secondary: '#2ecc71',
          accent: '#9c27b0',
          error: '#e74c3c',
          warning: '#f39c12',
          info: '#3498db',
          success: '#2ecc71',
        },
      },
    },
  },
})

// Create and mount the app
const app = createApp(App)
app.use(router)
app.use(vuetify)

// Add global error handler for API requests
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err, info);
}

// Listen for theme changes
window.addEventListener('themeChange', (event) => {
  const darkMode = event.detail.darkMode;
  try {
    vuetify.theme.global.name.value = darkMode ? 'dark' : 'light';
  } catch (error) {
    console.warn('Error updating theme:', error);
  }
});

// Check local storage for theme preference on startup
const initializeTheme = () => {
  try {
    const storedTheme = localStorage.getItem('darkMode');
    if (storedTheme === 'true') {
      vuetify.theme.global.name.value = 'dark';
    }
  } catch (error) {
    console.warn('Error initializing theme:', error);
  }
};

// Fetch initial settings from API
const fetchInitialSettings = async () => {
  try {
    const response = await fetch('/api/dashboard');
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.settings) {
        // Set Vuetify theme based on the server settings
        const darkModeEnabled = data.settings.darkModeEnabled;
        vuetify.theme.global.name.value = darkModeEnabled ? 'dark' : 'light';
        
        // Store in localStorage for persistence
        localStorage.setItem('darkMode', darkModeEnabled ? 'true' : 'false');
      }
    }
  } catch (error) {
    console.warn('Error fetching initial settings:', error);
    // Fall back to localStorage if API fails
    initializeTheme();
  }
};

// Initialize theme
initializeTheme();

// Try to fetch settings from API (but don't block app mounting)
fetchInitialSettings();

// Mount the app
app.mount('#app')