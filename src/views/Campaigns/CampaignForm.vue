<template>
  <div class="campaign-form">
    <v-card elevation="2" rounded="lg">
      <v-card-title class="text-h5 pb-2 d-flex align-center">
        <v-icon :icon="isEdit ? 'mdi-pencil' : 'mdi-plus-circle'" color="primary" class="mr-2"></v-icon>
        {{ isEdit ? 'Edit Campaign' : 'Create New Campaign' }}
        <v-btn
          icon 
          color="primary" 
          variant="text" 
          class="ml-auto"
          to="/campaigns"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text v-if="loading">
        <div class="text-center py-6">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="mt-4 text-medium-emphasis">{{ isEdit ? 'Loading campaign...' : 'Loading templates and stores...' }}</p>
        </div>
      </v-card-text>
      
      <v-card-text v-else class="form-content pt-4">
        <v-form ref="form" v-model="formValid" @submit.prevent="submitForm">
          <v-row>
            <v-col cols="12">
              <!-- Campaign Name -->
              <v-text-field
                v-model="formData.campaignName"
                label="Campaign Name"
                :rules="[v => !!v || 'Campaign name is required']"
                required
                placeholder="My TikTok Campaign"
                variant="outlined"
                prepend-inner-icon="mdi-label-outline"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <!-- Shopify Store -->
              <v-select
                v-model="formData.shopifyStoreId"
                :items="storeOptions"
                item-title="text"
                item-value="value"
                label="Shopify Store"
                :rules="[v => !!v || 'Shopify store is required']"
                required
                hint="This store will be used to create a cloaked landing page."
                persistent-hint
                variant="outlined"
                prepend-inner-icon="mdi-shopping-outline"
              ></v-select>
            </v-col>
            
            <v-col cols="12" md="6">
              <!-- Offer Template -->
              <v-select
                v-model="formData.templateId"
                :items="templateOptions"
                item-title="text"
                item-value="value"
                label="Offer Template"
                :rules="[v => !!v || 'Template is required']"
                required
                hint="This template will be shown to visitors."
                persistent-hint
                variant="outlined"
                prepend-inner-icon="mdi-file-document-outline"
              ></v-select>
            </v-col>
          </v-row>
          
          <!-- Regional Settings -->
          <v-card class="mt-4 mb-4 region-card" variant="outlined">
            <v-card-title class="text-h6 pb-2 d-flex align-center">
              <v-icon icon="mdi-earth" color="primary" class="mr-2"></v-icon>
              Regional Settings
            </v-card-title>
            
            <v-divider></v-divider>
            
            <v-card-subtitle class="pt-3">
              Add affiliate links for specific regions. Only regions with links will be active for this campaign.
            </v-card-subtitle>
            
            <v-card-text>
              <div class="region-grid">
                <div 
                  v-for="region in regions" 
                  :key="region"
                  class="region-item"
                >
                  <v-card variant="flat" class="region-card-inner pa-3" :class="{'region-active': formData.geoRegions.includes(region)}">
                    <div class="d-flex align-center mb-3">
                      <v-checkbox
                        v-model="formData.geoRegions"
                        :value="region"
                        :label="region"
                        hide-details
                        color="primary"
                        @change="updateGeoLinkState(region)"
                      ></v-checkbox>
                      <v-spacer></v-spacer>
                      <v-chip size="small" :color="formData.geoRegions.includes(region) ? 'primary' : 'grey'" variant="elevated">
                        {{ formData.geoRegions.includes(region) ? 'Active' : 'Inactive' }}
                      </v-chip>
                    </div>
                    
                    <v-text-field
                      v-model="formData.geoLinks[region]"
                      :disabled="!formData.geoRegions.includes(region)"
                      :label="`Affiliate link for ${region}`"
                      type="url"
                      hint="Enter the affiliate link for this region"
                      persistent-hint
                      variant="outlined"
                      density="compact"
                      placeholder="https://example.com/affiliate"
                      prepend-inner-icon="mdi-link-variant"
                    ></v-text-field>
                  </v-card>
                </div>
              </div>
            </v-card-text>
          </v-card>
          
          <v-row>
            <v-col cols="12" md="6">
              <!-- Redirect Domain -->
              <v-select
                v-model="formData.redirectDomain"
                :items="domainOptions"
                label="Redirect Domain"
                hint="Select which domain to use for redirecting traffic."
                persistent-hint
                variant="outlined"
                prepend-inner-icon="mdi-web"
              ></v-select>
            </v-col>
            
            <v-col cols="12" md="6" class="d-flex align-center">
              <!-- Campaign Active -->
              <v-switch
                v-model="formData.active"
                label="Campaign Active"
                color="primary"
                hint="When unchecked, the campaign will not route any traffic."
                persistent-hint
                class="mt-4"
              >
                <template v-slot:prepend>
                  <v-icon :icon="formData.active ? 'mdi-check-circle' : 'mdi-cancel'" :color="formData.active ? 'success' : 'error'" class="mr-2"></v-icon>
                </template>
              </v-switch>
              
              <v-chip
                :color="formData.active ? 'success' : 'error'"
                size="small"
                variant="elevated"
                class="ml-3"
              >
                {{ formData.active ? 'Active' : 'Inactive' }}
              </v-chip>
            </v-col>
          </v-row>
          
          <!-- Non-TikTok Traffic Handling -->
          <v-card class="mt-4 mb-4 whitehat-card" variant="outlined">
            <v-card-title class="text-h6 pb-2 d-flex align-center">
              <v-icon icon="mdi-earth-off" color="primary" class="mr-2"></v-icon>
              Non-TikTok Traffic Handling
            </v-card-title>
            
            <v-divider></v-divider>
            
            <v-card-text>
              <v-row>
                <v-col cols="12">
                  <!-- Whitehat Behavior -->
                  <v-select
                    v-model="formData.whitehatBehavior"
                    :items="whitehatBehaviorOptions"
                    label="Whitehat Behavior"
                    hint="How to handle non-TikTok traffic visiting your campaign."
                    persistent-hint
                    variant="outlined"
                    prepend-inner-icon="mdi-traffic-light"
                    @update:modelValue="updateWhitehatFields"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" v-if="showWhitehatTemplate">
                  <!-- Whitehat Template (conditional) -->
                  <v-select
                    v-model="formData.whitehatTemplateId"
                    :items="templateOptions"
                    item-title="text"
                    item-value="value"
                    label="Whitehat Template"
                    hint="This template will be shown to non-TikTok traffic."
                    persistent-hint
                    variant="outlined"
                    prepend-inner-icon="mdi-file-replace-outline"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" v-if="showWhitehatURL">
                  <!-- Whitehat URL (conditional) -->
                  <v-text-field
                    v-model="formData.whitehatURL"
                    label="Redirect URL"
                    type="url"
                    hint="Non-TikTok traffic will be redirected to this URL."
                    persistent-hint
                    variant="outlined"
                    prepend-inner-icon="mdi-link-variant"
                    placeholder="https://example.com/redirect"
                  ></v-text-field>
                </v-col>
              </v-row>
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
              :prepend-icon="isEdit ? 'mdi-content-save' : 'mdi-plus-circle'"
              min-width="180"
            >
              {{ isEdit ? 'Update Campaign' : 'Create Campaign' }}
            </v-btn>
            
            <v-btn
              variant="tonal"
              to="/campaigns"
              class="ml-4"
              size="large"
              prepend-icon="mdi-close"
              min-width="120"
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

const route = useRoute();
const router = useRouter();

// Determine if this is an edit or create form
const isEdit = computed(() => route.name === 'campaign-edit');
const campaignId = computed(() => route.params.id);

// Form state
const form = ref(null);
const formValid = ref(false);
const formData = reactive({
  campaignName: '',
  shopifyStoreId: '',
  templateId: '',
  redirectDomain: '',
  active: true,
  geoRegions: [],
  geoLinks: {},
  whitehatBehavior: '404-page',
  whitehatTemplateId: '',
  whitehatURL: ''
});

// UI state
const loading = ref(true);
const submitting = ref(false);
const templates = ref([]);
const stores = ref([]);
const snackbar = ref({
  show: false,
  text: '',
  color: 'info'
});

// Available regions
const regions = ref([
  'US', 'UK', 'CA', 'AU', 'EU', 'GLOBAL'
]);

// Domain options
const domainOptions = [
  { title: 'Random (select automatically)', value: '' },
  { title: 'tikfunnelreward.com', value: 'https://tikfunnelreward.com' },
  { title: 'tikshein.info', value: 'https://tikshein.info' },
  { title: 'tikshein.pro', value: 'https://tikshein.pro' },
  { title: 'tikshein.store', value: 'https://tikshein.store' },
  { title: 'tiksub.xyz', value: 'https://tiksub.xyz' },
  { title: 'tiktemp.xyz', value: 'https://tiktemp.xyz' }
];

// Whitehat behavior options
const whitehatBehaviorOptions = [
  { title: 'Show 404 Not Found Page', value: '404-page' },
  { title: 'Show Different Template', value: 'template' },
  { title: 'Redirect to URL', value: 'redirect' }
];

// Computed properties
const templateOptions = computed(() => {
  return templates.value.map(template => ({
    text: `${template.name} (${template.type})`,
    value: template.id
  }));
});

const storeOptions = computed(() => {
  return stores.value.map(store => ({
    text: `${store.name} (${store.url})`,
    value: store.id
  }));
});

const showWhitehatTemplate = computed(() => {
  return formData.whitehatBehavior === 'template';
});

const showWhitehatURL = computed(() => {
  return formData.whitehatBehavior === 'redirect';
});

// Initialize component
onMounted(async () => {
  await Promise.all([
    fetchTemplates(),
    fetchStores()
  ]);
  
  if (isEdit.value) {
    await fetchCampaign();
  }
  
  loading.value = false;
});

// Fetch templates
async function fetchTemplates() {
  try {
    const response = await fetch('/api/templates');
    const data = await response.json();
    
    if (data.success) {
      templates.value = data.templates;
    } else {
      showSnackbar('Failed to load templates: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error fetching templates:', error);
    showSnackbar('Failed to load templates', 'error');
  }
}

// Fetch stores
async function fetchStores() {
  try {
    const response = await fetch('/api/stores');
    const data = await response.json();
    
    if (data.success) {
      stores.value = data.stores;
    } else {
      showSnackbar('Failed to load stores: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error fetching stores:', error);
    showSnackbar('Failed to load stores', 'error');
  }
}

// Fetch campaign for editing
async function fetchCampaign() {
  try {
    const response = await fetch(`/api/campaigns?id=${campaignId.value}`);
    const data = await response.json();
    
    if (data.success && data.campaign) {
      const campaign = data.campaign;
      
      // Fill form data
      formData.campaignName = campaign.name;
      formData.shopifyStoreId = campaign.shopifyStoreId;
      formData.templateId = campaign.templateId;
      formData.redirectDomain = campaign.redirectDomain || '';
      formData.active = campaign.active;
      formData.whitehatBehavior = campaign.whitehatBehavior || '404-page';
      formData.whitehatTemplateId = campaign.whitehatTemplateId || '';
      formData.whitehatURL = campaign.whitehatURL || '';
      
      // Handle geo links
      if (campaign.geoLinks) {
        formData.geoLinks = { ...campaign.geoLinks };
        formData.geoRegions = Object.keys(campaign.geoLinks);
      }
    } else {
      showSnackbar('Failed to load campaign: ' + (data.error || 'Campaign not found'), 'error');
      router.push('/campaigns');
    }
  } catch (error) {
    console.error('Error fetching campaign:', error);
    showSnackbar('Failed to load campaign', 'error');
    router.push('/campaigns');
  }
}

// Update geo link state when checkbox changes
function updateGeoLinkState(region) {
  if (!formData.geoRegions.includes(region)) {
    // If region is unchecked, clear its link
    formData.geoLinks[region] = '';
  }
}

// Update whitehat fields visibility
function updateWhitehatFields() {
  if (formData.whitehatBehavior !== 'template') {
    formData.whitehatTemplateId = '';
  }
  
  if (formData.whitehatBehavior !== 'redirect') {
    formData.whitehatURL = '';
  }
}

// Submit form
async function submitForm() {
  if (!formValid.value) {
    showSnackbar('Please fill all required fields correctly', 'error');
    return;
  }
  
  // Validate that at least one region has a valid link
  const hasValidGeoLink = formData.geoRegions.some(region => 
    formData.geoLinks[region] && formData.geoLinks[region].trim() !== ''
  );
  
  if (!hasValidGeoLink) {
    showSnackbar('At least one region with a valid affiliate link is required', 'error');
    return;
  }
  
  submitting.value = true;
  
  try {
    // Prepare form data for API
    const apiFormData = {
      campaignName: formData.campaignName,
      shopifyStoreId: formData.shopifyStoreId,
      templateId: formData.templateId,
      redirectDomain: formData.redirectDomain,
      active: formData.active,
      geoRegions: formData.geoRegions,
      whitehatBehavior: formData.whitehatBehavior,
      whitehatTemplateId: formData.whitehatTemplateId,
      whitehatURL: formData.whitehatURL
    };
    
    // Add geo links
    formData.geoRegions.forEach(region => {
      apiFormData[`geoLinks-${region}`] = formData.geoLinks[region];
    });
    
    // For edit, add campaign ID
    if (isEdit.value) {
      apiFormData.id = campaignId.value;
    }
    
    // Send request
    const endpoint = isEdit.value ? `/api/campaigns/edit` : '/api/campaigns/create';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiFormData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSnackbar(
        isEdit.value ? 'Campaign updated successfully' : 'Campaign created successfully',
        'success'
      );
      
      // Navigate back to campaigns list
      router.push('/campaigns');
    } else {
      showSnackbar(
        `Failed to ${isEdit.value ? 'update' : 'create'} campaign: ${data.error}`,
        'error'
      );
    }
  } catch (error) {
    console.error(`Error ${isEdit.value ? 'updating' : 'creating'} campaign:`, error);
    showSnackbar(`Failed to ${isEdit.value ? 'update' : 'create'} campaign`, 'error');
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
  --form-bg: #ffffff;
  --card-inner-bg: #f5f7fa;
  --card-active-bg: rgba(25, 118, 210, 0.05);
  --region-active-border: #1976d2;
  --transition-speed: 0.3s;
}

[data-theme="dark"] {
  --form-bg: #1e1e1e;
  --card-inner-bg: #2d2d2d;
  --card-active-bg: rgba(100, 181, 246, 0.1);
  --region-active-border: #64b5f6;
}
</style>

<style scoped>
.campaign-form {
  padding: 16px;
}

.form-content {
  background-color: var(--form-bg);
  transition: background-color var(--transition-speed) ease;
}

.region-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.region-card, .whitehat-card {
  transition: all var(--transition-speed) ease;
}

.region-card-inner {
  background-color: var(--card-inner-bg);
  border-radius: 8px;
  transition: all var(--transition-speed) ease;
  border: 2px solid transparent;
}

.region-active {
  background-color: var(--card-active-bg);
  border-color: var(--region-active-border);
}

@media (max-width: 600px) {
  .region-grid {
    grid-template-columns: 1fr;
  }
  
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