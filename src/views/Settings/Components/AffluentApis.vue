<template>
  <div>
    <v-alert type="info" variant="tonal">
      Manage your Affluent API configurations here. These credentials are used to connect with Affluent's affiliate tracking platform.
    </v-alert>
    
    <h3 class="text-h6 mt-4 mb-3">Your Affluent API Configurations</h3>
    
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>
    
    <v-list v-else-if="affluentApis.length > 0">
      <v-list-item v-for="(api, index) in affluentApis" :key="index">
        <v-list-item-title>{{ api.Name }}</v-list-item-title>
        <template v-slot:append>
          <v-btn
            variant="text"
            color="error"
            @click="deleteApi(api)"
          >
            Delete
          </v-btn>
        </template>
      </v-list-item>
    </v-list>
    
    <v-alert v-else type="warning" variant="tonal">
      No API configurations found. Add your first configuration below.
    </v-alert>
    
    <v-divider class="my-4"></v-divider>
    
    <h3 class="text-h6 mb-3">{{ isEditing ? 'Edit' : 'Add' }} API Configuration</h3>
    
    <v-form @submit.prevent="saveApiConfig">
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="apiConfig.Name"
            label="Configuration Name"
            variant="outlined"
            required
            :error-messages="validationErrors.Name"
          ></v-text-field>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-text-field
            v-model="apiConfig.AFFILIATE_ID"
            label="Affiliate ID"
            variant="outlined"
            required
            :error-messages="validationErrors.AFFILIATE_ID"
            type="password"
          ></v-text-field>
        </v-col>
        
        <v-col cols="12">
          <v-text-field
            v-model="apiConfig.API_KEY"
            label="API Key"
            variant="outlined"
            required
            :error-messages="validationErrors.API_KEY"
          ></v-text-field>
        </v-col>
        
        <v-col cols="12">
          <v-btn 
            type="submit" 
            color="primary" 
            class="mr-4"
            :loading="submitting"
            :disabled="submitting"
          >
            {{ isEditing ? 'Update' : 'Add' }} Configuration
          </v-btn>
          <v-btn 
            variant="outlined"
            @click="resetForm"
            :disabled="submitting"
          >
            Cancel
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
    
    <v-dialog v-model="dialog.show" max-width="500px">
      <v-card>
        <v-card-title>{{ dialog.title }}</v-card-title>
        <v-card-text>{{ dialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="dialog.show = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// State management
const affluentApis = ref([])
const loading = ref(false)
const submitting = ref(false)
const isEditing = ref(false)

// Form for adding/editing API configs
const apiConfig = ref({
  Name: '',
  API_KEY: '',
  AFFILIATE_ID: ''
})

const originalName = ref('')

// Validation errors
const validationErrors = ref({
  Name: '',
  API_KEY: '',
  AFFILIATE_ID: ''
})

// Dialog for messages
const dialog = ref({
  show: false,
  title: '',
  message: ''
})

// API URL base
const API_BASE_URL = '/api/sql'

// Fetch API configurations from the server
const fetchApiConfigurations = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/FluentAPIs`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      affluentApis.value = result.data || []
    } else {
      showMessage('Error', result.error || 'Failed to load API configurations')
    }
  } catch (error) {
    showMessage('Error', `Failed to load data: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// Save API configuration
const saveApiConfig = async () => {
  // Clear previous validation errors
  validationErrors.value = {
    Name: '',
    API_KEY: '',
    AFFILIATE_ID: ''
  }
  
  // Validate form
  let isValid = true
  
  if (!apiConfig.value.Name) {
    validationErrors.value.Name = 'Configuration name is required'
    isValid = false
  }
  
  if (!apiConfig.value.API_KEY) {
    validationErrors.value.API_KEY = 'API key is required'
    isValid = false
  }
  
  if (!apiConfig.value.AFFILIATE_ID) {
    validationErrors.value.AFFILIATE_ID = 'Affiliate ID is required'
    isValid = false
  }
  
  if (!isValid) return
  
  submitting.value = true
  try {
    let response
    
    if (isEditing.value) {
      // Update existing config using the original name as identifier
      response = await fetch(`${API_BASE_URL}/FluentAPIs/${originalName.value}?idColumn=Name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiConfig.value)
      })
    } else {
      // Add new config
      response = await fetch(`${API_BASE_URL}/FluentAPIs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiConfig.value)
      })
    }
    
    if (!response.ok) {
      throw new Error(`Failed to save data: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      showMessage('Success', isEditing.value 
        ? 'API configuration updated successfully.' 
        : 'API configuration added successfully.')
      
      // Refresh the configurations list
      await fetchApiConfigurations()
      
      // Reset form
      resetForm()
    } else {
      showMessage('Error', result.error || 'Failed to save API configuration')
    }
  } catch (error) {
    showMessage('Error', `Failed to save data: ${error.message}`)
  } finally {
    submitting.value = false
  }
}

// Delete API configuration
const deleteApi = async (api) => {
  if (confirm(`Are you sure you want to delete the "${api.Name}" configuration? This action cannot be undone.`)) {
    try {
      const response = await fetch(`${API_BASE_URL}/FluentAPIs/${api.Name}?idColumn=Name`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        showMessage('Success', 'API configuration deleted successfully.')
        await fetchApiConfigurations()
      } else {
        showMessage('Error', result.error || 'Failed to delete API configuration')
      }
    } catch (error) {
      showMessage('Error', `Failed to delete: ${error.message}`)
    }
  }
}

// Edit API configuration
const editApi = (api) => {
  apiConfig.value = { ...api }
  originalName.value = api.Name
  isEditing.value = true
}

// Reset form
const resetForm = () => {
  apiConfig.value = {
    Name: '',
    API_KEY: '',
    AFFILIATE_ID: ''
  }
  originalName.value = ''
  isEditing.value = false
  validationErrors.value = {
    Name: '',
    API_KEY: '',
    AFFILIATE_ID: ''
  }
}

// Show message in dialog
const showMessage = (title, message) => {
  dialog.value.title = title
  dialog.value.message = message
  dialog.value.show = true
}

// Initialize
onMounted(() => {
  fetchApiConfigurations()
})
</script>