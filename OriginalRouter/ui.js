/**
 * UI components and rendering
 */

/**
 * Render a base page with consistent layout and dark mode support
 */
async function renderPage(title, content) {
  // Check dark mode preference
  const darkModeEnabled = await SETTINGS.get('darkModeEnabled') === 'true';
  
  return new Response(`
    <!DOCTYPE html>
    <html class="${darkModeEnabled ? 'dark-mode' : ''}">
    <head>
      <title>${title} - TikTok Campaign Admin</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="/admin.css">
      <script src="/admin.js" defer></script>
    </head>
    <body>
      <header>
        <div class="header-container">
          <div class="logo">
            <a href="/">TikTok Campaign Admin</a>
          </div>
          <nav>
            <ul>
              <li><a href="/">Dashboard</a></li>
              <li><a href="/campaigns">Campaigns</a></li>
              <li><a href="/templates">Templates</a></li>
              <li><a href="/shopify">Shopify Stores</a></li>
              <li><a href="/settings">Settings</a></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <div class="container">
        <h1>${title}</h1>
        
        ${content}
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Render an error page
 */
function renderErrorPage(message, status = 500) {
  return renderPage(`Error ${status}`, `
    <div class="card">
      <h2>Error</h2>
      <p>${message}</p>
      <a href="/" class="back-link">← Back to Dashboard</a>
    </div>
  `);
}

/**
 * Creates a properly formatted absolute URL for redirects
 */
function getRedirectUrl(request, path) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  return `${baseUrl}${path}`;
}

/**
 * Create a JSON response
 */
function createJsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Generate a UUID
 */
function generateUUID() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

/**
 * Generate a random string
 */
function generateRandomString(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}