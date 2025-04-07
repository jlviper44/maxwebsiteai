<template>
  <div>
    <h1 class="text-h4 mb-4">Settings</h1>
    
    <v-card>
      <v-tabs v-model="activeTab" bg-color="primary">
        <v-tab value="account">Account</v-tab>
        <v-tab value="appearance">Appearance</v-tab>
        <v-tab value="notifications">Notifications</v-tab>
        <v-tab value="api">API Keys</v-tab>
      </v-tabs>
      
      <v-card-text>
        <v-window v-model="activeTab">
          <!-- Account Settings -->
          <v-window-item value="account">
            <v-form @submit.prevent="saveAccountSettings" class="mt-4">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="accountSettings.name"
                    label="Full Name"
                    variant="outlined"
                    required
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="accountSettings.email"
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    required
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-text-field
                    v-model="accountSettings.company"
                    label="Company/Organization"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-divider></v-divider>
                  <h3 class="text-h6 my-3">Change Password</h3>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="accountSettings.currentPassword"
                    label="Current Password"
                    type="password"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="accountSettings.newPassword"
                    label="New Password"
                    type="password"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-btn type="submit" color="primary" class="mr-4">Save Changes</v-btn>
                  <v-btn variant="outlined">Cancel</v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>
          
          <!-- Appearance Settings -->
          <v-window-item value="appearance">
            <v-form @submit.prevent="saveAppearanceSettings" class="mt-4">
              <v-row>
                <v-col cols="12">
                  <h3 class="text-h6 mb-3">Theme</h3>
                  <v-switch
                    v-model="appearanceSettings.darkMode"
                    label="Dark Mode"
                    color="primary"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12">
                  <h3 class="text-h6 mb-3">Layout</h3>
                  <v-radio-group v-model="appearanceSettings.density">
                    <v-radio label="Comfortable" value="comfortable"></v-radio>
                    <v-radio label="Compact" value="compact"></v-radio>
                  </v-radio-group>
                </v-col>
                
                <v-col cols="12">
                  <h3 class="text-h6 mb-3">Primary Color</h3>
                  <div class="d-flex flex-wrap">
                    <v-btn
                      v-for="color in availableColors"
                      :key="color.value"
                      class="ma-2"
                      :color="color.value"
                      variant="tonal"
                      @click="appearanceSettings.primaryColor = color.value"
                      :style="{ border: appearanceSettings.primaryColor === color.value ? '2px solid black' : 'none' }"
                    >
                      {{ color.name }}
                    </v-btn>
                  </div>
                </v-col>
                
                <v-col cols="12">
                  <v-btn type="submit" color="primary" class="mr-4">Save Changes</v-btn>
                  <v-btn variant="outlined">Reset to Default</v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>
          
          <!-- Notification Settings -->
          <v-window-item value="notifications">
            <v-form @submit.prevent="saveNotificationSettings" class="mt-4">
              <v-row>
                <v-col cols="12">
                  <h3 class="text-h6 mb-3">Email Notifications</h3>
                  <v-switch
                    v-model="notificationSettings.emailNewOrders"
                    label="New Orders"
                    color="primary"
                  ></v-switch>
                  <v-switch
                    v-model="notificationSettings.emailReports"
                    label="Weekly Reports"
                    color="primary"
                  ></v-switch>
                  <v-switch
                    v-model="notificationSettings.emailAlerts"
                    label="System Alerts"
                    color="primary"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12">
                  <h3 class="text-h6 mb-3">In-App Notifications</h3>
                  <v-switch
                    v-model="notificationSettings.appNewOrders"
                    label="New Orders"
                    color="primary"
                  ></v-switch>
                  <v-switch
                    v-model="notificationSettings.appMessages"
                    label="Messages"
                    color="primary"
                  ></v-switch>
                  <v-switch
                    v-model="notificationSettings.appAlerts"
                    label="System Alerts"
                    color="primary"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12">
                  <v-btn type="submit" color="primary" class="mr-4">Save Changes</v-btn>
                  <v-btn variant="outlined">Reset to Default</v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>
          
          <!-- API Keys -->
          <v-window-item value="api">
            <div class="mt-4">
              <v-alert type="info" variant="tonal">
                API keys provide access to your data. Keep them secret and never share them in client-side code.
              </v-alert>
              
              <h3 class="text-h6 mt-4 mb-3">Your API Keys</h3>
              
              <v-list>
                <v-list-item v-for="(key, index) in apiKeys" :key="index">
                  <v-list-item-title>{{ key.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Created: {{ key.created }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-btn
                      variant="text"
                      color="primary"
                      class="mr-2"
                      @click="showKey(key)"
                    >
                      View
                    </v-btn>
                    <v-btn
                      variant="text"
                      color="error"
                      @click="revokeKey(key)"
                    >
                      Revoke
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
              
              <v-btn
                color="primary"
                class="mt-4"
                prepend-icon="mdi-plus"
                @click="generateNewKey"
              >
                Generate New API Key
              </v-btn>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Active tab
const activeTab = ref('account')

// Account settings
const accountSettings = ref({
  name: 'John Doe',
  email: 'john.doe@example.com',
  company: 'ACME Inc.',
  currentPassword: '',
  newPassword: ''
})

// Appearance settings
const appearanceSettings = ref({
  darkMode: false,
  density: 'comfortable',
  primaryColor: 'primary'
})

const availableColors = [
  { name: 'Default', value: 'primary' },
  { name: 'Red', value: 'error' },
  { name: 'Green', value: 'success' },
  { name: 'Blue', value: 'info' },
  { name: 'Purple', value: 'purple' }
]

// Notification settings
const notificationSettings = ref({
  emailNewOrders: true,
  emailReports: true,
  emailAlerts: true,
  appNewOrders: true,
  appMessages: true,
  appAlerts: true
})

// API Keys
const apiKeys = ref([
  { 
    id: 1, 
    name: 'Production API Key', 
    key: 'af1c85d9e8b24a3f9b0e6c71d2a9c5b7',
    created: '2025-01-15' 
  },
  { 
    id: 2, 
    name: 'Development API Key', 
    key: '7b5c9a2d1c6e0b9f3a4b8e1c2d9a5c7b',
    created: '2025-03-22' 
  }
])

// Methods
const saveAccountSettings = () => {
  // In a real app, you would save these settings to your backend
  console.log('Saving account settings:', accountSettings.value)
  // Show success message
  alert('Account settings saved successfully!')
}

const saveAppearanceSettings = () => {
  // In a real app, you would save these settings to your backend
  console.log('Saving appearance settings:', appearanceSettings.value)
  alert('Appearance settings saved successfully!')
}

const saveNotificationSettings = () => {
  // In a real app, you would save these settings to your backend
  console.log('Saving notification settings:', notificationSettings.value)
  alert('Notification settings saved successfully!')
}

const showKey = (key) => {
  alert(`API Key: ${key.key}\n\nKeep this secure and do not share it.`)
}

const revokeKey = (key) => {
  if (confirm(`Are you sure you want to revoke the API key "${key.name}"? This action cannot be undone.`)) {
    // In a real app, you would call your API to revoke the key
    apiKeys.value = apiKeys.value.filter(k => k.id !== key.id)
    alert('API key revoked successfully')
  }
}

const generateNewKey = () => {
  const name = prompt('Enter a name for the new API key:')
  if (name) {
    // In a real app, you would call your API to generate a new key
    const newKey = {
      id: Date.now(),
      name: name,
      key: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      created: new Date().toISOString().split('T')[0]
    }
    apiKeys.value.push(newKey)
    alert(`New API key created: ${newKey.key}\n\nMake sure to copy this key now. You won't be able to see it again.`)
  }
}
</script>