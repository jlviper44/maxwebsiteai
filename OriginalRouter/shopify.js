/**
 * Shopify store management functionality
 */

/**
 * Render Shopify stores list
 */
async function renderShopifyStoresList() {
  try {
    const stores = await fetchShopifyStores();
    const csrfToken = await generateCsrfToken();
    
    let storesContent = '';
    
    if (stores.length === 0) {
      storesContent = `
        <div class="empty-state">
          <p>No Shopify stores found. Add your first store to get started.</p>
        </div>
      `;
    } else {
      storesContent = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Store Name</th>
              <th>URL</th>
              <th>Status</th>
              <th>Pages</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${stores.map(store => `
              <tr>
                <td>${store.name}</td>
                <td>${store.url}</td>
                <td>
                  <span class="status-badge ${store.active ? 'active' : 'inactive'}">
                    ${store.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>${store.pageCount || 0}</td>
                <td>
                  <div class="action-buttons">
                    <a href="/shopify/edit?id=${store.id}" class="action-btn edit-btn">Edit</a>
                    <a href="/shopify/test?id=${store.id}" class="action-btn stats-btn">Test</a>
                    <a href="/shopify/delete?id=${store.id}" class="action-btn delete-btn">Delete</a>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    return renderPage('Shopify Stores', `
      <div class="button-group">
        <a href="/shopify/add" class="button">Add Shopify Store</a>
      </div>
      
      <div class="card">
        <h2>Your Shopify Stores</h2>
        ${storesContent}
      </div>
      
      <div class="alert alert-info">
        <strong>Note:</strong> Each campaign will be assigned to a specific Shopify store where a TikTok landing page will be created.
        The system will automatically create pages that detect and route TikTok traffic to your affiliate offers.
      </div>
    `);
  } catch (error) {
    console.error('Error rendering Shopify stores list:', error);
    return renderErrorPage(`Error: ${error.message}`, 500);
  }
}

/**
 * Handle Shopify store test
 */
async function handleShopifyStoreTest(request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get('id');
  
  if (!storeId) {
    return Response.redirect('/shopify', 302);
  }
  
  try {
    // Test store via Shopify API Worker
    const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/test?id=${storeId}`, {
      headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Store test failed: ${errorText}`);
    }
    
    const responseData = await response.json();
    const shop = responseData.shop;
    
    // Get store data
    const storeResponse = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/get?id=${storeId}`, {
      headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
    });
    
    if (!storeResponse.ok) {
      throw new Error('Failed to get store details');
    }
    
    const storeData = await storeResponse.json();
    const store = storeData.store;
    
    return renderPage('Test Results', `
      <div class="card">
        <h2>Shopify Store Test Results: ${store.name}</h2>
        
        <div class="alert alert-success">
          <strong>Connection Successful!</strong> Successfully connected to the Shopify store.
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Store Name</div>
          <div class="detail-value">${shop.name}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Store URL</div>
          <div class="detail-value">${store.url}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Shop ID</div>
          <div class="detail-value">${shop.id}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Shop Plan</div>
          <div class="detail-value">${shop.plan_name}</div>
        </div>
        
        <div class="detail-group">
          <div class="detail-label">Shop Country</div>
          <div class="detail-value">${shop.country_name}</div>
        </div>
        
        <a href="/shopify" class="back-link">← Back to Shopify Stores</a>
      </div>
    `);
  } catch (error) {
    console.error('Error testing Shopify store:', error);
    return renderErrorPage(`Error testing Shopify store: ${error.message}`, 500);
  }
}

/**
 * Fetch all Shopify stores from the Shopify API Worker
 */
async function fetchShopifyStores() {
  try {
    const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/list`, {
      headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch stores: ${errorText}`);
    }
    
    const responseData = await response.json();
    return responseData.stores || [];
  } catch (error) {
    console.error('Error fetching Shopify stores:', error);
    return [];
  }
}

/**
 * Handle Shopify store addition - with fixed redirect
 */
async function handleShopifyStoreAdd(request) {
  // Show form for GET request
  if (request.method !== 'POST') {
    try {
      const csrfToken = await generateCsrfToken();
      
      return renderPage('Add Shopify Store', `
        <div class="card">
          <h2>Add New Shopify Store</h2>
          
          <form action="/shopify/add" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <div class="form-group">
              <label for="storeName">Store Name</label>
              <input type="text" id="storeName" name="storeName" class="input-full" required>
              <div class="form-hint">A descriptive name for your store.</div>
            </div>
            
            <div class="form-group">
              <label for="storeUrl">Store URL</label>
              <input type="url" id="storeUrl" name="storeUrl" class="input-full" required placeholder="https://your-store.myshopify.com">
              <div class="form-hint">The URL of your Shopify store.</div>
            </div>
            
            <div class="form-group">
              <label for="apiKey">API Key</label>
              <input type="text" id="apiKey" name="apiKey" class="input-full" required>
              <div class="form-hint">The API key from your Shopify private app.</div>
            </div>
            
            <div class="form-group">
              <label for="apiSecret">API Secret</label>
              <input type="password" id="apiSecret" name="apiSecret" class="input-full" required>
              <div class="form-hint">The API secret from your Shopify private app.</div>
            </div>
            
            <div class="form-group">
              <label for="accessToken">Access Token</label>
              <input type="password" id="accessToken" name="accessToken" class="input-full" required>
              <div class="form-hint">The access token from your Shopify private app.</div>
            </div>
            
            <div class="form-check">
              <input type="checkbox" id="active" name="active" checked>
              <label for="active">Store Active</label>
              <div class="form-hint">When unchecked, this store will not be available for campaigns.</div>
            </div>
            
            <div class="form-info">
              <strong>Note:</strong> You need to create a private app in your Shopify store with access to the following scopes:
              <ul>
                <li>read_products</li>
                <li>write_content</li>
              </ul>
            </div>
            
            <div class="button-group">
              <button type="submit" class="button">Add Shopify Store</button>
              <a href="/shopify" class="back-link">← Cancel</a>
            </div>
          </form>
        </div>
      `);
    } catch (error) {
      console.error('Error rendering add store form:', error);
      return renderErrorPage(`Error: ${error.message}`, 500);
    }
  }
  
  // Handle form submission
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Get form data
    const storeData = {
      name: formData.get('storeName'),
      url: formData.get('storeUrl'),
      apiKey: formData.get('apiKey'),
      apiSecret: formData.get('apiSecret'),
      accessToken: formData.get('accessToken'),
      active: formData.has('active')
    };
    
    // Add store via Shopify API Worker
    const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.API_KEYS.SHOPIFY
      },
      body: JSON.stringify(storeData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add store: ${errorText}`);
    }
    
    // Fixed redirect
    return Response.redirect(getRedirectUrl(request, '/shopify'), 302);
  } catch (error) {
    console.error('Error adding Shopify store:', error);
    return renderErrorPage(`Error adding Shopify store: ${error.message}`, 500);
  }
}

/**
 * Handle Shopify store edit - with fixed redirect
 */
async function handleShopifyStoreEdit(request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get('id');
  
  if (!storeId) {
    return Response.redirect(getRedirectUrl(request, '/shopify'), 302);
  }
  
  // Show form for GET request
  if (request.method !== 'POST') {
    try {
      // Get store data from Shopify API Worker
      const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/get?id=${storeId}`, {
        headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get store: ${errorText}`);
      }
      
      const responseData = await response.json();
      const store = responseData.store;
      
      if (!store) {
        return renderErrorPage(`Store with ID ${storeId} not found`, 404);
      }
      
      const csrfToken = await generateCsrfToken();
      
      return renderPage('Edit Shopify Store', `
        <div class="card">
          <h2>Edit Shopify Store: ${store.name}</h2>
          
          <form action="/shopify/edit?id=${storeId}" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <div class="form-group">
              <label for="storeName">Store Name</label>
              <input type="text" id="storeName" name="storeName" class="input-full" value="${store.name}" required>
            </div>
            
            <div class="form-group">
              <label for="storeUrl">Store URL</label>
              <input type="url" id="storeUrl" name="storeUrl" class="input-full" value="${store.url}" required>
            </div>
            
            <div class="form-group">
              <label for="apiKey">API Key (leave blank to keep current)</label>
              <input type="text" id="apiKey" name="apiKey" class="input-full" placeholder="Enter new API key to change">
              <div class="form-hint">Leave blank to keep the current API key.</div>
            </div>
            
            <div class="form-group">
              <label for="apiSecret">API Secret (leave blank to keep current)</label>
              <input type="password" id="apiSecret" name="apiSecret" class="input-full" placeholder="Enter new API secret to change">
              <div class="form-hint">Leave blank to keep the current API secret.</div>
            </div>
            
            <div class="form-group">
              <label for="accessToken">Access Token (leave blank to keep current)</label>
              <input type="password" id="accessToken" name="accessToken" class="input-full" placeholder="Enter new access token to change">
              <div class="form-hint">Leave blank to keep the current access token.</div>
            </div>
            
            <div class="form-check">
              <input type="checkbox" id="active" name="active" ${store.active ? 'checked' : ''}>
              <label for="active">Store Active</label>
              <div class="form-hint">When unchecked, this store will not be available for campaigns.</div>
            </div>
            
            <div class="button-group">
              <button type="submit" class="button">Update Shopify Store</button>
              <a href="/shopify" class="back-link">← Cancel</a>
            </div>
          </form>
        </div>
      `);
    } catch (error) {
      console.error('Error rendering edit store form:', error);
      return renderErrorPage(`Error: ${error.message}`, 500);
    }
  }
  
  // Handle form submission
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Get form data
    const storeData = {
      id: storeId,
      name: formData.get('storeName'),
      url: formData.get('storeUrl'),
      active: formData.has('active')
    };
    
    // Add optional fields if provided
    const apiKey = formData.get('apiKey');
    const apiSecret = formData.get('apiSecret');
    const accessToken = formData.get('accessToken');
    
    if (apiKey && apiKey.trim() !== '') storeData.apiKey = apiKey;
    if (apiSecret && apiSecret.trim() !== '') storeData.apiSecret = apiSecret;
    if (accessToken && accessToken.trim() !== '') storeData.accessToken = accessToken;
    
    // Update store via Shopify API Worker
    const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.API_KEYS.SHOPIFY
      },
      body: JSON.stringify(storeData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update store: ${errorText}`);
    }
    
    // Fixed redirect
    return Response.redirect(getRedirectUrl(request, '/shopify'), 302);
  } catch (error) {
    console.error('Error updating Shopify store:', error);
    return renderErrorPage(`Error updating Shopify store: ${error.message}`, 500);
  }
}

/**
 * Handle Shopify store deletion - with fixed redirect
 */
async function handleShopifyStoreDelete(request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get('id');
  
  if (!storeId) {
    return Response.redirect(getRedirectUrl(request, '/shopify'), 302);
  }
  
  // Show confirmation for GET request
  if (request.method !== 'POST') {
    try {
      // Get store data from Shopify API Worker
      const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/get?id=${storeId}`, {
        headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get store: ${errorText}`);
      }
      
      const responseData = await response.json();
      const store = responseData.store;
      
      if (!store) {
        return renderErrorPage(`Store with ID ${storeId} not found`, 404);
      }
      
      // Check if store is used by any campaigns
      const campaigns = await getAllCampaigns();
      const usingCampaigns = campaigns.filter(c => c.shopifyStoreId === storeId);
      
      const csrfToken = await generateCsrfToken();
      
      return renderPage('Delete Shopify Store', `
        <div class="card">
          <h2>Delete Shopify Store</h2>
          
          <div class="alert alert-danger">
            <strong>Warning!</strong> You are about to delete the following Shopify store:
            <p><strong>${store.name}</strong></p>
            <p>This action cannot be undone.</p>
          </div>
          
          ${usingCampaigns.length > 0 ? `
            <div class="alert alert-warning">
              <strong>Caution!</strong> This store is used by ${usingCampaigns.length} campaign(s):
              <ul>
                ${usingCampaigns.map(c => `<li>${c.name}</li>`).join('')}
              </ul>
              <p>Deleting this store will affect these campaigns. You should reassign them to another store first.</p>
            </div>
          ` : ''}
          
          <form action="/shopify/delete?id=${storeId}" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <div class="button-group-centered">
              <button type="submit" class="button delete-button" ${usingCampaigns.length > 0 ? 'disabled' : ''}>Delete Store</button>
              <a href="/shopify" class="back-link">← Cancel</a>
            </div>
          </form>
        </div>
      `);
    } catch (error) {
      console.error('Error rendering delete confirmation:', error);
      return renderErrorPage(`Error: ${error.message}`, 500);
    }
  }
  
  // Handle form submission
  try {
    const formData = await request.formData();
    
    // Validate CSRF token
    const csrfToken = formData.get('csrf_token');
    if (!await validateCsrfToken(csrfToken)) {
      return renderErrorPage('Invalid or expired CSRF token. Please try again.', 403);
    }
    
    // Check if store is used by any campaigns
    const campaigns = await getAllCampaigns();
    const usingCampaigns = campaigns.filter(c => c.shopifyStoreId === storeId);
    
    if (usingCampaigns.length > 0) {
      return renderErrorPage('Cannot delete store. It is used by one or more campaigns.', 409);
    }
    
    // Delete store via Shopify API Worker
    const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/stores/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.API_KEYS.SHOPIFY
      },
      body: JSON.stringify({ id: storeId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete store: ${errorText}`);
    }
    
    // Fixed redirect
    return Response.redirect(getRedirectUrl(request, '/shopify'), 302);
  } catch (error) {
    console.error('Error deleting Shopify store:', error);
    return renderErrorPage(`Error deleting Shopify store: ${error.message}`, 500);
  }
}