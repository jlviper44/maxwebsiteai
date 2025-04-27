/**
 * Asset serving functionality
 */

/**
 * Serve admin CSS
 */
function serveAdminCSS() {
  const css = `
    /* CSS Variables for theming */
    :root {
      --bg-main: #f5f7fa;
      --bg-card: #ffffff;
      --bg-secondary: #f8f9fa;
      --text-main: #333333;
      --text-secondary: #7f8c8d;
      --border-color: #ecf0f1;
      --input-border: #dddddd;
      --input-focus: #3498db;
      --primary: #3498db;
      --primary-hover: #2980b9;
      --success: #27ae60;
      --danger: #e74c3c;
      --warning: #f39c12;
      --info: #3498db;
      --header-bg: #2c3e50;
      --header-text: #ffffff;
      --shadow-color: rgba(0,0,0,0.1);
    }
    
    /* Dark mode variables */
    .dark-mode {
      --bg-main: #1a1a1a;
      --bg-card: #2c2c2c;
      --bg-secondary: #242424;
      --text-main: #e0e0e0;
      --text-secondary: #a0a0a0;
      --border-color: #3a3a3a;
      --input-border: #3a3a3a;
      --input-focus: #3498db;
      --shadow-color: rgba(0,0,0,0.4);
    }
    
    /* Base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-main);
      background-color: var(--bg-main);
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* Header */
    header {
      background-color: var(--header-bg);
      color: var(--header-text);
      padding: 10px 0;
      margin-bottom: 20px;
    }
    
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    .logo {
      font-weight: bold;
      font-size: 24px;
    }
    
    .logo a {
      color: var(--header-text);
      text-decoration: none;
    }
    
    nav ul {
      list-style: none;
      display: flex;
    }
    
    nav li {
      margin-left: 20px;
    }
    
    nav a {
      color: #ecf0f1;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.3s;
    }
    
    nav a:hover {
      color: var(--primary);
    }
    
    /* Cards */
    .card {
      background-color: var(--bg-card);
      border-radius: 5px;
      box-shadow: 0 2px 5px var(--shadow-color);
      padding: 20px;
      margin-bottom: 20px;
      transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }
    
    .card h2 {
      margin-top: 0;
      color: var(--text-main);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    
    /* Grid Layout */
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    
    @media (max-width: 768px) {
      .grid-2, .grid-3 {
        grid-template-columns: 1fr;
      }
    }
    
    /* Buttons */
    .button {
      display: inline-block;
      background-color: var(--primary);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 14px;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .button:hover {
      background-color: var(--primary-hover);
    }
    
    .button-full {
      display: block;
      width: 100%;
      text-align: center;
      padding: 10px;
    }
    
    .delete-button {
      background-color: var(--danger);
    }
    
    .delete-button:hover {
      background-color: #c0392b;
    }
    
    /* Forms */
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: var(--text-main);
    }
    /* Forms (continued) */
    .input-full, select, textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--input-border);
      border-radius: 4px;
      box-sizing: border-box;
      font-family: inherit;
      font-size: inherit;
      background-color: var(--bg-secondary);
      color: var(--text-main);
      transition: border-color 0.3s, background-color 0.3s, color 0.3s;
    }
    
    .input-full:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--input-focus);
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.25);
    }
    
    .form-check {
      margin-bottom: 15px;
    }
    
    .form-check label {
      display: inline;
      margin-left: 5px;
    }
    
    /* Toggle Switch */
    .toggle-label {
      display: flex;
      align-items: center;
      font-weight: bold;
      color: var(--text-main);
    }

    /* Toggle Switch Styles */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
      margin: 0 10px;
    }
    
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 24px;
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    
    input:checked + .slider {
      background-color: var(--primary);
    }
    
    input:checked + .slider:before {
      transform: translateX(26px);
    }
    
    .status-text {
      font-size: 12px;
      font-weight: bold;
    }
    
    .status-text.enabled {
      color: var(--success);
    }
    
    .status-text.disabled {
      color: var(--danger);
    }
    
    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .data-table th,
    .data-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    
    .data-table th {
      background-color: var(--bg-secondary);
      font-weight: bold;
    }
    
    .data-table tr:hover {
      background-color: var(--bg-secondary);
    }
    
    /* Status Indicators */
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .status-badge.active {
      background-color: var(--success);
      color: white;
    }
    
    .status-badge.inactive {
      background-color: var(--danger);
      color: white;
    }
    
    /* Stats Display */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
      margin: 15px 0;
    }
    
    .stats-item {
      background-color: var(--bg-secondary);
      border-radius: 4px;
      padding: 15px;
      text-align: center;
      border: 1px solid var(--border-color);
    }
    
    .stats-value {
      font-size: 32px;
      font-weight: bold;
      color: var(--primary);
    }
    
    .stats-label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 5px;
    }
    
    /* Action Cards */
    .action-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .action-card .button {
      margin-top: auto;
    }
    
    /* Action Buttons in Tables */
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    
    .action-btn {
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      text-decoration: none;
      color: white;
      cursor: pointer;
    }
    
    .edit-btn {
      background-color: var(--primary);
    }
    
    .stats-btn {
      background-color: var(--warning);
    }
    
    .delete-btn {
      background-color: var(--danger);
    }
    
    /* Link Actions Styles */
    .link-actions {
      display: flex;
      gap: 10px;
    }
    
    .link-actions .action-btn {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      text-align: center;
      color: white;
      background-color: var(--primary);
      cursor: pointer;
      transition: background-color 0.2s, opacity 0.2s;
    }
    
    .link-actions .copy-url {
      background-color: var(--success);
    }
    
    .link-actions .refresh-link {
      background-color: var(--warning);
    }
    
    .link-actions .action-btn:hover {
      opacity: 0.8;
    }
    
    .link-actions .action-btn.disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    /* Alerts */
    .alert {
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    
    .alert-danger {
      background-color: rgba(231, 76, 60, 0.1);
      border: 1px solid var(--danger);
      color: var(--danger);
    }
    
    .alert-warning {
      background-color: rgba(241, 196, 15, 0.1);
      border: 1px solid var(--warning);
      color: var(--warning);
    }
    
    .alert-success {
      background-color: rgba(46, 204, 113, 0.1);
      border: 1px solid var(--success);
      color: var(--success);
    }
    
    .alert-info {
      background-color: rgba(52, 152, 219, 0.1);
      border: 1px solid var(--info);
      color: var(--info);
    }
    
    /* Misc */
    .empty-state {
      background-color: var(--bg-secondary);
      border-radius: 4px;
      padding: 20px;
      text-align: center;
      color: var(--text-secondary);
    }
    
    .section-divider {
      margin: 20px 0;
      border-top: 1px solid var(--border-color);
      padding-top: 10px;
    }
    
    .regions-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    
    .back-link {
      display: inline-block;
      margin-top: 10px;
      color: var(--primary);
      text-decoration: none;
    }
    
    /* Toast notifications */
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }
    
    .toast {
      background-color: var(--header-bg);
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      margin-bottom: 10px;
      box-shadow: 0 3px 6px var(--shadow-color);
      animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
      opacity: 0;
      max-width: 300px;
    }
    
    .toast.success {
      background-color: var(--success);
    }
    
    .toast.error {
      background-color: var(--danger);
    }
    
    .toast.info {
      background-color: var(--info);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-20px); }
    }
    
    /* Template specific styles */
    .template-type {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .template-type.html {
      background-color: var(--primary);
      color: white;
    }
    
    .template-type.googleform {
      background-color: var(--success);
      color: white;
    }
    
    /* Chart styles - with dark mode support */
    .chart-container {
      margin: 20px 0;
    }
    
    .chart {
      width: 100%;
      background-color: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .chart-bar {
      height: 40px;
      line-height: 40px;
      color: white;
      padding: 0 10px;
      position: relative;
      min-width: 40px;
    }
    
    .tiktok-bar {
      background-color: var(--primary);
    }
    
    .non-tiktok-bar {
      background-color: var(--danger);
    }
    .geo-link-row {
      display: flex;
      flex-direction: column;
      margin-bottom: 15px;
      padding: 15px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background-color: var(--bg-secondary);
    }
    
    .geo-link-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .geo-link-header label {
      margin-left: 8px;
      font-weight: bold;
      color: var(--text-main);
    }
    
    .geo-link-input {
      margin-top: 5px;
    }
  `;
  
  return new Response(css, {
    headers: { 'Content-Type': 'text/css' }
  });
}

/**
 * Serve admin JavaScript with dark mode toggle support
 */
function serveAdminJS() {
  const js = `
    // Client-side JavaScript for the admin panel
    document.addEventListener('DOMContentLoaded', function() {
      // Create toast notification container
      const toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
      
      // Show toast notification function
      function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        // Trigger animation and make visible
        setTimeout(() => {
          toast.style.opacity = '1';
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => {
            toast.remove();
          }, 300);
        }, duration);
      }
      
      // Copy URL to clipboard functionality
      const copyButtons = document.querySelectorAll('.copy-url');
      if (copyButtons) {
        copyButtons.forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('data-url');
            if (!url) {
              showToast('No URL available to copy', 'error');
              return;
            }
            
            navigator.clipboard.writeText(url).then(() => {
              // Change button text temporarily
              const originalText = this.textContent;
              this.textContent = 'Copied!';
              
              // Show toast notification
              showToast('URL copied to clipboard!', 'success');
              
              setTimeout(() => {
                this.textContent = originalText;
              }, 2000);
            }).catch(err => {
              console.error('Could not copy text: ', err);
              showToast('Failed to copy URL', 'error');
            });
          });
        });
      }
      
      // Refresh link functionality
      const refreshButtons = document.querySelectorAll('.refresh-link');
      if (refreshButtons) {
        refreshButtons.forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            const campaignId = this.getAttribute('data-campaign-id');
            if (!campaignId) {
              showToast('Campaign ID is missing', 'error');
              return;
            }
            
            // Show loading state
            const originalText = this.textContent;
            this.textContent = 'Refreshing...';
            this.classList.add('disabled');
            
            // Create CSRF token data
            let csrfToken = '';
            const csrfMeta = document.querySelector('meta[name="csrf-token"]');
            if (csrfMeta) {
              csrfToken = csrfMeta.getAttribute('content');
            }
            
            // Send request to refresh the link
            fetch(\`/campaigns/refresh-link?id=\${campaignId}\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
              },
              body: JSON.stringify({ csrf_token: csrfToken })
            })
            .then(response => {
              if (!response.ok) {
                return response.text().then(text => {
                  try {
                    // Try to parse as JSON first
                    return Promise.reject(JSON.parse(text));
                  } catch (e) {
                    // If not JSON, return text error
                    return Promise.reject(new Error(text || 'Network response was not ok'));
                  }
                });
              }
              return response.json();
            })
            .then(data => {
              if (data.success) {
                // Update the copy button URL
                const copyButton = this.parentNode.querySelector('.copy-url');
                if (copyButton) {
                  copyButton.setAttribute('data-url', data.newUrl);
                }
                
                // Show success state
                this.textContent = 'Done!';
                
                // Show toast notification
                showToast('Campaign link refreshed successfully!', 'success');
                
                setTimeout(() => {
                  this.textContent = originalText;
                  this.classList.remove('disabled');
                }, 2000);
              } else {
                throw new Error(data.error || 'Unknown error occurred');
              }
            })
            .catch(error => {
              console.error('Error refreshing link:', error);
              
              let errorMessage = 'Error refreshing link';
              if (error.error) {
                errorMessage += ': ' + error.error;
              } else if (error.message) {
                errorMessage += ': ' + error.message;
              }
              
              this.textContent = 'Error';
              
              // Show error toast
              showToast(errorMessage, 'error');
              
              setTimeout(() => {
                this.textContent = originalText;
                this.classList.remove('disabled');
              }, 2000);
            });
          });
        });
      }
      
      // Direct delete handling (no double confirmation)
      const deleteButtons = document.querySelectorAll('.delete-btn');
      if (deleteButtons) {
        deleteButtons.forEach(btn => {
          btn.addEventListener('click', function(e) {
            if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
              e.preventDefault();
            }
            // If confirmed, it will navigate to the delete URL which will create and submit a form
          });
        });
      }
      
      // Toggle elements based on selection
      document.querySelectorAll('[data-toggle-target]').forEach(element => {
        element.addEventListener('change', function() {
          const targetId = this.getAttribute('data-toggle-target');
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            if (this.type === 'checkbox') {
              targetElement.style.display = this.checked ? 'block' : 'none';
            } else if (this.type === 'select-one') {
              const showValue = this.getAttribute('data-toggle-value');
              targetElement.style.display = this.value === showValue ? 'block' : 'none';
            }
          }
        });
        // Trigger change event to set initial state
        element.dispatchEvent(new Event('change'));
      });
      
      // Dark mode toggle functionality
      const darkModeToggle = document.getElementById('darkModeToggle');
      if (darkModeToggle) {
        // Apply dark mode based on toggle state
        darkModeToggle.addEventListener('change', function() {
          document.documentElement.classList.toggle('dark-mode', this.checked);
          
          // Update text next to toggle
          const statusText = this.parentNode.parentNode.querySelector('.status-text');
          if (statusText) {
            if (this.checked) {
              statusText.textContent = 'Enabled';
              statusText.classList.remove('disabled');
              statusText.classList.add('enabled');
            } else {
              statusText.textContent = 'Disabled';
              statusText.classList.remove('enabled');
              statusText.classList.add('disabled');
            }
          }
          
          // No need to save the setting here as it's part of a form that will be submitted
        });
      }
    });
  `;
  
  return new Response(js, {
    headers: { 'Content-Type': 'application/javascript' }
  });
}