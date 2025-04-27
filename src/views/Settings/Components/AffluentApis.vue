<template>
  <div>
    <v-alert type="info" variant="tonal" class="mb-6 info-alert rounded-lg elevation-1" border="start">
      <template v-slot:prepend>
        <v-icon icon="mdi-information" color="info" class="mr-2"></v-icon>
      </template>
      <div>
        <span class="font-weight-medium">Affluent API Management</span>
        <p class="text-body-2 mt-1">
          Manage your Affluent API configurations here. These credentials are used to connect with Affluent's affiliate tracking platform.
        </p>
      </div>
    </v-alert>
    
    <h3 class="text-h6 mb-4 section-title d-flex align-center">
      <v-icon icon="mdi-api" color="primary" class="mr-2"></v-icon>
      Your Affluent API Configurations
    </h3>
    
    <div v-if="loading" class="text-center my-8 loading-container">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
      <p class="mt-4 loading-text">Loading API configurations...</p>
    </div>
    
    <template v-else>
      <v-card variant="elevated" class="mb-6 api-list-card rounded-lg elevation-2" v-if="affluentApis.length > 0">
        <v-list class="rounded-lg pa-0">
          <v-list-subheader class="d-flex justify-space-between align-center px-4 py-2 list-header">
            <span class="font-weight-medium">API Configurations</span>
            <v-chip color="primary" size="small">{{ affluentApis.length }} configs</v-chip>
          </v-list-subheader>
          
          <v-divider></v-divider>
          
          <v-list-item 
            v-for="(api, index) in affluentApis" 
            :key="index"
            rounded="lg"
            class="api-list-item ma-2"
          >
            <template v-slot:prepend>
              <v-avatar color="primary" variant="tonal" class="mr-3">
                <v-icon color="primary">mdi-api</v-icon>
              </v-avatar>
            </template>
            
            <v-list-item-title class="api-name">{{ api.Name }}</v-list-item-title>
            
            <v-list-item-subtitle class="mt-1 api-details">
              <span class="text-caption mr-4">
                <v-icon icon="mdi-identifier" size="x-small" class="mr-1"></v-icon>
                Affiliate ID: {{ maskText(api.AFFILIATE_ID) }}
              </span>
              <span class="text-caption">
                <v-icon icon="mdi-key" size="x-small" class="mr-1"></v-icon>
                API Key: {{ maskText(api.API_KEY) }}
              </span>
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <div class="d-flex">
                <v-btn
                  variant="text"
                  color="primary"
                  icon
                  class="mr-2" 
                  @click="editApi(api)"
                >
                  <v-icon>mdi-pencil</v-icon>
                  <v-tooltip activator="parent" location="top">Edit</v-tooltip>
                </v-btn>
                <v-btn
                  variant="text"
                  color="error"
                  icon
                  @click="deleteApi(api)"
                >
                  <v-icon>mdi-delete</v-icon>
                  <v-tooltip activator="parent" location="top">Delete</v-tooltip>
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
      
      <div v-else class="text-center my-8 empty-state">
        <v-icon icon="mdi-api-off" size="64" class="mb-4 opacity-50"></v-icon>
        <p class="text-h6 mb-2">No API Configurations</p>
        <p class="text-body-2 mb-6">Add your first Affluent API configuration to get started.</p>
      </div>
    </template>
    
    <v-card variant="elevated" class="mb-6 form-card rounded-lg elevation-2">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon :icon="isEditing ? 'mdi-pencil' : 'mdi-plus-circle'" color="primary" class="mr-2"></v-icon>
        <span class="text-h6">{{ isEditing ? 'Edit' : 'Add' }} API Configuration</span>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="pa-4">
        <v-form @submit.prevent="saveApiConfig">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="apiConfig.Name"
                label="Configuration Name"
                variant="outlined"
                required
                :error-messages="validationErrors.Name"
                prepend-inner-icon="mdi-tag"
                placeholder="My Affluent API"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="apiConfig.AFFILIATE_ID"
                label="Affiliate ID"
                variant="outlined"
                required
                :error-messages="validationErrors.AFFILIATE_ID"
                :type="showSecrets ? 'text' : 'password'"
                :append-inner-icon="showSecrets ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showSecrets = !showSecrets"
                prepend-inner-icon="mdi-identifier"
                placeholder="Your affiliate ID"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="apiConfig.API_KEY"
                label="API Key"
                variant="outlined"
                required
                :error-messages="validationErrors.API_KEY"
                :type="showSecrets ? 'text' : 'password'"
                prepend-inner-icon="mdi-key"
                placeholder="Your API key"
              ></v-text-field>
              
              <div class="d-flex align-center mt-2">
                <v-checkbox
                  v-model="showSecrets"
                  label="Show sensitive information"
                  color="primary"
                  hide-details
                  density="comfortable"
                ></v-checkbox>
              </div>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn 
          variant="tonal"
          @click="resetForm"
          :disabled="submitting"
          prepend-icon="mdi-close"
        >
          Cancel
        </v-btn>
        <v-btn 
          color="primary" 
          variant="elevated"
          @click="saveApiConfig"
          :loading="submitting"
          :disabled="submitting"
          prepend-icon="mdi-content-save"
          class="ml-2"
        >
          {{ isEditing ? 'Update' : 'Add' }} Configuration
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="500px" :scrim="true">
      <v-card class="rounded-lg elevation-4 delete-dialog">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-alert-circle" color="error" class="mr-2"></v-icon>
          <span class="text-h6">Confirm Delete</span>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-4">
          <p>Are you sure you want to delete the "<strong>{{ deleteDialog.apiName }}</strong>" configuration?</p>
          <p class="text-caption error-text mt-2">This action cannot be undone.</p>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="tonal" @click="deleteDialog.show = false">Cancel</v-btn>
          <v-btn color="error" variant="elevated" @click="confirmDelete" :loading="deleting" class="ml-2">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Message Dialog -->
    <v-dialog v-model="messageDialog.show" max-width="500px" :scrim="true">
      <v-card class="rounded-lg elevation-4 message-dialog">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon 
            :icon="messageDialog.title === 'Success' ? 'mdi-check-circle' : 'mdi-alert-circle'" 
            :color="messageDialog.title === 'Success' ? 'success' : 'error'" 
            class="mr-2"
          ></v-icon>
          <span class="text-h6">{{ messageDialog.title }}</span>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-4">
          {{ messageDialog.message }}
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="elevated" @click="messageDialog.show = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'

// Initialize Vuetify theme
const theme = useTheme();

// Get current theme
const isDarkMode = computed(() => {
  return theme.global.current.value.dark;
});

// State management
const affluentApis = ref([]);
const loading = ref(false);
const submitting = ref(false);
const isEditing = ref(false);
const showSecrets = ref(false);
const deleting = ref(false);

// API config being edited
const apiConfig = ref({
  Name: '',
  API_KEY: '',
  AFFILIATE_ID: ''
});

const originalName = ref('');

// Validation errors
const validationErrors = ref({
  Name: '',
  API_KEY: '',
  AFFILIATE_ID: ''
});

// Delete confirmation dialog
const deleteDialog = ref({
  show: false,
  apiName: '',
  apiToDelete: null
});

// Message dialog
const messageDialog = ref({
  show: false,
  title: '',
  message: ''
});

// API URL base
const API_BASE_URL = '/api/sql';

// Helper function to mask sensitive text
const maskText = (text) => {
  if (!text) return '';
  if (text.length <= 8) return '•'.repeat(text.length);
  
  const visiblePart = text.slice(-4);
  const maskedPart = '•'.repeat(text.length - 4);
  return maskedPart + visiblePart;
};

// Fetch API configurations from the server
const fetchApiConfigurations = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/FluentAPIs`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      affluentApis.value = result.data || [];
    } else {
      showMessage('Error', result.error || 'Failed to load API configurations');
    }
  } catch (error) {
    showMessage('Error', `Failed to load data: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// Save API configuration
const saveApiConfig = async () => {
  // Clear previous validation errors
  validationErrors.value = {
    Name: '',
    API_KEY: '',
    AFFILIATE_ID: ''
  };
  
  // Validate form
  let isValid = true;
  
  if (!apiConfig.value.Name) {
    validationErrors.value.Name = 'Configuration name is required';
    isValid = false;
  }
  
  if (!apiConfig.value.API_KEY) {
    validationErrors.value.API_KEY = 'API key is required';
    isValid = false;
  }
  
  if (!apiConfig.value.AFFILIATE_ID) {
    validationErrors.value.AFFILIATE_ID = 'Affiliate ID is required';
    isValid = false;
  }
  
  if (!isValid) return;
  
  submitting.value = true;
  try {
    let response;
    
    if (isEditing.value) {
      // Update existing config using the original name as identifier
      response = await fetch(`${API_BASE_URL}/FluentAPIs/${originalName.value}?idColumn=Name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiConfig.value)
      });
    } else {
      // Add new config
      response = await fetch(`${API_BASE_URL}/FluentAPIs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiConfig.value)
      });
    }
    
    if (!response.ok) {
      throw new Error(`Failed to save data: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      showMessage('Success', isEditing.value 
        ? 'API configuration updated successfully.' 
        : 'API configuration added successfully.');
      
      // Refresh the configurations list
      await fetchApiConfigurations();
      
      // Reset form
      resetForm();
    } else {
      showMessage('Error', result.error || 'Failed to save API configuration');
    }
  } catch (error) {
    showMessage('Error', `Failed to save data: ${error.message}`);
  } finally {
    submitting.value = false;
  }
};

// Show delete confirmation dialog
const deleteApi = (api) => {
  deleteDialog.value.apiName = api.Name;
  deleteDialog.value.apiToDelete = api;
  deleteDialog.value.show = true;
};

// Confirm delete operation
const confirmDelete = async () => {
  deleting.value = true;
  try {
    const api = deleteDialog.value.apiToDelete;
    if (!api) return;
    
    const response = await fetch(`${API_BASE_URL}/FluentAPIs/${api.Name}?idColumn=Name`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      showMessage('Success', 'API configuration deleted successfully.');
      await fetchApiConfigurations();
    } else {
      showMessage('Error', result.error || 'Failed to delete API configuration');
    }
    
    // Close the dialog
    deleteDialog.value.show = false;
  } catch (error) {
    showMessage('Error', `Failed to delete: ${error.message}`);
  } finally {
    deleting.value = false;
  }
};

// Edit API configuration
const editApi = (api) => {
  apiConfig.value = { ...api };
  originalName.value = api.Name;
  isEditing.value = true;
};

// Reset form
const resetForm = () => {
  apiConfig.value = {
    Name: '',
    API_KEY: '',
    AFFILIATE_ID: ''
  };
  originalName.value = '';
  isEditing.value = false;
  validationErrors.value = {
    Name: '',
    API_KEY: '',
    AFFILIATE_ID: ''
  };
};

// Show message in dialog
const showMessage = (title, message) => {
  messageDialog.value.title = title;
  messageDialog.value.message = message;
  messageDialog.value.show = true;
};

// Initialize
onMounted(() => {
  fetchApiConfigurations();
});
</script>

<style>
:root {
  --info-alert-bg: #f0f7ff;
  --section-title-color: #333333;
  --api-list-card-bg: #ffffff;
  --form-card-bg: #ffffff;
  --dialog-card-bg: #ffffff;
  --api-list-item-hover: rgba(25, 118, 210, 0.04);
  --api-name-color: #333333;
  --api-details-color: #757575;
  --list-header-bg: #f5f7fa;
  --empty-state-color: #757575;
  --loading-text-color: #757575;
  --error-text-color: #e57373;
  --transition-speed: 0.3s;
}

[data-theme="dark"] {
  --info-alert-bg: rgba(25, 118, 210, 0.1);
  --section-title-color: #e0e0e0;
  --api-list-card-bg: #1e1e1e;
  --form-card-bg: #1e1e1e;
  --dialog-card-bg: #1e1e1e;
  --api-list-item-hover: rgba(100, 181, 246, 0.08);
  --api-name-color: #e0e0e0;
  --api-details-color: #b0bec5;
  --list-header-bg: #2d2d2d;
  --empty-state-color: #b0bec5;
  --loading-text-color: #b0bec5;
  --error-text-color: #ef9a9a;
}
</style>

<style scoped>
.info-alert {
  background-color: var(--info-alert-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.section-title {
  color: var(--section-title-color);
  transition: color var(--transition-speed) ease;
}

.api-list-card {
  background-color: var(--api-list-card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.form-card {
  background-color: var(--form-card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.delete-dialog, .message-dialog {
  background-color: var(--dialog-card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.api-list-item {
  transition: background-color var(--transition-speed) ease;
}

.api-list-item:hover {
  background-color: var(--api-list-item-hover) !important;
}

.api-name {
  color: var(--api-name-color);
  transition: color var(--transition-speed) ease;
}

.api-details {
  color: var(--api-details-color) !important;
  transition: color var(--transition-speed) ease;
}

.list-header {
  background-color: var(--list-header-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.empty-state {
  color: var(--empty-state-color);
  transition: color var(--transition-speed) ease;
}

.loading-container {
  min-height: 200px;
}

.loading-text {
  color: var(--loading-text-color);
  transition: color var(--transition-speed) ease;
}

.error-text {
  color: var(--error-text-color);
  transition: color var(--transition-speed) ease;
}
</style>