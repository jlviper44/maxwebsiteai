<template>
  <div class="shopify-stores-view">
    <div class="header-actions mb-4">
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus"
        to="/shopify/add"
        variant="elevated"
        class="add-btn"
      >
        Add Shopify Store
      </v-btn>
    </div>
    
    <v-card class="stores-card mb-4 elevation-2 rounded-lg" variant="elevated">
      <v-card-title class="pb-2 d-flex align-center">
        <v-icon icon="mdi-shopping" color="primary" class="mr-2"></v-icon>
        <span class="text-h6">Your Shopify Stores</span>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="pa-0">
        <div v-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="mt-4 text-medium-emphasis">Loading Shopify stores...</p>
        </div>
        
        <div v-else-if="stores.length === 0" class="empty-state py-8">
          <v-icon icon="mdi-store-off" size="64" class="mb-4 opacity-50"></v-icon>
          <p class="text-h6 mb-2">No Shopify Stores</p>
          <p class="text-body-2 mb-6">Add your first store to get started.</p>
          <v-btn 
            color="primary" 
            prepend-icon="mdi-plus"
            to="/shopify/add"
            variant="elevated"
          >
            Add Shopify Store
          </v-btn>
        </div>
        
        <v-table v-else class="stores-table">
          <thead>
            <tr>
              <th class="text-left">Store Name</th>
              <th class="text-left">URL</th>
              <th class="text-left">Status</th>
              <th class="text-center">Pages</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="store in stores" :key="store.id" class="store-row">
              <td>
                <div class="d-flex align-center">
                  <v-avatar color="primary" variant="tonal" size="32" class="mr-2">
                    <v-icon icon="mdi-shopping" size="small"></v-icon>
                  </v-avatar>
                  <span class="font-weight-medium store-name">{{ store.name }}</span>
                </div>
              </td>
              <td class="store-url">
                <v-chip size="small" color="secondary" variant="flat" class="url-chip">
                  {{ store.url }}
                </v-chip>
              </td>
              <td>
                <v-chip
                  :color="store.active ? 'success' : 'error'"
                  size="small"
                  variant="elevated"
                >
                  {{ store.active ? 'Active' : 'Inactive' }}
                </v-chip>
              </td>
              <td class="text-center">
                <v-chip color="primary" size="small" variant="outlined">
                  {{ store.pageCount || 0 }}
                </v-chip>
              </td>
              <td>
                <div class="d-flex justify-end gap-2">
                  <v-btn 
                    size="small" 
                    color="primary" 
                    variant="tonal" 
                    :to="`/shopify/edit/${store.id}`"
                    icon
                  >
                    <v-icon>mdi-pencil</v-icon>
                    <v-tooltip activator="parent" location="top">Edit</v-tooltip>
                  </v-btn>
                  <v-btn 
                    size="small" 
                    color="info" 
                    variant="tonal" 
                    @click="testStore(store.id)"
                    :loading="testingId === store.id"
                    icon
                  >
                    <v-icon>mdi-connection</v-icon>
                    <v-tooltip activator="parent" location="top">Test Connection</v-tooltip>
                  </v-btn>
                  <v-btn 
                    size="small" 
                    color="error" 
                    variant="tonal" 
                    @click="confirmDelete(store)"
                    icon
                  >
                    <v-icon>mdi-delete</v-icon>
                    <v-tooltip activator="parent" location="top">Delete</v-tooltip>
                  </v-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
    
    <v-card class="info-alert elevation-1 rounded-lg" variant="tonal">
      <v-card-text class="d-flex align-center pa-4">
        <v-icon icon="mdi-information" color="info" class="mr-3" size="small"></v-icon>
        <div>
          <span class="font-weight-medium">Note:</span> 
          Each campaign will be assigned to a specific Shopify store where a TikTok landing page will be created.
          The system will automatically create pages that detect and route TikTok traffic to your affiliate offers.
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Test Results Dialog -->
    <v-dialog v-model="testResultDialog" max-width="600px" :scrim="true">
      <v-card class="test-dialog elevation-4 rounded-lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-connection" color="primary" class="mr-2"></v-icon>
          <span class="text-h6">Shopify Store Test Results</span>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-4">
          <div v-if="testLoading" class="text-center py-6">
            <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
            <p class="mt-4 text-medium-emphasis">Testing store connection...</p>
          </div>
          
          <div v-else-if="testError">
            <v-alert
              type="error"
              title="Connection Failed"
              variant="tonal"
              border="start"
              class="mb-0"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-close-circle" color="error"></v-icon>
              </template>
              {{ testError }}
            </v-alert>
          </div>
          
          <div v-else-if="testResults">
            <v-alert
              type="success"
              title="Connection Successful"
              variant="tonal"
              border="start"
              class="mb-4"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-check-circle" color="success"></v-icon>
              </template>
              Successfully connected to the Shopify store.
            </v-alert>
            
            <div class="detail-list">
              <v-card variant="outlined" class="mb-2 detail-card">
                <div class="d-flex detail-item px-4 py-3">
                  <div class="detail-label">Store Name</div>
                  <div class="detail-value">{{ testResults.shop.name }}</div>
                </div>
              </v-card>
              
              <v-card variant="outlined" class="mb-2 detail-card">
                <div class="d-flex detail-item px-4 py-3">
                  <div class="detail-label">Store URL</div>
                  <div class="detail-value">
                    <v-chip color="secondary" size="small" variant="flat" class="url-chip">
                      {{ testResults.store.url }}
                    </v-chip>
                  </div>
                </div>
              </v-card>
              
              <v-card variant="outlined" class="mb-2 detail-card">
                <div class="d-flex detail-item px-4 py-3">
                  <div class="detail-label">Shop ID</div>
                  <div class="detail-value font-mono">{{ testResults.shop.id }}</div>
                </div>
              </v-card>
              
              <v-card variant="outlined" class="mb-2 detail-card">
                <div class="d-flex detail-item px-4 py-3">
                  <div class="detail-label">Shop Plan</div>
                  <div class="detail-value">
                    <v-chip color="primary" size="small">{{ testResults.shop.plan_name }}</v-chip>
                  </div>
                </div>
              </v-card>
              
              <v-card variant="outlined" class="detail-card">
                <div class="d-flex detail-item px-4 py-3">
                  <div class="detail-label">Shop Country</div>
                  <div class="detail-value">{{ testResults.shop.country_name }}</div>
                </div>
              </v-card>
            </div>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="elevated" @click="testResultDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px" :scrim="true">
      <v-card class="delete-dialog elevation-4 rounded-lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-alert-circle" color="error" class="mr-2"></v-icon>
          <span class="text-h6">Delete Shopify Store</span>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-4">
          <div v-if="checkingUsage" class="text-center py-4">
            <v-progress-circular indeterminate size="32" color="primary" class="mb-2"></v-progress-circular>
            <p class="text-medium-emphasis">Checking if this store is in use...</p>
          </div>
          
          <div v-else-if="usedByCampaigns.length > 0" class="error-message">
            <v-alert
              type="warning"
              variant="tonal"
              border="start"
              class="mb-0"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-alert" color="warning"></v-icon>
              </template>
              <span class="font-weight-medium">This store cannot be deleted</span>
              <p class="mt-2">This store is used by the following campaigns:</p>
              <v-list dense class="warning-list">
                <v-list-item v-for="campaign in usedByCampaigns" :key="campaign.id" class="px-0 py-1">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-bullhorn" size="small" color="warning"></v-icon>
                  </template>
                  <v-list-item-title>{{ campaign.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
              <p class="mt-2">Please reassign these campaigns to a different store first.</p>
            </v-alert>
          </div>
          
          <div v-else>
            <p>Are you sure you want to delete the Shopify store <strong>{{ storeToDelete?.name }}</strong>?</p>
            <p class="error-text mt-2">This action cannot be undone.</p>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="tonal" @click="cancelDelete">Cancel</v-btn>
          <v-btn 
            color="error" 
            variant="elevated" 
            @click="deleteStore" 
            :loading="deleting"
            :disabled="usedByCampaigns.length > 0 || checkingUsage"
            class="ml-2"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
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
import { ref, onMounted, computed } from 'vue';
import { useTheme } from 'vuetify'
import { 
  fetchShopifyStores, 
  testShopifyStore, 
  checkShopifyStoreUsage, 
  deleteShopifyStore 
} from '@/api/shopify';

// Initialize Vuetify theme
const theme = useTheme();

// Get current theme
const isDarkMode = computed(() => {
  return theme.global.current.value.dark;
});

const stores = ref([]);
const loading = ref(true);
const testingId = ref(null);

// Test results
const testResultDialog = ref(false);
const testLoading = ref(false);
const testResults = ref(null);
const testError = ref(null);

// Delete dialog
const deleteDialog = ref(false);
const storeToDelete = ref(null);
const deleting = ref(false);
const checkingUsage = ref(false);
const usedByCampaigns = ref([]);

const snackbar = ref({
  show: false,
  text: '',
  color: 'info'
});

// Fetch stores when component mounts
onMounted(async () => {
  await fetchStoresList();
});

// Fetch all Shopify stores
async function fetchStoresList() {
  loading.value = true;
  try {
    const response = await fetchShopifyStores();
    
    if (response.success) {
      stores.value = response.stores;
    } else {
      showSnackbar('Failed to load stores: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('Error fetching Shopify stores:', error);
    showSnackbar('Failed to load stores', 'error');
  } finally {
    loading.value = false;
  }
}

// Test Shopify store connection
async function testStore(storeId) {
  testingId.value = storeId;
  testLoading.value = true;
  testResults.value = null;
  testError.value = null;
  testResultDialog.value = true;
  
  try {
    const response = await testShopifyStore(storeId);
    
    if (response.success) {
      testResults.value = response;
    } else {
      testError.value = response.error;
    }
  } catch (error) {
    console.error('Error testing Shopify store:', error);
    testError.value = 'Failed to test store connection';
  } finally {
    testingId.value = null;
    testLoading.value = false;
  }
}

// Confirm store deletion
async function confirmDelete(store) {
  storeToDelete.value = store;
  usedByCampaigns.value = [];
  deleteDialog.value = true;
  
  // Check if store is used by any campaigns
  checkingUsage.value = true;
  try {
    const response = await checkShopifyStoreUsage(store.id);
    
    if (response.success && response.usedBy) {
      usedByCampaigns.value = response.usedBy;
    }
  } catch (error) {
    console.error('Error checking store usage:', error);
    showSnackbar('Failed to check store usage', 'error');
  } finally {
    checkingUsage.value = false;
  }
}

// Cancel delete operation
function cancelDelete() {
  deleteDialog.value = false;
  storeToDelete.value = null;
  usedByCampaigns.value = [];
}

// Delete store
async function deleteStore() {
  if (!storeToDelete.value) return;
  
  deleting.value = true;
  try {
    const response = await deleteShopifyStore(storeToDelete.value.id);
    
    if (response.success) {
      showSnackbar('Shopify store deleted successfully', 'success');
      await fetchStoresList();
      deleteDialog.value = false;
    } else {
      showSnackbar('Failed to delete store: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('Error deleting Shopify store:', error);
    showSnackbar('Failed to delete store', 'error');
  } finally {
    deleting.value = false;
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
  --card-bg: #ffffff;
  --table-header-bg: #f5f7fa;
  --table-row-hover: rgba(25, 118, 210, 0.04);
  --empty-state-color: #757575;
  --info-alert-bg: #e3f2fd;
  --test-dialog-bg: #ffffff;
  --delete-dialog-bg: #ffffff;
  --detail-card-bg: #f5f7fa;
  --detail-label-color: #616161;
  --detail-value-color: #333333;
  --store-name-color: #333333;
  --store-url-color: #616161;
  --error-text-color: #e57373;
  --warning-list-bg: rgba(255, 167, 38, 0.08);
  --font-mono-color: #333333;
  --transition-speed: 0.3s;
}

[data-theme="dark"] {
  --card-bg: #1e1e1e;
  --table-header-bg: #2d2d2d;
  --table-row-hover: rgba(100, 181, 246, 0.08);
  --empty-state-color: #b0bec5;
  --info-alert-bg: rgba(25, 118, 210, 0.1);
  --test-dialog-bg: #1e1e1e;
  --delete-dialog-bg: #1e1e1e;
  --detail-card-bg: #2d2d2d;
  --detail-label-color: #b0bec5;
  --detail-value-color: #e0e0e0;
  --store-name-color: #e0e0e0;
  --store-url-color: #b0bec5;
  --error-text-color: #ef9a9a;
  --warning-list-bg: rgba(255, 167, 38, 0.05);
  --font-mono-color: #e0e0e0;
}
</style>

<style scoped>
.shopify-stores-view {
  padding: 16px;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
}

.add-btn {
  transition: all var(--transition-speed) ease;
}

.add-btn:hover {
  transform: translateY(-2px);
}

.stores-card {
  background-color: var(--card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

:deep(.v-data-table) {
  background-color: var(--card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

:deep(.v-data-table-header) {
  background-color: var(--table-header-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

:deep(.v-data-table__tr:hover) {
  background-color: var(--table-row-hover) !important;
}

.empty-state {
  text-align: center;
  color: var(--empty-state-color);
  transition: color var(--transition-speed) ease;
}

.info-alert {
  background-color: var(--info-alert-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.test-dialog, .delete-dialog {
  background-color: var(--test-dialog-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.detail-card {
  background-color: var(--detail-card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-label {
  flex: 0 0 140px;
  font-weight: 600;
  color: var(--detail-label-color);
  transition: color var(--transition-speed) ease;
}

.detail-value {
  flex: 1;
  color: var(--detail-value-color);
  transition: color var(--transition-speed) ease;
}

.store-name {
  color: var(--store-name-color);
  transition: color var(--transition-speed) ease;
}

.store-url {
  color: var(--store-url-color);
  transition: color var(--transition-speed) ease;
}

.error-text {
  color: var(--error-text-color);
  transition: color var(--transition-speed) ease;
}

.warning-list {
  background-color: var(--warning-list-bg) !important;
  border-radius: 4px;
  margin: 8px 0;
  transition: background-color var(--transition-speed) ease;
}

.font-mono {
  font-family: monospace;
  color: var(--font-mono-color);
  transition: color var(--transition-speed) ease;
}

@media (max-width: 768px) {
  .header-actions {
    justify-content: center;
  }
  
  .add-btn {
    width: 100%;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .detail-label {
    margin-bottom: 4px;
  }
}
</style>