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
        colors: {
          primary: '#3498db',
          secondary: '#2ecc71',
          accent: '#9c27b0',
          error: '#e74c3c',
          warning: '#f39c12',
          info: '#3498db',
          success: '#2ecc71',
        },
      },
      dark: {
        colors: {
          primary: '#3498db',
          secondary: '#2ecc71',
          accent: '#9c27b0',
          error: '#e74c3c',
          warning: '#f39c12',
          info: '#3498db',
          success: '#2ecc71',
        },
        dark: true,
      },
    },
  },
})

// Create and mount the app
const app = createApp(App)
app.use(router)
app.use(vuetify)
app.mount('#app')

// Fetch and apply initial theme settings
async function applyInitialTheme() {
  try {
    const response = await fetch('/api/dashboard')
    const data = await response.json()
    
    if (data.success && data.settings) {
      // Set Vuetify theme based on the settings
      const darkModeEnabled = data.settings.darkModeEnabled
      vuetify.theme.global.name.value = darkModeEnabled ? 'dark' : 'light'
    }
  } catch (error) {
    console.error('Error fetching initial theme settings:', error)
  }
}

// Apply initial theme
applyInitialTheme()