/**
 * Shopify API service
 */

/**
 * Fetch all Shopify stores
 */
export async function fetchShopifyStores() {
  const response = await fetch('/api/shopify');
  return await response.json();
}

/**
 * Fetch a specific Shopify store by ID
 */
export async function fetchShopifyStore(id) {
  const response = await fetch(`/api/shopify/detail?id=${id}`);
  return await response.json();
}

/**
 * Test a Shopify store connection
 */
export async function testShopifyStore(id) {
  const response = await fetch(`/api/shopify/test?id=${id}`);
  return await response.json();
}

/**
 * Add a new Shopify store
 */
export async function addShopifyStore(storeData) {
  const response = await fetch('/api/shopify/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(storeData)
  });
  return await response.json();
}

/**
 * Update an existing Shopify store
 */
export async function updateShopifyStore(storeData) {
  const response = await fetch('/api/shopify/edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(storeData)
  });
  return await response.json();
}

/**
 * Delete a Shopify store
 */
export async function deleteShopifyStore(id) {
  const response = await fetch(`/api/shopify/delete?id=${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ storeId: id })
  });
  return await response.json();
}

/**
 * Check if a Shopify store is used by any campaigns
 */
export async function checkShopifyStoreUsage(id) {
  const response = await fetch(`/api/shopify/usage?id=${id}`);
  return await response.json();
}