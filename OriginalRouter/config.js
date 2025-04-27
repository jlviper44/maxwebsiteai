/**
 * Configuration settings for the Admin Panel
 */

const CONFIG = {
  // Admin credentials
  ADMIN: {
    USERNAME: 'admin',
    PASSWORD: 'securepassword'  // Change this to a strong password
  },
  
  // API keys for worker communication
  API_KEYS: {
    ROUTER: 'your-router-api-key',
    SHOPIFY: 'your-shopify-api-key'
  },
  
  // Worker URLs
  WORKER_URLS: {
    ROUTER: 'https://shopifyrouter.millianfreakyads.workers.dev',
    SHOPIFY: 'https://shopifyapi.millianfreakyads.workers.dev'
  },
  
  // Available regions for targeting
  REGIONS: ['US', 'CA', 'GB', 'AU']
};