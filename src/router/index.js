import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import CampaignsView from '@/views/Campaigns/CampaignsView.vue'
import CampaignStats from '@/views/Campaigns/CampaignStats.vue'
import CampaignForm from '@/views/Campaigns/CampaignForm.vue'
import TemplatesView from '@/views/Templates/TemplatesView.vue'
import TemplateForm from '@/views/Templates/TemplateForm.vue'
import ShopifyStoresView from '@/views/Shopify/ShopifyStoresView.vue'
import ShopifyStoreForm from '@/views/Shopify/ShopifyStoreForm.vue'
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
    path: '/templates',
    name: 'templates',
    component: TemplatesView
  },
  {
    path: '/templates/create',
    name: 'template-create',
    component: TemplateForm
  },
  {
    path: '/templates/edit/:id',
    name: 'template-edit',
    component: TemplateForm
  },
  {
    path: '/shopify',
    name: 'shopify',
    component: ShopifyStoresView
  },
  {
    path: '/shopify/add',
    name: 'shopify-add',
    component: ShopifyStoreForm
  },
  {
    path: '/shopify/edit/:id',
    name: 'shopify-edit',
    component: ShopifyStoreForm
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