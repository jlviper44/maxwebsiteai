<template>
  <div class="campaign-form">
    <v-card>
      <v-card-title>
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
      
      <v-card-text v-if="loading">
        <div class="text-center py-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">{{ isEdit ? 'Loading campaign...' : 'Loading templates and stores...' }}</p>
        </div>
      </v-card-text>
      
      <v-card-text v-else>
        <v-form ref="form" v-model="formValid" @submit.prevent="submitForm">
          <!-- Campaign Name -->
          <v-text-field
            v-model="formData.campaignName"
            label="Campaign Name"
            :rules="[v => !!v || 'Campaign name is required']"
            required
          ></v-text-field>
          
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
          ></v-select>
          
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
            class="mt-4"
          ></v-select>
          
          <!-- Regional Settings -->
          <v-card class="mt-4 mb-4">
            <v-card-title>Regional Settings</v-card-title>
            <v-card-subtitle>Add affiliate links for specific regions. Only regions with links will be active for this campaign.</v-card-subtitle>
            
            <v-card-text>
              <div 
                v-for="region in regions" 
                :key="region" 
                class="geo-link-row"
              >
                <div class="d-flex align-center mb-2">
                  <v-checkbox
                    v-model="formData.geoRegions"
                    :value="region"
                    :label="region"
                    hide-details
                    @change="updateGeoLinkState(region)"
                  ></v-checkbox>
                </div>
                
                <v-text-field
                  v-model="formData.geoLinks[region]"
                  :disabled="!formData.geoRegions.includes(region)"
                  :label="`Affiliate link for ${region}`"
                  type="url"
                  hint="Enter the affiliate link for this region"
                  persistent-hint
                ></v-text-field>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Redirect Domain -->
          <v-select
            v-model="formData.redirectDomain"
            :items="domainOptions"
            label="Redirect Domain"
            hint="Select which domain to use for redirecting traffic."
            persistent-hint
          ></v-select>
          
          <!-- Campaign Active -->
          <v-switch
            v-model="formData.active"
            label="Campaign Active"
            color="primary"
            hint="When unchecked, the campaign will not route any traffic."
            persistent-hint
            class="mt-4"
          ></v-switch>
          
          <!-- Non-TikTok Traffic Handling -->
          <v-card class="mt-4 mb-4">
            <v-card-title>Non-TikTok Traffic Handling</v-card-title>
            
            <v-card-text>
              <!-- Whitehat Behavior -->
              <v-select
                v-model="formData.whitehatBehavior"
                :items="whitehatBehaviorOptions"
                label="Whitehat Behavior"
                hint="How to handle non-TikTok traffic visiting your campaign."
                persistent-hint
                @update:modelValue="updateWhitehatFields"
              ></v-select>
              
              <!-- Whitehat Template (conditional) -->
              <v-select
                v-if="showWhitehatTemplate"
                v-model="formData.whitehatTemplateId"
                :items="templateOptions"
                item-title="text"
                item-value="value"
                label="Whitehat Template"
                hint="This template will be shown to non-TikTok traffic."
                persistent-hint
                class="mt-4"
              ></v-select>
              
              <!-- Whitehat URL (conditional) -->
              <v-text-field
                v-if="showWhitehatURL"
                v-model="formData.whitehatURL"
                label="Redirect URL"
                type="url"
                hint="Non-TikTok traffic will be redirected to this URL."
                persistent-hint
                class="mt-4"
              ></v-text-field>
            </v-card-text>
          </v-card>
          
          <!-- Submit Buttons -->
          <div class="d-flex mt-4">
            <v-btn
              color="primary"
              type="submit"
              :loading="submitting"
              :disabled="!formValid"
            >
              {{ isEdit ? 'Update Campaign' : 'Create Campaign' }}
            </v-btn>
            
            <v-btn
              variant="text"
              to="/campaigns"
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

<style scoped>
.campaign-form {
  padding: 16px;
}

.geo-link-row {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
}
</style>