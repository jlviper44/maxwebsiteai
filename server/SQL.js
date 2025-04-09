// SQL.js - CRUD operations for Cloudflare Workers with D1QB

import { D1QB } from 'workers-qb';

/**
 * Execute a raw SQL query using D1QB
 * @param {D1Database} db - The D1 database instance
 * @param {string} query - SQL query to execute
 * @param {Array} params - Parameters for the query
 * @returns {Promise<Object>} - Query result
 */
async function executeQuery(db, query, params = []) {
  try {
    const qb = new D1QB(db);
    const statement = qb.prepare(query);
    
    if (params && params.length > 0) {
      statement.bind(...params);
    }
    
    const result = await statement.all();
    return {
      success: true,
      data: result.results,
      meta: result.meta
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all records from a table using D1QB
 * @param {D1Database} db - The D1 database instance
 * @param {string} tableName - Name of the table
 * @returns {Promise<Object>} - Query result with all records
 */
async function getAll(db, tableName) {
  try {
    const qb = new D1QB(db);
    const result = await qb.select('*')
      .from(tableName)
      .all();
    
    return {
      success: true,
      data: result.results,
      meta: result.meta
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get a single record by ID using D1QB
 * @param {D1Database} db - The D1 database instance
 * @param {string} tableName - Name of the table
 * @param {string} idColumn - Name of the ID column
 * @param {string|number} id - ID value to look up
 * @returns {Promise<Object>} - Query result with single record
 */
async function getById(db, tableName, idColumn, id) {
  try {
    const qb = new D1QB(db);
    const result = await qb.select('*')
      .from(tableName)
      .where(idColumn, '=', id)
      .first();
    
    return {
      success: true,
      data: result ? [result] : [],
      meta: {}
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Insert a new record using D1QB
 * @param {D1Database} db - The D1 database instance
 * @param {string} tableName - Name of the table
 * @param {Object} data - Record data as key-value pairs
 * @returns {Promise<Object>} - Query result
 */
async function insert(db, tableName, data) {
  try {
    const qb = new D1QB(db);
    const result = await qb.insert(data)
      .into(tableName)
      .execute();
    
    return {
      success: true,
      data: [data],
      meta: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update an existing record using D1QB
 * @param {D1Database} db - The D1 database instance
 * @param {string} tableName - Name of the table
 * @param {string} idColumn - Name of the ID column
 * @param {string|number} id - ID value to update
 * @param {Object} data - Record data as key-value pairs
 * @returns {Promise<Object>} - Query result
 */
async function update(db, tableName, idColumn, id, data) {
  try {
    const qb = new D1QB(db);
    const result = await qb.update(tableName)
      .set(data)
      .where(idColumn, '=', id)
      .execute();
    
    return {
      success: true,
      data: [data],
      meta: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a record using D1QB
 * @param {D1Database} db - The D1 database instance
 * @param {string} tableName - Name of the table
 * @param {string} idColumn - Name of the ID column
 * @param {string|number} id - ID value to delete
 * @returns {Promise<Object>} - Query result
 */
async function deleteRecord(db, tableName, idColumn, id) {
  try {
    const qb = new D1QB(db);
    const result = await qb.delete()
      .from(tableName)
      .where(idColumn, '=', id)
      .execute();
    
    return {
      success: true,
      data: [],
      meta: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle HTTP requests for SQL operations
 * @param {Request} request - The incoming request
 * @param {D1Database} db - The D1 database instance
 * @returns {Response} - JSON response
 */
async function handleSQLRequest(request, db) {
  // Parse request URL and method
  const url = new URL(request.url);
  const method = request.method;
  const params = url.searchParams;
  
  // Get table and ID from URL
  const pathParts = url.pathname.split('/').filter(Boolean);
  const table = pathParts[2]; // /api/sql/tableName/[id]
  const id = pathParts[3];
  
  // Check for authentication
  // This is a basic check - you should implement proper authentication
  const authorization = request.headers.get('Authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    let result;
    
    // CRUD operations based on HTTP method
    switch (method) {
      case 'GET':
        if (id) {
          // Get single record by ID
          result = await getById(db, table, params.get('idColumn') || 'ID', id);
        } else {
          // Get all records
          result = await getAll(db, table);
        }
        break;
        
      case 'POST':
        // Create new record
        const postData = await request.json();
        result = await insert(db, table, postData);
        break;
        
      case 'PUT':
        // Update existing record
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID is required for updates' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        const putData = await request.json();
        result = await update(db, table, params.get('idColumn') || 'ID', id, putData);
        break;
        
      case 'DELETE':
        // Delete record
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID is required for deletion' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        result = await deleteRecord(db, table, params.get('idColumn') || 'ID', id);
        break;
        
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Return response
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Custom endpoint to run raw SQL queries
async function handleRawSQLRequest(request, db) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const { query, params = [] } = await request.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await executeQuery(db, query, params);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export { 
  handleSQLRequest, 
  handleRawSQLRequest,
  executeQuery,
  getAll,
  getById,
  insert,
  update,
  deleteRecord
};