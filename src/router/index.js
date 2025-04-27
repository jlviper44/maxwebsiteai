import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import CampaignsView from '@/views/Campaigns/CampaignsView.vue'
import CampaignStats from '@/views/Campaigns/CampaignStats.vue'
import CampaignForm from '@/views/Campaigns/CampaignForm.vue'
import Metrics from '@/views/Metrics/Metrics.vue'
import Settings from '@/views/Settings/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard
  },
  {
    path: '/campaigns',
    name: 'campaigns',
    component: CampaignsView
  },
  {
    path: '/campaigns/create',
    name: 'campaign-create',
    component: CampaignForm
  },
  {
    path: '/campaigns/edit/:id',
    name: 'campaign-edit',
    component: CampaignForm
  },
  {
    path: '/campaigns/stats/:id',
    name: 'campaign-stats',
    component: CampaignStats
  },
  {
    path: '/metrics',
    name: 'metrics',
    component: Metrics
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router