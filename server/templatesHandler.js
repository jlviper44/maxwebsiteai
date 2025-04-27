/**
 * Template handler functionality for API endpoints
 */

import { generateUUID, createJsonResponse } from './utils.js';

/**
 * Get all templates
 */
export async function getAllTemplates(env) {
  try {
    // List all template keys
    const templatesList = await env.TEMPLATES.list({ prefix: 'template:' });
    
    // Fetch each template
    const templates = [];
    for (const key of templatesList.keys) {
      try {
        // Skip content entries
        if (key.name.includes(':content')) continue;
        
        const templateData = await env.TEMPLATES.get(key.name, { type: 'json' });
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

/**
 * Get a specific template
 */
export async function getTemplate(templateId, env) {
  try {
    const template = await env.TEMPLATES.get(`template:${templateId}`, { type: 'json' });
    return template;
  } catch (error) {
    console.error(`Error fetching template ${templateId}:`, error);
    return null;
  }
}

/**
 * Handle templates list request
 */
export async function handleTemplatesList(request, env) {
  try {
    const templates = await getAllTemplates(env);
    return createJsonResponse({ success: true, templates });
  } catch (error) {
    console.error('Error handling templates list:', error);
    return createJsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Handle template detail request
 */
export async function handleTemplateDetail(request, env) {
  try {
    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');
    
    if (!templateId) {
      return createJsonResponse({
        success: false,
        error: 'Template ID is required'
      }, 400);
    }
    
    // Get the template
    const template = await getTemplate(templateId, env);
    
    if (!template) {
      return createJsonResponse({
        success: false,
        error: 'Template not found'
      }, 404);
    }
    
    // Get content if it's an HTML template
    let content = null;
    if (template.type === 'html') {
      content = await env.TEMPLATES.get(`template:${templateId}:content`);
    }
    
    return createJsonResponse({
      success: true,
      template,
      content
    });
  } catch (error) {
    console.error('Error handling template detail:', error);
    return createJsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Handle template creation
 */
export async function handleTemplateCreate(request, env) {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return createJsonResponse({
        success: false,
        error: 'Method not allowed'
      }, 405);
    }
    
    // Get request data
    let requestData;
    const contentType = request.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      requestData = await request.json();
    } else {
      const formData = await request.formData();
      requestData = Object.fromEntries(formData.entries());
    }
    
    const { templateName, templateType } = requestData;
    
    // Validate required fields
    if (!templateName || !templateType) {
      return createJsonResponse({
        success: false,
        error: 'Template name and type are required'
      }, 400);
    }
    
    // Validate based on type
    if (templateType === 'html') {
      const htmlContent = requestData.htmlContent;
      if (!htmlContent || htmlContent.trim() === '') {
        return createJsonResponse({
          success: false,
          error: 'HTML content is required for HTML templates'
        }, 400);
      }
      
      // Create template
      const templateId = generateUUID();
      const template = {
        id: templateId,
        name: templateName,
        type: templateType,
        created: Date.now(),
        updated: Date.now()
      };
      
      // Save template metadata
      await env.TEMPLATES.put(`template:${templateId}`, JSON.stringify(template));
      
      // Save template content separately
      await env.TEMPLATES.put(`template:${templateId}:content`, htmlContent);
      
      return createJsonResponse({
        success: true,
        message: 'Template created successfully',
        templateId,
        template
      });
      
    } else if (templateType === 'googleform') {
      const url = requestData.googleFormUrl;
      if (!url || url.trim() === '') {
        return createJsonResponse({
          success: false,
          error: 'Google Form URL is required for Google Form redirects'
        }, 400);
      }
      
      // Create template
      const templateId = generateUUID();
      const template = {
        id: templateId,
        name: templateName,
        type: templateType,
        url,
        created: Date.now(),
        updated: Date.now()
      };
      
      // Save template metadata
      await env.TEMPLATES.put(`template:${templateId}`, JSON.stringify(template));
      
      return createJsonResponse({
        success: true,
        message: 'Template created successfully',
        templateId,
        template
      });
      
    } else {
      return createJsonResponse({
        success: false,
        error: 'Invalid template type'
      }, 400);
    }
  } catch (error) {
    console.error('Error creating template:', error);
    return createJsonResponse({
      success: false,
      error: `Error creating template: ${error.message}`
    }, 500);
  }
}

/**
 * Handle template editing
 */
export async function handleTemplateEdit(request, env) {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return createJsonResponse({
        success: false,
        error: 'Method not allowed'
      }, 405);
    }
    
    // Get request data
    let requestData;
    const contentType = request.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      requestData = await request.json();
    } else {
      const formData = await request.formData();
      requestData = Object.fromEntries(formData.entries());
    }
    
    const { templateName, templateType, templateId } = requestData;
    
    if (!templateId) {
      return createJsonResponse({
        success: false,
        error: 'Template ID is required'
      }, 400);
    }
    
    // Get the template
    const template = await getTemplate(templateId, env);
    
    if (!template) {
      return createJsonResponse({
        success: false,
        error: 'Template not found'
      }, 404);
    }
    
    // Update template based on type
    if (template.type === 'html') {
      const htmlContent = requestData.htmlContent;
      if (!htmlContent || htmlContent.trim() === '') {
        return createJsonResponse({
          success: false,
          error: 'HTML content is required for HTML templates'
        }, 400);
      }
      
      // Update template metadata
      template.name = templateName;
      template.updated = Date.now();
      
      // Save template metadata
      await env.TEMPLATES.put(`template:${templateId}`, JSON.stringify(template));
      
      // Save template content separately
      await env.TEMPLATES.put(`template:${templateId}:content`, htmlContent);
      
    } else if (template.type === 'googleform') {
      const url = requestData.googleFormUrl;
      if (!url || url.trim() === '') {
        return createJsonResponse({
          success: false,
          error: 'Google Form URL is required for Google Form redirects'
        }, 400);
      }
      
      // Update template
      template.name = templateName;
      template.url = url;
      template.updated = Date.now();
      
      // Save template metadata
      await env.TEMPLATES.put(`template:${templateId}`, JSON.stringify(template));
    }
    
    return createJsonResponse({
      success: true,
      message: 'Template updated successfully',
      templateId,
      template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return createJsonResponse({
      success: false,
      error: `Error updating template: ${error.message}`
    }, 500);
  }
}

/**
 * Check if template is used by any campaigns
 */
export async function checkTemplateUsage(templateId, env) {
  try {
    // Get all campaigns
    const keys = await env.CAMPAIGNS.list({ prefix: 'campaign:' });
    
    let usedByCampaigns = [];
    
    for (const key of keys.keys) {
      const campaign = await env.CAMPAIGNS.get(key.name, { type: 'json' });
      if (campaign) {
        if (campaign.templateId === templateId || campaign.whitehatTemplateId === templateId) {
          usedByCampaigns.push({
            id: campaign.id,
            name: campaign.name
          });
        }
      }
    }
    
    return usedByCampaigns;
  } catch (error) {
    console.error('Error checking template usage:', error);
    throw error;
  }
}

/**
 * Handle template deletion
 */
export async function handleTemplateDelete(request, env) {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return createJsonResponse({
        success: false,
        error: 'Method not allowed'
      }, 405);
    }
    
    // Get request data
    let requestData;
    const contentType = request.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      requestData = await request.json();
    } else {
      try {
        const formData = await request.formData();
        requestData = Object.fromEntries(formData.entries());
      } catch (e) {
        // If data can't be parsed, check URL parameters
        const url = new URL(request.url);
        const templateId = url.searchParams.get('id');
        requestData = { templateId };
      }
    }
    
    const { templateId } = requestData;
    
    if (!templateId) {
      return createJsonResponse({
        success: false,
        error: 'Template ID is required'
      }, 400);
    }
    
    // Get the template
    const template = await getTemplate(templateId, env);
    
    if (!template) {
      return createJsonResponse({
        success: false,
        error: 'Template not found'
      }, 404);
    }
    
    // Check if template is used by any campaigns
    const usingCampaigns = await checkTemplateUsage(templateId, env);
    
    if (usingCampaigns.length > 0) {
      return createJsonResponse({
        success: false,
        error: 'Cannot delete template. It is used by one or more campaigns.',
        campaigns: usingCampaigns
      }, 409);
    }
    
    // Delete template and content
    await env.TEMPLATES.delete(`template:${templateId}`);
    
    // Delete content if it's an HTML template
    if (template.type === 'html') {
      await env.TEMPLATES.delete(`template:${templateId}:content`);
    }
    
    return createJsonResponse({
      success: true,
      message: 'Template deleted successfully',
      templateId
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return createJsonResponse({
      success: false,
      error: `Error deleting template: ${error.message}`
    }, 500);
  }
}

/**
 * Handle template usage check
 */
export async function handleTemplateUsageCheck(request, env) {
  try {
    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');
    
    if (!templateId) {
      return createJsonResponse({
        success: false,
        error: 'Template ID is required'
      }, 400);
    }
    
    // Check if template is used by any campaigns
    const usingCampaigns = await checkTemplateUsage(templateId, env);
    
    return createJsonResponse({
      success: true,
      templateId,
      usedBy: usingCampaigns,
      isUsed: usingCampaigns.length > 0
    });
  } catch (error) {
    console.error('Error checking template usage:', error);
    return createJsonResponse({
      success: false,
      error: `Error checking template usage: ${error.message}`
    }, 500);
  }
}