<template>
  <div class="templates-view">
    <div class="header-actions">
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus"
        to="/templates/create"
      >
        Create New Template
      </v-btn>
    </div>
    
    <v-card class="mt-4">
      <v-card-title>Your Templates</v-card-title>
      <v-card-text>
        <div v-if="loading" class="text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p>Loading templates...</p>
        </div>
        
        <div v-else-if="templates.length === 0" class="empty-state">
          <p>No templates found. Create your first template to get started.</p>
        </div>
        
        <v-table v-else>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="template in templates" :key="template.id">
              <td>{{ template.name }}</td>
              <td>
                <v-chip
                  :color="template.type === 'html' ? 'primary' : 'success'"
                  size="small"
                >
                  {{ template.type === 'html' ? 'HTML Template' : 'Google Form' }}
                </v-chip>
              </td>
              <td>{{ formatDate(template.created) }}</td>
              <td>{{ formatDate(template.updated) }}</td>
              <td>
                <div class="d-flex gap-2">
                  <v-btn 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                    :to="`/templates/edit/${template.id}`"
                  >
                    Edit
                  </v-btn>
                  <v-btn 
                    size="small" 
                    color="error" 
                    variant="outlined" 
                    @click="confirmDelete(template)"
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
    
    <div class="template-info-cards mt-4">
      <v-card class="info-card">
        <v-card-title>HTML Templates</v-card-title>
        <v-card-text>
          <p>Create custom HTML templates for your TikTok traffic. You can use the <code></code> placeholder in your template to insert your affiliate link.</p>
          <p>The template will be shown to TikTok users when they visit your campaign link.</p>
        </v-card-text>
      </v-card>
      
      <v-card class="info-card">
        <v-card-title>Google Form Redirects</v-card-title>
        <v-card-text>
          <p>Use an existing Google Form as your landing page. We'll automatically add a button to redirect users to your affiliate link.</p>
          <p>This is perfect for lead generation or when you want to collect user information.</p>
        </v-card-text>
      </v-card>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title>Delete Template</v-card-title>
        <v-card-text>
          <div v-if="checkingUsage">
            <v-progress-circular indeterminate size="24" class="mb-2"></v-progress-circular>
            <span class="ml-2">Checking if this template is in use...</span>
          </div>
          
          <div v-else-if="usedByCampaigns.length > 0" class="error-message">
            <v-alert
              type="warning"
              title="Warning"
              variant="tonal"
            >
              This template cannot be deleted because it is used by the following campaigns:
              <ul class="mt-2">
                <li v-for="campaign in usedByCampaigns" :key="campaign.id">
                  {{ campaign.name }}
                </li>
              </ul>
              <p class="mt-2">Please reassign these campaigns to a different template first.</p>
            </v-alert>
          </div>
          
          <div v-else>
            <p>Are you sure you want to delete the template <strong>{{ templateToDelete?.name }}</strong>?</p>
            <p class="mt-2">This action cannot be undone.</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="cancelDelete">Cancel</v-btn>
          <v-btn 
            color="error" 
            variant="text" 
            @click="deleteTemplate" 
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
import { fetchTemplates, checkTemplateUsage, deleteTemplate as apiDeleteTemplate } from '@/api/templates';

const templates = ref([]);
const loading = ref(true);
const deleteDialog = ref(false);
const templateToDelete = ref(null);
const deleting = ref(false);
const checkingUsage = ref(false);
const usedByCampaigns = ref([]);

const snackbar = ref({
  show: false,
  text: '',
  color: 'info'
});

// Fetch templates when component mounts
onMounted(async () => {
  await fetchTemplatesList();
});

// Fetch all templates
async function fetchTemplatesList() {
  loading.value = true;
  try {
    const response = await fetchTemplates();
    
    if (response.success) {
      templates.value = response.templates;
    } else {
      showSnackbar('Failed to load templates: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('Error fetching templates:', error);
    showSnackbar('Failed to load templates', 'error');
  } finally {
    loading.value = false;
  }
}

// Format date
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp).toLocaleDateString();
}

// Confirm template deletion
async function confirmDelete(template) {
  templateToDelete.value = template;
  usedByCampaigns.value = [];
  deleteDialog.value = true;
  
  // Check if template is used by any campaigns
  checkingUsage.value = true;
  try {
    const response = await checkTemplateUsage(template.id);
    
    if (response.success && response.usedBy) {
      usedByCampaigns.value = response.usedBy;
    }
  } catch (error) {
    console.error('Error checking template usage:', error);
    showSnackbar('Failed to check template usage', 'error');
  } finally {
    checkingUsage.value = false;
  }
}

// Cancel delete operation
function cancelDelete() {
  deleteDialog.value = false;
  templateToDelete.value = null;
  usedByCampaigns.value = [];
}

// Delete template
async function deleteTemplate() {
  if (!templateToDelete.value) return;
  
  deleting.value = true;
  try {
    const response = await apiDeleteTemplate(templateToDelete.value.id);
    
    if (response.success) {
      showSnackbar('Template deleted successfully', 'success');
      await fetchTemplatesList();
      deleteDialog.value = false;
    } else {
      showSnackbar('Failed to delete template: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    showSnackbar('Failed to delete template', 'error');
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
.templates-view {
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

.template-info-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-card {
  background-color: #f8f9fa;
}

@media (max-width: 768px) {
  .template-info-cards {
    grid-template-columns: 1fr;
  }
}
</style>