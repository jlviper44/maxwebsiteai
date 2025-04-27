<template>
  <div class="shopify-stores-view">
    <div class="header-actions">
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus"
        to="/shopify/add"
      >
        Add Shopify Store
      </v-btn>
    </div>
    
    <v-card class="mt-4">
      <v-card-title>Your Shopify Stores</v-card-title>
      <v-card-text>
        <div v-if="loading" class="text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p>Loading Shopify stores...</p>
        </div>
        
        <div v-else-if="stores.length === 0" class="empty-state">
          <p>No Shopify stores found. Add your first store to get started.</p>
        </div>
        
        <v-table v-else>
          <thead>
            <tr>
              <th>Store Name</th>
              <th>URL</th>
              <th>Status</th>
              <th>Pages</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="store in stores" :key="store.id">
              <td>{{ store.name }}</td>
              <td>{{ store.url }}</td>
              <td>
                <v-chip
                  :color="store.active ? 'success' : 'error'"
                  size="small"
                >
                  {{ store.active ? 'Active' : 'Inactive' }}
                </v-chip>
              </td>
              <td>{{ store.pageCount || 0 }}</td>
              <td>
                <div class="d-flex gap-2">
                  <v-btn 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                    :to="`/shopify/edit/${store.id}`"
                  >
                    Edit
                  </v-btn>
                  <v-btn 
                    size="small" 
                    color="info" 
                    variant="outlined" 
                    @click="testStore(store.id)"
                    :loading="testingId === store.id"
                  >
                    Test
                  </v-btn>
                  <v-btn 
                    size="small" 
                    color="error" 
                    variant="outlined" 
                    @click="confirmDelete(store)"
                  >
                    Delete
                  </v-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
    
    <v-card class="mt-4 info-alert">
      <v-card-text>
        <strong>Note:</strong> Each campaign will be assigned to a specific Shopify store where a TikTok landing page will be created.
        The system will automatically create pages that detect and route TikTok traffic to your affiliate offers.
      </v-card-text>
    </v-card>
    
    <!-- Test Results Dialog -->
    <v-dialog v-model="testResultDialog" max-width="600px">
      <v-card>
        <v-card-title>Shopify Store Test Results</v-card-title>
        <v-card-text v-if="testLoading">
          <div class="text-center py-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p>Testing store connection...</p>
          </div>
        </v-card-text>
        
        <v-card-text v-else-if="testError">
          <v-alert
            type="error"
            title="Connection Failed"
            variant="tonal"
          >
            {{ testError }}
          </v-alert>
        </v-card-text>
        
        <v-card-text v-else-if="testResults">
          <v-alert
            type="success"
            title="Connection Successful"
            variant="tonal"
            class="mb-4"
          >
            Successfully connected to the Shopify store.
          </v-alert>
          
          <div class="detail-list">
            <div class="detail-item">
              <div class="detail-label">Store Name</div>
              <div class="detail-value">{{ testResults.shop.name }}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Store URL</div>
              <div class="detail-value">{{ testResults.store.url }}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Shop ID</div>
              <div class="detail-value">{{ testResults.shop.id }}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Shop Plan</div>
              <div class="detail-value">{{ testResults.shop.plan_name }}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Shop Country</div>
              <div class="detail-value">{{ testResults.shop.country_name }}</div>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="testResultDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title>Delete Shopify Store</v-card-title>
        <v-card-text>
          <div v-if="checkingUsage">
            <v-progress-circular indeterminate size="24" class="mb-2"></v-progress-circular>
            <span class="ml-2">Checking if this store is in use...</span>
          </div>
          
          <div v-else-if="usedByCampaigns.length > 0" class="error-message">
            <v-alert
              type="warning"
              title="Warning"
              variant="tonal"
            >
              This store cannot be deleted because it is used by the following campaigns:
              <ul class="mt-2">
                <li v-for="campaign in usedByCampaigns" :key="campaign.id">
                  {{ campaign.name }}
                </li>
              </ul>
              <p class="mt-2">Please reassign these campaigns to a different store first.</p>
            </v-alert>
          </div>
          
          <div v-else>
            <p>Are you sure you want to delete the Shopify store <strong>{{ storeToDelete?.name }}</strong>?</p>
            <p class="mt-2">This action cannot be undone.</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="cancelDelete">Cancel</v-btn>
          <v-btn 
            color="error" 
            variant="text" 
            @click="deleteStore" 
            :loading="deleting"
            :disabled="usedByCampaigns.length > 0 || checkingUsage"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
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
import { ref, onMounted } from 'vue';
import { 
  fetchShopifyStores, 
  testShopifyStore, 
  checkShopifyStoreUsage, 
  deleteShopifyStore 
} from '@/api/shopify';

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

<style scoped>
.shopify-stores-view {
  padding: 16px;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: rgba(0, 0, 0, 0.6);
}

.info-alert {
  background-color: #e3f2fd !important;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  padding-bottom: 8px;
}

.detail-label {
  flex: 0 0 140px;
  font-weight: bold;
}

.detail-value {
  flex: 1;
}
</style>