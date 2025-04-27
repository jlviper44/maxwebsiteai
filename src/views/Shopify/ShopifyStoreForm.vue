<template>
  <div class="shopify-store-form">
    <v-card class="form-card elevation-2 rounded-lg" variant="elevated">
      <v-card-title class="pb-2 d-flex align-center">
        <v-icon :icon="isEdit ? 'mdi-store-edit' : 'mdi-store-plus'" color="primary" class="mr-2"></v-icon>
        <span class="text-h6">{{ isEdit ? 'Edit Shopify Store' : 'Add Shopify Store' }}</span>
        <v-btn
          icon 
          color="primary" 
          variant="text" 
          class="ml-auto"
          to="/shopify"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text v-if="loading" class="pa-6">
        <div class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="mt-4 text-medium-emphasis">{{ isEdit ? 'Loading store...' : 'Loading...' }}</p>
        </div>
      </v-card-text>
      
      <v-card-text v-else class="pa-6">
        <v-form ref="form" v-model="formValid" @submit.prevent="submitForm">
          <v-row>
            <v-col cols="12">
              <!-- Store Name -->
              <v-text-field
                v-model="formData.storeName"
                label="Store Name"
                :rules="[v => !!v || 'Store name is required']"
                required
                hint="A descriptive name for your store."
                persistent-hint
                variant="outlined"
                prepend-inner-icon="mdi-store"
                placeholder="My Shopify Store"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <!-- Store URL -->
              <v-text-field
                v-model="formData.storeUrl"
                label="Store URL"
                type="url"
                :rules="[
                  v => !!v || 'Store URL is required',
                  v => /^https:\/\/.*\.myshopify\.com/.test(v) || 'Must be a valid Shopify URL (https://your-store.myshopify.com)'
                ]"
                required
                placeholder="https://your-store.myshopify.com"
                hint="The URL of your Shopify store."
                persistent-hint
                variant="outlined"
                prepend-inner-icon="mdi-web"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <!-- API Key -->
              <v-text-field
                v-model="formData.apiKey"
                label="API Key"
                :rules="[v => isEdit ? true : !!v || 'API key is required']"
                :required="!isEdit"
                :placeholder="isEdit ? 'Enter new API key to change' : ''"
                :hint="isEdit ? 'Leave blank to keep the current API key.' : 'The API key from your Shopify private app.'"
                persistent-hint
                variant="outlined"
                prepend-inner-icon="mdi-key"
                :type="showSecrets ? 'text' : 'password'" 
                :append-inner-icon="showSecrets ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showSecrets = !showSecrets"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <!-- API Secret -->
              <v-text-field
                v-model="formData.apiSecret"
                label="API Secret"
                :type="showSecrets ? 'text' : 'password'"
                :rules="[v => isEdit ? true : !!v || 'API secret is required']"
                :required="!isEdit"
                :placeholder="isEdit ? 'Enter new API secret to change' : ''"
                :hint="isEdit ? 'Leave blank to keep the current API secret.' : 'The API secret from your Shopify private app.'"
                persistent-hint
                variant="outlined"
                prepend-inner-icon="mdi-shield-key"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <!-- Access Token -->
              <v-text-field
                v-model="formData.accessToken"
                label="Access Token"
                :type="showSecrets ? 'text' : 'password'"
                :rules="[v => isEdit ? true : !!v || 'Access token is required']"
                :required="!isEdit"
                :placeholder="isEdit ? 'Enter new access token to change' : ''"
                :hint="isEdit ? 'Leave blank to keep the current access token.' : 'The access token from your Shopify private app.'"
                persistent-hint
                variant="outlined"
                prepend-inner-icon="mdi-key-chain"
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
            
            <v-col cols="12">
              <!-- Store Active -->
              <v-card variant="tonal" color="primary" class="pa-4 mb-4 rounded-lg store-active-card">
                <div class="d-flex align-center">
                  <v-switch
                    v-model="formData.active"
                    label="Store Active"
                    color="primary"
                    hide-details
                  ></v-switch>
                  <div class="ml-3">
                    <v-chip
                      :color="formData.active ? 'success' : 'error'"
                      size="small"
                      variant="elevated"
                    >
                      {{ formData.active ? 'Active' : 'Inactive' }}
                    </v-chip>
                    <div class="text-body-2 mt-1 store-active-hint">
                      When unchecked, this store will not be available for campaigns.
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
          
          <v-card variant="outlined" class="info-box mb-6 rounded-lg">
            <v-card-text class="pa-4">
              <div class="d-flex align-start">
                <v-icon icon="mdi-information" color="info" class="mr-3 mt-1"></v-icon>
                <div>
                  <span class="font-weight-medium">Note:</span> You need to create a private app in your Shopify store with access to the following scopes:
                  <ul class="mt-2 scope-list">
                    <li class="scope-item"><v-icon icon="mdi-book-open-variant" size="small" class="mr-1"></v-icon> read_products</li>
                    <li class="scope-item"><v-icon icon="mdi-file-document-edit" size="small" class="mr-1"></v-icon> write_content</li>
                  </ul>
                </div>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Submit Buttons -->
          <div class="d-flex mt-6 justify-center">
            <v-btn
              color="primary"
              type="submit"
              :loading="submitting"
              :disabled="!formValid"
              variant="elevated"
              size="large"
              :prepend-icon="isEdit ? 'mdi-content-save' : 'mdi-plus'"
              min-width="150"
            >
              {{ isEdit ? 'Update Store' : 'Add Store' }}
            </v-btn>
            
            <v-btn
              variant="tonal"
              to="/shopify"
              class="ml-4"
              size="large"
              prepend-icon="mdi-cancel"
              min-width="100"
            >
              Cancel
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
    
    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTheme } from 'vuetify'
import { fetchShopifyStore, addShopifyStore, updateShopifyStore } from '@/api/shopify';

// Initialize Vuetify theme
const theme = useTheme();

// Get current theme
const isDarkMode = computed(() => {
  return theme.global.current.value.dark;
});

const route = useRoute();
const router = useRouter();

// Determine if this is an edit or add form
const isEdit = computed(() => route.name === 'shopify-edit');
const storeId = computed(() => route.params.id);

// Form state
const form = ref(null);
const formValid = ref(false);
const formData = reactive({
  storeName: '',
  storeUrl: '',
  apiKey: '',
  apiSecret: '',
  accessToken: '',
  active: true
});

// UI state
const loading = ref(true);
const submitting = ref(false);
const showSecrets = ref(false);
const snackbar = ref({
  show: false,
  text: '',
  color: 'info'
});

// Initialize component
onMounted(async () => {
  if (isEdit.value) {
    await fetchStoreData();
  }
  
  loading.value = false;
});

// Fetch store for editing
async function fetchStoreData() {
  try {
    const response = await fetchShopifyStore(storeId.value);
    
    if (response.success && response.store) {
      const store = response.store;
      
      // Fill form data
      formData.storeName = store.name;
      formData.storeUrl = store.url;
      formData.active = store.active;
      
      // API credentials are not pre-filled for security
      formData.apiKey = '';
      formData.apiSecret = '';
      formData.accessToken = '';
    } else {
      showSnackbar('Failed to load store: ' + (response.error || 'Store not found'), 'error');
      router.push('/shopify');
    }
  } catch (error) {
    console.error('Error fetching Shopify store:', error);
    showSnackbar('Failed to load store', 'error');
    router.push('/shopify');
  }
}

// Submit form
async function submitForm() {
  if (!formValid.value) {
    showSnackbar('Please fill all required fields correctly', 'error');
    return;
  }
  
  submitting.value = true;
  
  try {
    // Prepare form data
    const storeData = {
      storeName: formData.storeName,
      storeUrl: formData.storeUrl,
      active: formData.active
    };
    
    // For create, all API credentials are required
    // For edit, they're optional (blank means keep current)
    if (!isEdit.value || formData.apiKey.trim() !== '') {
      storeData.apiKey = formData.apiKey;
    }
    
    if (!isEdit.value || formData.apiSecret.trim() !== '') {
      storeData.apiSecret = formData.apiSecret;
    }
    
    if (!isEdit.value || formData.accessToken.trim() !== '') {
      storeData.accessToken = formData.accessToken;
    }
    
    // For edit, add the store ID
    if (isEdit.value) {
      storeData.storeId = storeId.value;
      
      // Call update API
      const response = await updateShopifyStore(storeData);
      
      if (response.success) {
        showSnackbar('Shopify store updated successfully', 'success');
        router.push('/shopify');
      } else {
        showSnackbar('Failed to update store: ' + response.error, 'error');
      }
    } else {
      // Call create API
      const response = await addShopifyStore(storeData);
      
      if (response.success) {
        showSnackbar('Shopify store added successfully', 'success');
        router.push('/shopify');
      } else {
        showSnackbar('Failed to add store: ' + response.error, 'error');
      }
    }
  } catch (error) {
    console.error(`Error ${isEdit.value ? 'updating' : 'adding'} Shopify store:`, error);
    showSnackbar(`Failed to ${isEdit.value ? 'update' : 'add'} store`, 'error');
  } finally {
    submitting.value = false;
  }
}

// Show snackbar notification
function showSnackbar(text, color = 'info') {
  snackbar.value = {
    show: true,
    text,
    color
  };
}
</script>

<style>
:root {
  --form-card-bg: #ffffff;
  --store-active-card-bg: rgba(25, 118, 210, 0.08);
  --store-active-hint-color: #616161;
  --info-box-bg: #f5f5f5;
  --scope-item-color: #333333;
  --transition-speed: 0.3s;
}

[data-theme="dark"] {
  --form-card-bg: #1e1e1e;
  --store-active-card-bg: rgba(100, 181, 246, 0.08);
  --store-active-hint-color: #b0bec5;
  --info-box-bg: #2d2d2d;
  --scope-item-color: #e0e0e0;
}
</style>

<style scoped>
.shopify-store-form {
  padding: 16px;
}

.form-card {
  background-color: var(--form-card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.store-active-card {
  background-color: var(--store-active-card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.store-active-hint {
  color: var(--store-active-hint-color);
  transition: color var(--transition-speed) ease;
}

.info-box {
  background-color: var(--info-box-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.scope-list {
  padding-left: 16px;
  margin-top: 8px;
}

.scope-item {
  color: var(--scope-item-color);
  margin-bottom: 4px;
  transition: color var(--transition-speed) ease;
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .d-flex.mt-6 {
    flex-direction: column;
  }
  
  .d-flex.mt-6 .v-btn {
    width: 100%;
    margin-left: 0 !important;
    margin-top: 12px;
  }
}
</style>