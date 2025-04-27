/**
 * System initialization functionality
 */

/**
 * Initialize system with dark mode support
 */
async function initializeSystem() {
  try {
    // Initialize settings
    await SETTINGS.put('tikTokRoutingEnabled', 'true');
    await SETTINGS.put('darkModeEnabled', 'false'); // Default to light mode
    
    // Test KV namespaces
    try {
      await CAMPAIGNS.put('test', 'ok');
      await TEMPLATES.put('test', 'ok');
      await SETTINGS.put('test', 'ok');
    } catch (kvError) {
      return renderErrorPage(`KV initialization error: ${kvError.message}`, 500);
    }
    
    // Initialize Shopify API Worker
    try {
      const response = await fetch(`${CONFIG.WORKER_URLS.SHOPIFY}/api/init`, {
        headers: { 'X-API-Key': CONFIG.API_KEYS.SHOPIFY }
      });
      
      if (!response.ok) {
        throw new Error(`Shopify API initialization failed: ${await response.text()}`);
      }
    } catch (shopifyError) {
      return renderErrorPage(`Shopify API initialization error: ${shopifyError.message}`, 500);
    }
    
    // Initialize Router Worker
    try {
      const response = await fetch(`${CONFIG.WORKER_URLS.ROUTER}/api/init`, {
        headers: { 'X-API-Key': CONFIG.API_KEYS.ROUTER }
      });
      
      if (!response.ok) {
        throw new Error(`Router initialization failed: ${await response.text()}`);
      }
    } catch (routerError) {
      return renderErrorPage(`Router initialization error: ${routerError.message}`, 500);
    }
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>System Initialized</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/admin.css">
      </head>
      <body>
        <div class="container">
          <h1>System Initialized Successfully</h1>
          
          <div class="card">
            <h2>Initialization Complete</h2>
            <p>The TikTok Campaign System has been successfully initialized.</p>
            <a href="/" class="button">Go to Dashboard</a>
          </div>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Error in initialization:', error);
    return renderErrorPage(`Error initializing system: ${error.message}`, 500);
  }
}