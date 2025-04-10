<template>
  <div>
    <h2 class="text-h5 mb-4">Users Management</h2>
    
    <!-- Users List Table -->
    <v-card class="mb-4">
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Users List</span>
        <v-btn color="primary" @click="showAddDialog">
          <v-icon left>mdi-plus</v-icon>
          Add User
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="users"
          :loading="loading"
          class="elevation-1"
        >
          <template v-slot:item.actions="{ item }">
            <v-icon 
              small 
              class="mr-2" 
              @click="editItem(item)"
            >
              mdi-pencil
            </v-icon>
            <v-icon 
              small 
              @click="deleteItem(item)"
            >
              mdi-delete
            </v-icon>
          </template>
          <template v-slot:item.Permissions="{ item }">
            <div>
              <v-chip
                v-for="(permission, index) in item.Permissions.split(',')"
                :key="index"
                size="small"
                class="mr-1 mb-1"
              >
                {{ permission }}
              </v-chip>
            </div>
          </template>
          <template v-slot:item.Password="{ item }">
            <span>••••••••</span>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- User Form Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span>{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.Name"
                    label="Name"
                    :rules="nameRules"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.Username"
                    label="Username"
                    :rules="usernameRules"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.Password"
                    label="Password"
                    :type="showPassword ? 'text' : 'password'"
                    :rules="passwordRules"
                    :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append="showPassword = !showPassword"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="editedItem.Permissions"
                    :items="permissionOptions"
                    label="Permissions"
                    multiple
                    chips
                    deletable-chips
                    required
                  ></v-select>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="close">
            Cancel
          </v-btn>
          <v-btn color="blue darken-1" text @click="save" :disabled="!valid">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">
          Delete User
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this user? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn color="red darken-1" text @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="3000"
    >
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="snackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';

// Table headers
const headers = [
  { text: 'ID', value: 'ID', sortable: true },
  { text: 'Name', value: 'Name', sortable: true },
  { text: 'Username', value: 'Username', sortable: true },
  { text: 'Password', value: 'Password', sortable: false },
  { text: 'Permissions', value: 'Permissions', sortable: true },
  { text: 'Actions', value: 'actions', sortable: false },
];

// Data
const users = ref([]);
const loading = ref(true);
const dialog = ref(false);
const deleteDialog = ref(false);
const valid = ref(true);
const showPassword = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
const editedIndex = ref(-1);
const permissionOptions = ref([]);

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
  }
};

const confirmDelete = async () => {
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
  }
};

const showSnackbar = (text, color = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
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
.v-data-table-header th {
  font-weight: bold !important;
}
</style>