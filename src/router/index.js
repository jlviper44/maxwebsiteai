import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/metrics',
      name: 'metrics',
      // Lazy load this route
      component: () => import('../views/Metrics/Metrics.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      // Lazy load this route
      component: () => import('../views/Settings/Settings.vue')
    }
  ]
})

export default router