<template>
  <div class="shopify-store-form">
    <v-card>
      <v-card-title>
        {{ isEdit ? 'Edit Shopify Store' : 'Add Shopify Store' }}
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
      
      <v-card-text v-if="loading">
        <div class="text-center py-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">{{ isEdit ? 'Loading store...' : 'Loading...' }}</p>
        </div>
      </v-card-text>
      
      <v-card-text v-else>
        <v-form ref="form" v-model="formValid" @submit.prevent="submitForm">
          <!-- Store Name -->
          <v-text-field
            v-model="formData.storeName"
            label="Store Name"
            :rules="[v => !!v || 'Store name is required']"
            required
            hint="A descriptive name for your store."
            persistent-hint
          ></v-text-field>
          
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
            class="mt-4"
          ></v-text-field>
          
          <!-- API Key -->
          <v-text-field
            v-model="formData.apiKey"
            label="API Key"
            :rules="[v => isEdit ? true : !!v || 'API key is required']"
            :required="!isEdit"
            :placeholder="isEdit ? 'Enter new API key to change' : ''"
            :hint="isEdit ? 'Leave blank to keep the current API key.' : 'The API key from your Shopify private app.'"
            persistent-hint
            class="mt-4"
          ></v-text-field>
          
          <!-- API Secret -->
          <v-text-field
            v-model="formData.apiSecret"
            label="API Secret"
            type="password"
            :rules="[v => isEdit ? true : !!v || 'API secret is required']"
            :required="!isEdit"
            :placeholder="isEdit ? 'Enter new API secret to change' : ''"
            :hint="isEdit ? 'Leave blank to keep the current API secret.' : 'The API secret from your Shopify private app.'"
            persistent-hint
            class="mt-4"
          ></v-text-field>
          
          <!-- Access Token -->
          <v-text-field
            v-model="formData.accessToken"
            label="Access Token"
            type="password"
            :rules="[v => isEdit ? true : !!v || 'Access token is required']"
            :required="!isEdit"
            :placeholder="isEdit ? 'Enter new access token to change' : ''"
            :hint="isEdit ? 'Leave blank to keep the current access token.' : 'The access token from your Shopify private app.'"
            persistent-hint
            class="mt-4"
          ></v-text-field>
          
          <!-- Store Active -->
          <v-switch
            v-model="formData.active"
            label="Store Active"
            color="primary"
            hint="When unchecked, this store will not be available for campaigns."
            persistent-hint
            class="mt-4"
          ></v-switch>
          
          <v-card variant="outlined" class="info-box mt-4 mb-4">
            <v-card-text>
              <strong>Note:</strong> You need to create a private app in your Shopify store with access to the following scopes:
              <ul>
                <li>read_products</li>
                <li>write_content</li>
              </ul>
            </v-card-text>
          </v-card>
          
          <!-- Submit Buttons -->
          <div class="d-flex mt-6">
            <v-btn
              color="primary"
              type="submit"
              :loading="submitting"
              :disabled="!formValid"
            >
              {{ isEdit ? 'Update Store' : 'Add Store' }}
            </v-btn>
            
            <v-btn
              variant="text"
              to="/shopify"
              class="ml-4"
            >
              Cancel
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
    
    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
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
import { fetchShopifyStore, addShopifyStore, updateShopifyStore } from '@/api/shopify';

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

<style scoped>
.shopify-store-form {
  padding: 16px;
}

.info-box {
  background-color: #f5f5f5;
}
</style>