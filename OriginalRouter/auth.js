/**
 * Authentication functions
 */

/**
 * Check if the request has valid authentication
 */
async function isAuthenticated(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return false;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Basic') {
    return false;
  }
  
  try {
    const decoded = atob(parts[1]);
    const [username, password] = decoded.split(':');
    
    return username === CONFIG.ADMIN.USERNAME && password === CONFIG.ADMIN.PASSWORD;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}

/**
 * Generate a CSRF token with longer expiration time (24 hours instead of 1 hour)
 */
async function generateCsrfToken() {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  const token = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
  
  await SETTINGS.put(`csrf:${token}`, JSON.stringify({
    created: Date.now(),
    expires: Date.now() + 24 * 3600 * 1000 // 24 hours instead of 1 hour
  }), { expirationTtl: 86400 }); // 24 hours in seconds
  
  return token;
}

/**
 * Validate a CSRF token - with modified validation logic to be more forgiving
 */
async function validateCsrfToken(token) {
  if (!token) return false;
  
  try {
    const tokenData = await SETTINGS.get(`csrf:${token}`);
    
    if (!tokenData) {
      return false;
    }
    
    // Parse the token data
    const data = JSON.parse(tokenData);
    
    // More lenient validation - if token exists, it's likely valid
    if (data) {
      // Only delete token if it's actually expired
      if (data.expires <= Date.now()) {
        await SETTINGS.delete(`csrf:${token}`);
        return false;
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}