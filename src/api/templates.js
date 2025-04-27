/**
 * Templates API service
 */

/**
 * Fetch all templates
 */
export async function fetchTemplates() {
  const response = await fetch('/api/templates');
  return await response.json();
}

/**
 * Fetch a specific template by ID
 */
export async function fetchTemplate(id) {
  const response = await fetch(`/api/templates/detail?id=${id}`);
  return await response.json();
}

/**
 * Create a new template
 */
export async function createTemplate(templateData) {
  const response = await fetch('/api/templates/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(templateData)
  });
  return await response.json();
}

/**
 * Update an existing template
 */
export async function updateTemplate(templateData) {
  const response = await fetch('/api/templates/edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(templateData)
  });
  return await response.json();
}

/**
 * Delete a template
 */
export async function deleteTemplate(id) {
  const response = await fetch(`/api/templates/delete?id=${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ templateId: id })
  });
  return await response.json();
}

/**
 * Check if a template is used by any campaigns
 */
export async function checkTemplateUsage(id) {
  const response = await fetch(`/api/templates/usage?id=${id}`);
  return await response.json();
}