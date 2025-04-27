/**
 * Template management functionality
 */

/**
 * Render the templates list page
 */
async function renderTemplatesList() {
  try {
    const templates = await getAllTemplates();
    const csrfToken = await generateCsrfToken();
    
    let templatesContent = '';
    
    if (templates.length === 0) {
      templatesContent = `
        <div class="empty-state">
          <p>No templates found. Create your first template to get started.</p>
        </div>
      `;
    } else {
      templatesContent = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${templates.map(template => {
              const createdDate = template.created ? new Date(template.created).toLocaleDateString() : 'Unknown';
              const updatedDate = template.updated ? new Date(template.updated).toLocaleDateString() : 'Unknown';
              
              return `
                <tr>
                  <td>${template.name}</td>
                  <td>
                    <span class="template-type ${template.type}">
                      ${template.type === 'html' ? 'HTML Template' : 'Google Form'}
                    </span>
                  </td>
                  <td>${createdDate}</td>
                  <td>${updatedDate}</td>
                  <td>
                    <div class="action-buttons">
                      <a href="/templates/edit?id=${template.id}" class="action-btn edit-btn">Edit</a>
                      <a href="/templates/delete?id=${template.id}" class="action-btn delete-btn">Delete</a>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
    
    return renderPage('Templates', `
      <div class="button-group">
        <a href="/templates/create" class="button">Create New Template</a>
      </div>
      
      <div class="card">
        <h2>Your Templates</h2>
        ${templatesContent}
      </div>
      
      <div class="template-info-cards">
        <div class="card template-info-card">
          <h3>HTML Templates</h3>
          <p>Create custom HTML templates for your TikTok traffic. You can use the <code>{{affiliate_link}}</code> placeholder in your template to insert your affiliate link.</p>
          <p>The template will be shown to TikTok users when they visit your campaign link.</p>
        </div>
        
        <div class="card template-info-card">
          <h3>Google Form Redirects</h3>
          <p>Use an existing Google Form as your landing page. We'll automatically add a button to redirect users to your affiliate link.</p>
          <p>This is perfect for lead generation or when you want to collect user information.</p>
        </div>
      </div>
      
      <style>
        .template-type {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .template-type.html {
          background-color: #3498db;
          color: white;
        }
        
        .template-type.googleform {
          background-color: #27ae60;
          color: white;
        }
        
        .template-info-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }
        
        .template-info-card {
          background-color: #f8f9fa;
        }
        
        @media (max-width: 768px) {
          .template-info-cards {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `);
  } catch (error) {
    console.error('Error rendering templates list:', error);
    return renderErrorPage(`Error: ${error.message}`, 500);
  }
}

/**
 * Handle template creation - with fixed redirect
 */
async function handleTemplateCreate(request) {
  // Show form for GET request
  if (request.method !== 'POST') {
    try {
      const csrfToken = await generateCsrfToken();
      
      return renderPage('Create Template', `
        <div class="card">
          <h2>Create New Template</h2>
          
          <form action="/templates/create" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <div class="form-group">
              <label for="templateName">Template Name</label>
              <input type="text" id="templateName" name="templateName" class="input-full" required>
              <div class="form-hint">A descriptive name for your template.</div>
            </div>
            
            <div class="form-group">
              <label for="templateType">Template Type</label>
              <select id="templateType" name="templateType" class="input-full" required>
                <option value="html">HTML Template</option>
                <option value="googleform">Google Form Redirect</option>
              </select>
              <div class="form-hint">Select the type of template you want to create.</div>
            </div>
            
            <div id="htmlContentField" class="form-group">
              <label for="htmlContent">HTML Content</label>
              <textarea id="htmlContent" name="htmlContent" class="input-full" rows="15"></textarea>
              <div class="form-hint">
                Enter your HTML content here. You can use {{affiliate_link}} placeholder for the affiliate link.
              </div>
            </div>
            
            <div id="googleFormField" class="form-group" style="display: none;">
              <label for="googleFormUrl">Google Form URL</label>
              <input type="url" id="googleFormUrl" name="googleFormUrl" class="input-full" placeholder="https://forms.gle/...">
              <div class="form-hint">Enter the URL of your Google Form.</div>
            </div>
            
            <div class="button-group">
              <button type="submit" class="button">Create Template</button>
              <a href="/templates" class="back-link">← Cancel</a>
            </div>
          </form>
        </div>
        
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            // Toggle fields based on template type
            const templateTypeSelect = document.getElementById('templateType');
            const htmlContentField = document.getElementById('htmlContentField');
            const googleFormField = document.getElementById('googleFormField');
            
            function updateFields() {
              const value = templateTypeSelect.value;
              if (value === 'html') {
                htmlContentField.style.display = 'block';
                googleFormField.style.display = 'none';
              } else if (value === 'googleform') {
                htmlContentField.style.display = 'none';
                googleFormField.style.display = 'block';
              }
            }
            
            templateTypeSelect.addEventListener('change', updateFields);
            updateFields(); // Initial state
          });
        </script>
      `);
    } catch (error) {
      console.error('Error rendering template creation form:', error);
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
    const name = formData.get('templateName');
    const type = formData.get('templateType');
    
    // Validate based on type
    if (type === 'html') {
      const htmlContent = formData.get('htmlContent');
      if (!htmlContent || htmlContent.trim() === '') {
        return renderErrorPage('HTML content is required for HTML templates.', 400);
      }
      
      // Create template
      const templateId = generateUUID();
      const template = {
        id: templateId,
        name,
        type,
        created: Date.now(),
        updated: Date.now()
      };
      
      // Save template metadata
      await TEMPLATES.put(`template:${templateId}`, JSON.stringify(template));
      
      // Save template content separately
      await TEMPLATES.put(`template:${templateId}:content`, htmlContent);
      
    } else if (type === 'googleform') {
      const url = formData.get('googleFormUrl');
      if (!url || url.trim() === '') {
        return renderErrorPage('Google Form URL is required for Google Form redirects.', 400);
      }
      
      // Create template
      const templateId = generateUUID();
      const template = {
        id: templateId,
        name,
        type,
        url,
        created: Date.now(),
        updated: Date.now()
      };
      
      // Save template metadata
      await TEMPLATES.put(`template:${templateId}`, JSON.stringify(template));
      
    } else {
      return renderErrorPage('Invalid template type.', 400);
    }
    
    // Fixed redirect
    return Response.redirect(getRedirectUrl(request, '/templates'), 302);
  } catch (error) {
    console.error('Error creating template:', error);
    return renderErrorPage(`Error creating template: ${error.message}`, 500);
  }
}

/**
 * Handle template editing - with fixed redirect
 */
async function handleTemplateEdit(request) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get('id');
  
  if (!templateId) {
    return Response.redirect(getRedirectUrl(request, '/templates'), 302);
  }
  
  // Get the template
  const template = await getTemplate(templateId);
  
  if (!template) {
    return renderErrorPage(`Template with ID ${templateId} not found`, 404);
  }
  
  // Show form for GET request
  if (request.method !== 'POST') {
    try {
      const csrfToken = await generateCsrfToken();
      
      // Get template content if it's an HTML template
      let htmlContent = '';
      if (template.type === 'html') {
        htmlContent = await TEMPLATES.get(`template:${templateId}:content`) || '';
      }
      
      return renderPage('Edit Template', `
        <div class="card">
          <h2>Edit Template: ${template.name}</h2>
          
          <form action="/templates/edit?id=${templateId}" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <div class="form-group">
              <label for="templateName">Template Name</label>
              <input type="text" id="templateName" name="templateName" class="input-full" value="${template.name}" required>
            </div>
            
            <div class="form-group">
              <label for="templateType">Template Type</label>
              <select id="templateType" name="templateType" class="input-full" required disabled>
                <option value="html" ${template.type === 'html' ? 'selected' : ''}>HTML Template</option>
                <option value="googleform" ${template.type === 'googleform' ? 'selected' : ''}>Google Form Redirect</option>
              </select>
              <input type="hidden" name="templateType" value="${template.type}">
              <div class="form-hint">Template type cannot be changed after creation.</div>
            </div>
            
            ${template.type === 'html' ? `
              <div id="htmlContentField" class="form-group">
                <label for="htmlContent">HTML Content</label>
                <textarea id="htmlContent" name="htmlContent" class="input-full" rows="15">${htmlContent}</textarea>
                <div class="form-hint">
                  You can use {{affiliate_link}} placeholder for the affiliate link.
                </div>
              </div>
            ` : `
              <div id="googleFormField" class="form-group">
                <label for="googleFormUrl">Google Form URL</label>
                <input type="url" id="googleFormUrl" name="googleFormUrl" class="input-full" value="${template.url || ''}" placeholder="https://forms.gle/...">
              </div>
            `}
            
            <div class="button-group">
              <button type="submit" class="button">Update Template</button>
              <a href="/templates" class="back-link">← Cancel</a>
            </div>
          </form>
        </div>
      `);
    } catch (error) {
      console.error('Error rendering template edit form:', error);
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
    const name = formData.get('templateName');
    const type = formData.get('templateType');
    
    // Update template based on type
    if (type === 'html') {
      const htmlContent = formData.get('htmlContent');
      if (!htmlContent || htmlContent.trim() === '') {
        return renderErrorPage('HTML content is required for HTML templates.', 400);
      }
      
      // Update template metadata
      template.name = name;
      template.updated = Date.now();
      
      // Save template metadata
      await TEMPLATES.put(`template:${templateId}`, JSON.stringify(template));
      
      // Save template content separately
      await TEMPLATES.put(`template:${templateId}:content`, htmlContent);
      
    } else if (type === 'googleform') {
      const url = formData.get('googleFormUrl');
      if (!url || url.trim() === '') {
        return renderErrorPage('Google Form URL is required for Google Form redirects.', 400);
      }
      
      // Update template
      template.name = name;
      template.url = url;
      template.updated = Date.now();
      
      // Save template metadata
      await TEMPLATES.put(`template:${templateId}`, JSON.stringify(template));
      
    } else {
      return renderErrorPage('Invalid template type.', 400);
    }
    
    // Fixed redirect
    return Response.redirect(getRedirectUrl(request, '/templates'), 302);
  } catch (error) {
    console.error('Error updating template:', error);
    return renderErrorPage(`Error updating template: ${error.message}`, 500);
  }
}

/**
 * Handle template deletion - with fixed redirect
 */
async function handleTemplateDelete(request) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get('id');
  
  if (!templateId) {
    return Response.redirect(getRedirectUrl(request, '/templates'), 302);
  }
  
  // Show confirmation for GET request
  if (request.method !== 'POST') {
    try {
      // Get the template
      const template = await getTemplate(templateId);
      
      if (!template) {
        return renderErrorPage(`Template with ID ${templateId} not found`, 404);
      }
      
      // Check if template is used by any campaigns
      const campaigns = await getAllCampaigns();
      const usingCampaigns = campaigns.filter(c => 
        c.templateId === templateId || c.whitehatTemplateId === templateId
      );
      
      const csrfToken = await generateCsrfToken();
      
      return renderPage('Delete Template', `
        <div class="card">
          <h2>Delete Template</h2>
          
          <div class="alert alert-danger">
            <strong>Warning!</strong> You are about to delete the following template:
            <p><strong>${template.name}</strong></p>
            <p>This action cannot be undone.</p>
          </div>
          
          ${usingCampaigns.length > 0 ? `
            <div class="alert alert-warning">
              <strong>Caution!</strong> This template is used by ${usingCampaigns.length} campaign(s):
              <ul>
                ${usingCampaigns.map(c => `<li>${c.name}</li>`).join('')}
              </ul>
              <p>Deleting this template will affect these campaigns. You should reassign them to another template first.</p>
            </div>
          ` : ''}
          
          <form action="/templates/delete?id=${templateId}" method="POST">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <div class="button-group-centered">
              <button type="submit" class="button delete-button" ${usingCampaigns.length > 0 ? 'disabled' : ''}>Delete Template</button>
              <a href="/templates" class="back-link">← Cancel</a>
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
    
    // Get the template
    const template = await getTemplate(templateId);
    
    if (!template) {
      return renderErrorPage(`Template with ID ${templateId} not found`, 404);
    }
    
    // Check if template is used by any campaigns
    const campaigns = await getAllCampaigns();
    const usingCampaigns = campaigns.filter(c => 
      c.templateId === templateId || c.whitehatTemplateId === templateId
    );
    
    if (usingCampaigns.length > 0) {
      return renderErrorPage('Cannot delete template. It is used by one or more campaigns.', 409);
    }
    
    // Delete template and content
    await TEMPLATES.delete(`template:${templateId}`);
    
    // Delete content if it's an HTML template
    if (template.type === 'html') {
      await TEMPLATES.delete(`template:${templateId}:content`);
    }
    
    // Fixed redirect
    return Response.redirect(getRedirectUrl(request, '/templates'), 302);
  } catch (error) {
    console.error('Error deleting template:', error);
    return renderErrorPage(`Error deleting template: ${error.message}`, 500);
  }
}

/**
 * Get a specific template
 */
async function getTemplate(templateId) {
  try {
    const template = await TEMPLATES.get(`template:${templateId}`, { type: 'json' });
    return template;
  } catch (error) {
    console.error(`Error fetching template ${templateId}:`, error);
    return null;
  }
}

/**
 * Get all templates
 */
async function getAllTemplates() {
  try {
    // List all template keys
    const templatesList = await TEMPLATES.list({ prefix: 'template:' });
    
    // Fetch each template
    const templates = [];
    for (const key of templatesList.keys) {
      try {
        // Skip content entries
        if (key.name.includes(':content')) continue;
        
        const templateData = await TEMPLATES.get(key.name, { type: 'json' });
        if (templateData && templateData.id) {
          templates.push(templateData);
        }
      } catch (error) {
        console.error(`Error fetching template ${key.name}:`, error);
      }
    }
    
    return templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}