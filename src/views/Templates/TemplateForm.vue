<template>
  <div class="template-form">
    <v-card>
      <v-card-title>
        {{ isEdit ? 'Edit Template' : 'Create New Template' }}
        <v-btn
          icon 
          color="primary" 
          variant="text" 
          class="ml-auto"
          to="/templates"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-card-text v-if="loading">
        <div class="text-center py-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">{{ isEdit ? 'Loading template...' : 'Loading...' }}</p>
        </div>
      </v-card-text>
      
      <v-card-text v-else>
        <v-form ref="form" v-model="formValid" @submit.prevent="submitForm">
          <!-- Template Name -->
          <v-text-field
            v-model="formData.templateName"
            label="Template Name"
            :rules="[v => !!v || 'Template name is required']"
            required
            hint="A descriptive name for your template."
            persistent-hint
          ></v-text-field>
          
          <!-- Template Type (disabled for edit) -->
          <v-select
            v-model="formData.templateType"
            :items="templateTypeOptions"
            item-title="text"
            item-value="value"
            label="Template Type"
            :rules="[v => !!v || 'Template type is required']"
            required
            hint="Select the type of template you want to create."
            persistent-hint
            :disabled="isEdit"
            class="mt-4"
            @update:modelValue="updateTemplateFields"
          ></v-select>
          
          <!-- HTML Content (for HTML templates) -->
          <v-textarea
            v-if="showHtmlContent"
            v-model="formData.htmlContent"
            label="HTML Content"
            :rules="[v => (formData.templateType === 'html' ? !!v : true) || 'HTML content is required']"
            rows="15"
            class="mt-4"
            hint="Enter your HTML content here. You can use {{affiliate_link}} placeholder for the affiliate link."
            persistent-hint
          ></v-textarea>
          
          <!-- Google Form URL (for Google Form redirects) -->
          <v-text-field
            v-if="showGoogleFormUrl"
            v-model="formData.googleFormUrl"
            label="Google Form URL"
            type="url"
            :rules="[v => (formData.templateType === 'googleform' ? !!v : true) || 'Google Form URL is required']"
            placeholder="https://forms.gle/..."
            class="mt-4"
            hint="Enter the URL of your Google Form."
            persistent-hint
          ></v-text-field>
          
          <!-- Submit Buttons -->
          <div class="d-flex mt-6">
            <v-btn
              color="primary"
              type="submit"
              :loading="submitting"
              :disabled="!formValid"
            >
              {{ isEdit ? 'Update Template' : 'Create Template' }}
            </v-btn>
            
            <v-btn
              variant="text"
              to="/templates"
              class="ml-4"
            >
              Cancel
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
    
    <!-- Code Help Dialog -->
    <v-dialog v-model="codeHelpDialog" max-width="800px">
      <v-card>
        <v-card-title>HTML Template Help</v-card-title>
        <v-card-text>
          <h3 class="text-h6 mb-2">Placeholders</h3>
          <p>You can use the following placeholders in your HTML templates:</p>
          <v-list>
            <v-list-item>
              <v-list-item-title></v-list-item-title>
              <v-list-item-subtitle>This will be replaced with the affiliate link for the campaign.</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          
          <h3 class="text-h6 mt-4 mb-2">Example Template</h3>
          <v-card variant="outlined" class="code-example pa-3">
            <pre></pre>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="codeHelpDialog = false">Close</v-btn>
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
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchTemplate, createTemplate, updateTemplate } from '@/api/templates';

const route = useRoute();
const router = useRouter();

// Determine if this is an edit or create form
const isEdit = computed(() => route.name === 'template-edit');
const templateId = computed(() => route.params.id);

// Form state
const form = ref(null);
const formValid = ref(false);
const formData = reactive({
  templateName: '',
  templateType: 'html',
  htmlContent: '',
  googleFormUrl: ''
});

// UI state
const loading = ref(true);
const submitting = ref(false);
const codeHelpDialog = ref(false);
const snackbar = ref({
  show: false,
  text: '',
  color: 'info'
});

// Template type options
const templateTypeOptions = [
  { text: 'HTML Template', value: 'html' },
  { text: 'Google Form Redirect', value: 'googleform' }
];

// Computed properties for conditional display
const showHtmlContent = computed(() => {
  return formData.templateType === 'html';
});

const showGoogleFormUrl = computed(() => {
  return formData.templateType === 'googleform';
});

// Initialize component
onMounted(async () => {
  if (isEdit.value) {
    await fetchTemplateData();
  }
  
  loading.value = false;
});

// Fetch template for editing
async function fetchTemplateData() {
  try {
    const response = await fetchTemplate(templateId.value);
    
    if (response.success && response.template) {
      const template = response.template;
      
      // Fill form data
      formData.templateName = template.name;
      formData.templateType = template.type;
      
      if (template.type === 'html' && response.content) {
        formData.htmlContent = response.content;
      } else if (template.type === 'googleform' && template.url) {
        formData.googleFormUrl = template.url;
      }
    } else {
      showSnackbar('Failed to load template: ' + (response.error || 'Template not found'), 'error');
      router.push('/templates');
    }
  } catch (error) {
    console.error('Error fetching template:', error);
    showSnackbar('Failed to load template', 'error');
    router.push('/templates');
  }
}

// Update template fields when type changes
function updateTemplateFields() {
  // Clear irrelevant fields based on selected type
  if (formData.templateType === 'html') {
    formData.googleFormUrl = '';
  } else if (formData.templateType === 'googleform') {
    formData.htmlContent = '';
  }
}

// Submit form
async function submitForm() {
  if (!formValid.value) {
    showSnackbar('Please fill all required fields correctly', 'error');
    return;
  }
  
  // Validate based on template type
  if (formData.templateType === 'html' && !formData.htmlContent.trim()) {
    showSnackbar('HTML content is required for HTML templates', 'error');
    return;
  }
  
  if (formData.templateType === 'googleform' && !formData.googleFormUrl.trim()) {
    showSnackbar('Google Form URL is required for Google Form redirects', 'error');
    return;
  }
  
  submitting.value = true;
  
  try {
    // Prepare form data
    const templateData = {
      templateName: formData.templateName,
      templateType: formData.templateType
    };
    
    if (formData.templateType === 'html') {
      templateData.htmlContent = formData.htmlContent;
    } else if (formData.templateType === 'googleform') {
      templateData.googleFormUrl = formData.googleFormUrl;
    }
    
    // For edit, add the template ID
    if (isEdit.value) {
      templateData.templateId = templateId.value;
      
      // Call update API
      const response = await updateTemplate(templateData);
      
      if (response.success) {
        showSnackbar('Template updated successfully', 'success');
        router.push('/templates');
      } else {
        showSnackbar('Failed to update template: ' + response.error, 'error');
      }
    } else {
      // Call create API
      const response = await createTemplate(templateData);
      
      if (response.success) {
        showSnackbar('Template created successfully', 'success');
        router.push('/templates');
      } else {
        showSnackbar('Failed to create template: ' + response.error, 'error');
      }
    }
  } catch (error) {
    console.error(`Error ${isEdit.value ? 'updating' : 'creating'} template:`, error);
    showSnackbar(`Failed to ${isEdit.value ? 'update' : 'create'} template`, 'error');
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
.template-form {
  padding: 16px;
}

.code-example {
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: auto;
}

.code-example pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>