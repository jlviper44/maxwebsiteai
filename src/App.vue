<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      app
      permanent
    >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-h6">
            Campaign Manager
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list
        density="compact"
        nav
      >
        <v-list-item v-for="item in menuItems" :key="item.title" :to="item.path" link>
          <template v-slot:prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app>
      <v-app-bar-title>{{ currentRouteName }}</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>mdi-bell</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>mdi-account</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router'
import { ref, computed } from 'vue'

const drawer = ref(true)
const route = useRoute()

const menuItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', path: '/' },
  { title: 'Campaigns', icon: 'mdi-bullhorn', path: '/campaigns' },
  { title: 'Metrics', icon: 'mdi-chart-bar', path: '/metrics' },
  { title: 'Settings', icon: 'mdi-cog', path: '/settings' }
]

const currentRouteName = computed(() => {
  if (route.name === 'campaigns') return 'Campaigns';
  if (route.name === 'campaign-create') return 'Create Campaign';
  if (route.name === 'campaign-edit') return 'Edit Campaign';
  if (route.name === 'campaign-stats') return 'Campaign Statistics';
  return route.name?.toString().charAt(0).toUpperCase() + route.name?.toString().slice(1) || 'Dashboard';
})
</script>

<style scoped>
/* You can keep or modify your existing styles here */
</style>