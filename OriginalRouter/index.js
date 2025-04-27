// Import all modules
importScripts('./config.js');
importScripts('./auth.js');
importScripts('./db.js');
importScripts('./ui.js');
importScripts('./init.js');
importScripts('./dashboard.js');
importScripts('./campaigns.js');
importScripts('./templates.js');
importScripts('./shopify.js');
importScripts('./settings.js');
importScripts('./assets.js');

// Initialize the main event listener
addEventListener('fetch', event => {
  event.respondWith(
    handleRequest(event.request)
      .catch(err => {
        console.error('Unhandled error:', err);
        return renderErrorPage(`Server Error: ${err.message}`, 500);
      })
  );
});