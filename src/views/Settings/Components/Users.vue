<template>
  <div>
    <v-alert type="info" variant="tonal" class="mb-6 info-alert rounded-lg elevation-1">
      <template v-slot:prepend>
        <v-icon icon="mdi-information" color="info"></v-icon>
      </template>
      <div>
        <span class="font-weight-medium">User Management</span>
        <p class="text-body-2 mt-1">
          Manage user accounts and permissions. Users can access the admin panel based on their assigned permissions.
        </p>
      </div>
    </v-alert>
    
    <h3 class="text-h6 mb-4 font-weight-bold section-title">
      <v-icon icon="mdi-account-group" color="primary" class="mr-2"></v-icon>
      Users Management
    </h3>
    
    <!-- Users List Table -->
    <v-card variant="elevated" class="mb-6 rounded-lg elevation-2 users-card">
      <v-card-title class="d-flex justify-space-between align-center pa-4">
        <div class="d-flex align-center">
          <v-icon icon="mdi-account-multiple" color="primary" class="mr-2"></v-icon>
          <span class="text-h6">Users List</span>
        </div>
        <v-btn color="primary" @click="showAddDialog" prepend-icon="mdi-plus" variant="elevated">
          Add User
        </v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="pa-0">
        <div v-if="loading" class="d-flex justify-center align-center py-8">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <span class="ml-4 text-body-1">Loading users...</span>
        </div>
        
        <div v-else-if="users.length === 0" class="text-center py-8 empty-state">
          <v-icon icon="mdi-account-off" size="64" class="mb-4 opacity-50"></v-icon>
          <p class="text-h6 mb-2">No Users Found</p>
          <p class="text-body-2">Add your first user to get started</p>
          <v-btn color="primary" class="mt-4" @click="showAddDialog" prepend-icon="mdi-plus">
            Add User
          </v-btn>
        </div>
        
        <v-data-table
          v-else
          :headers="headers"
          :items="users"
          :loading="loading"
          class="elevation-0 users-table"
          hover
        >
          <template v-slot:item.actions="{ item }">
            <div class="d-flex">
              <v-btn
                icon 
                variant="text"
                size="small"
                color="primary"
                class="mr-2" 
                @click="editItem(item)"
              >
                <v-icon>mdi-pencil</v-icon>
                <v-tooltip activator="parent" location="top">Edit</v-tooltip>
              </v-btn>
              <v-btn 
                icon
                variant="text"
                size="small"
                color="error"
                @click="deleteItem(item)"
              >
                <v-icon>mdi-delete</v-icon>
                <v-tooltip activator="parent" location="top">Delete</v-tooltip>
              </v-btn>
            </div>
          </template>
          
          <template v-slot:item.Name="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="32" color="primary" class="mr-2">
                <span class="text-caption white--text">{{ getInitials(item.Name) }}</span>
              </v-avatar>
              <span>{{ item.Name }}</span>
            </div>
          </template>
          
          <template v-slot:item.Permissions="{ item }">
            <div>
              <v-chip
                v-for="(permission, index) in item.Permissions.split(',')"
                :key="index"
                size="small"
                color="primary"
                variant="outlined"
                class="mr-1 mb-1"
              >
                {{ permission }}
              </v-chip>
            </div>
          </template>
          
          <template v-slot:item.Password="{ item }">
            <span class="password-dots">••••••••</span>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- User Form Dialog -->
    <v-dialog v-model="dialog" max-width="500px" :scrim="true">
      <v-card class="rounded-lg elevation-4 user-form-card">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon :icon="formTitle === 'New User' ? 'mdi-account-plus' : 'mdi-account-edit'" color="primary" class="mr-2"></v-icon>
          <span class="text-h6">{{ formTitle }}</span>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-4">
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.Name"
                  label="Full Name"
                  :rules="nameRules"
                  required
                  variant="outlined"
                  prepend-inner-icon="mdi-account"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.Username"
                  label="Username"
                  :rules="usernameRules"
                  required
                  variant="outlined"
                  prepend-inner-icon="mdi-account-key"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.Password"
                  label="Password"
                  :type="showPassword ? 'text' : 'password'"
                  :rules="passwordRules"
                  :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="showPassword = !showPassword"
                  required
                  variant="outlined"
                  prepend-inner-icon="mdi-lock"
                ></v-text-field>
                
                <div v-if="!editedItem.ID" class="text-caption password-hint mt-1">
                  <v-icon icon="mdi-information-outline" size="small" class="mr-1"></v-icon>
                  Password must be at least 8 characters
                </div>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.Permissions"
                  :items="permissionOptions"
                  label="Permissions"
                  multiple
                  chips
                  closable-chips
                  required
                  variant="outlined"
                  prepend-inner-icon="mdi-shield-account"
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="tonal" @click="close">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="save" :disabled="!valid" :loading="saving">
            {{ formTitle === 'New User' ? 'Create User' : 'Update User' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px" :scrim="true">
      <v-card class="rounded-lg elevation-4 delete-dialog">
        <v-card-title class="pa-4 d-flex align-center">
          <v-icon icon="mdi-alert-circle" color="error" class="mr-2"></v-icon>
          <span class="text-h6">Delete User</span>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-4">
          <p>Are you sure you want to delete the user "<strong>{{ editedItem.Name }}</strong>"?</p>
          <p class="text-caption error-text mt-2">This action cannot be undone.</p>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="tonal" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="elevated" @click="confirmDelete" :loading="deleting">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useTheme } from 'vuetify'

// Initialize Vuetify theme
const theme = useTheme();

// Get current theme
const isDarkMode = computed(() => {
  return theme.global.current.value.dark;
});

// Table headers
const headers = [
  { title: 'ID', key: 'ID', sortable: true, align: 'start' },
  { title: 'Name', key: 'Name', sortable: true, align: 'start' },
  { title: 'Username', key: 'Username', sortable: true, align: 'start' },
  { title: 'Password', key: 'Password', sortable: false, align: 'center' },
  { title: 'Permissions', key: 'Permissions', sortable: true, align: 'start' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
];

// Data
const users = ref([]);
const loading = ref(true);
const dialog = ref(false);
const deleteDialog = ref(false);
const valid = ref(true);
const showPassword = ref(false);
const permissionOptions = ref([]);
const saving = ref(false);
const deleting = ref(false);

// Snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// Helper to get initials from name
const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Fetch permission options from UserPermissions table
const fetchPermissions = async () => {
  try {
    const response = await fetch('/api/sql/UserPermissions');
    const data = await response.json();
    
    if (data.success) {
      permissionOptions.value = data.data.map(permission => permission.Name);
    } else {
      showSnackbar('Error loading permissions: ' + data.error, 'error');
    }
  } catch (error) {
    showSnackbar('Failed to load permissions: ' + error, 'error');
  }
};
const baseUrl = '/api/sql/Users';

// Form validation rules
const nameRules = [
  v => !!v || 'Name is required',
];
const usernameRules = [
  v => !!v || 'Username is required',
];
const passwordRules = [
  v => !!v || 'Password is required',
  v => (v && v.length >= 8) || 'Password must be at least 8 characters',
];

// Default form state
const defaultItem = {
  ID: null,
  Name: '',
  Username: '',
  Password: '',
  Permissions: []
};

// Current edited item
const editedItem = reactive({...defaultItem});
const editedIndex = ref(-1);

// Form title
const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'New User' : 'Edit User';
});

// Methods
const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await fetch(baseUrl);
    const data = await response.json();
    
    if (data.success) {
      users.value = data.data;
    } else {
      showSnackbar('Error loading users: ' + data.error, 'error');
    }
  } catch (error) {
    showSnackbar('Failed to connect to server: ' + error, 'error');
  } finally {
    loading.value = false;
  }
};

const showAddDialog = () => {
  editedIndex.value = -1;
  Object.assign(editedItem, defaultItem);
  dialog.value = true;
};

const editItem = (item) => {
  editedIndex.value = users.value.indexOf(item);
  // Create a copy of the item to prevent direct modification
  const itemCopy = {...item};
  // Convert permissions string to array for v-select
  itemCopy.Permissions = processPermissionsForEdit(item);
  Object.assign(editedItem, itemCopy);
  dialog.value = true;
};

const deleteItem = (item) => {
  editedIndex.value = users.value.indexOf(item);
  Object.assign(editedItem, item);
  deleteDialog.value = true;
};

const close = () => {
  dialog.value = false;
  setTimeout(() => {
    Object.assign(editedItem, defaultItem);
    editedIndex.value = -1;
  }, 300);
};

const save = async () => {
  if (!valid.value) return;

  saving.value = true;
  try {
    let response;
    let method;
    let url = baseUrl;
    
    // Process permissions from array to string
    processPermissions();
    
    if (editedIndex.value > -1) {
      // Update existing user
      method = 'PUT';
      url = `${baseUrl}/${editedItem.ID}`;
    } else {
      // Create new user
      method = 'POST';
    }
    
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editedItem),
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (editedIndex.value > -1) {
        // Update existing item in the table
        Object.assign(users.value[editedIndex.value], editedItem);
        showSnackbar('User updated successfully', 'success');
      } else {
        // Add new item to the table
        fetchUsers(); // Reload to get the auto-generated ID
        showSnackbar('User created successfully', 'success');
      }
      close();
    } else {
      showSnackbar('Error: ' + data.error, 'error');
    }
  } catch (error) {
    showSnackbar('Failed to save user: ' + error, 'error');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async () => {
  deleting.value = true;
  try {
    const response = await fetch(`${baseUrl}/${editedItem.ID}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (data.success) {
      users.value.splice(editedIndex.value, 1);
      showSnackbar('User deleted successfully', 'success');
    } else {
      showSnackbar('Error deleting user: ' + data.error, 'error');
    }
    
    deleteDialog.value = false;
    editedIndex.value = -1;
  } catch (error) {
    showSnackbar('Failed to delete user: ' + error, 'error');
  } finally {
    deleting.value = false;
  }
};

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  };
};

// Process permissions when saving
const processPermissions = () => {
  // Convert array to comma-separated string for storage
  if (Array.isArray(editedItem.Permissions)) {
    editedItem.Permissions = editedItem.Permissions.join(',');
  }
};

// Process permissions when editing
const processPermissionsForEdit = (item) => {
  // Convert string to array for v-select
  if (typeof item.Permissions === 'string') {
    return item.Permissions.split(',');
  }
  return [];
};

// Load data on component mount
onMounted(() => {
  fetchUsers();
  fetchPermissions();
});
</script>

<style>
:root {
  --info-alert-bg: #f0f7ff;
  --section-title-color: #333333;
  --users-card-bg: #ffffff;
  --users-table-header-bg: #f5f7fa;
  --users-table-row-hover: rgba(25, 118, 210, 0.04);
  --password-dots-color: #616161;
  --password-hint-color: #757575;
  --error-text-color: #e57373;
  --empty-state-color: #757575;
  --transition-speed: 0.3s;
}

[data-theme="dark"] {
  --info-alert-bg: rgba(25, 118, 210, 0.1);
  --section-title-color: #e0e0e0;
  --users-card-bg: #1e1e1e;
  --users-table-header-bg: #2d2d2d;
  --users-table-row-hover: rgba(100, 181, 246, 0.08);
  --password-dots-color: #b0bec5;
  --password-hint-color: #b0bec5;
  --error-text-color: #ef9a9a;
  --empty-state-color: #b0bec5;
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

.users-card {
  background-color: var(--users-card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

.user-form-card, .delete-dialog {
  background-color: var(--users-card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

:deep(.v-data-table) {
  background-color: var(--users-card-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

:deep(.v-data-table-header) {
  background-color: var(--users-table-header-bg) !important;
  transition: background-color var(--transition-speed) ease;
}

:deep(.v-data-table__tr:hover) {
  background-color: var(--users-table-row-hover) !important;
}

.password-dots {
  color: var(--password-dots-color);
  font-weight: bold;
  letter-spacing: 2px;
  transition: color var(--transition-speed) ease;
}

.password-hint {
  color: var(--password-hint-color);
  transition: color var(--transition-speed) ease;
}

.error-text {
  color: var(--error-text-color);
  transition: color var(--transition-speed) ease;
}

.empty-state {
  color: var(--empty-state-color);
  transition: color var(--transition-speed) ease;
}

/* Scoped styles for the users component */
:deep(.v-data-table-header th) {
  font-weight: 500 !important;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.025em;
}
</style>