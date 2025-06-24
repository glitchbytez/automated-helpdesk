const axios = require('axios');

// Backend API configuration
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5500/api/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * API endpoints for the chatbot server
 */
const API_ENDPOINTS = {
  // Public endpoints (no authentication required)
  GET_SESSION: (sessionId) => `sessions/${sessionId}/public`,
  CREATE_SESSION: 'sessions/public',
  UPDATE_SESSION: (sessionId) => `sessions/${sessionId}/public`,
  GET_MESSAGES: (sessionId) => `sessions/${sessionId}/messages/public`,
  CREATE_MESSAGE: 'messages/public'
};

/**
 * Sleep function for retry delay
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make a direct API call to the backend using public routes with retry logic
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
 * @param {string} endpoint - API endpoint or endpoint key from API_ENDPOINTS
 * @param {Object} data - Request data (for POST, PATCH)
 * @param {number} retries - Number of retries (internal use)
 * @returns {Promise<Object>} Response data
 */
async function makeApiCall(method, endpoint, data = null, retries = 0) {
  try {
    // Check if the endpoint is a key in API_ENDPOINTS
    let url;
    if (typeof endpoint === 'function') {
      // This is a function that generates an endpoint
      url = `${BACKEND_API_URL}/${endpoint().replace(/^\//, '')}`;
    } else if (API_ENDPOINTS[endpoint]) {
      // This is a key in API_ENDPOINTS
      url = `${BACKEND_API_URL}/${API_ENDPOINTS[endpoint].replace(/^\//, '')}`;
    } else {
      // This is a raw endpoint
      url = `${BACKEND_API_URL}/${endpoint.replace(/^\//, '')}`;
    }
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    console.log(`[API] ${method} Request for ${endpoint}`);
    let response;
    
    switch (method.toUpperCase()) {
      case 'GET':
        response = await axios.get(url, { headers, timeout: 5000 });
        break;
      case 'POST':
        response = await axios.post(url, data, { headers, timeout: 5000 });
        break;
      case 'PATCH':
        response = await axios.patch(url, data, { headers, timeout: 5000 });
        break;
      case 'DELETE':
        response = await axios.delete(url, { headers, timeout: 5000 });
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    console.log(`[API] ${method} Success for ${endpoint}`);
    return response.data;
  } catch (error) {
    // Log the error with endpoint information
    console.error(`[API] ${method} Error for ${endpoint}: ${error.message}`);
    
    // Check if we should retry (connection errors or 5xx server errors)
    const isConnectionError = error.code === 'ECONNREFUSED' || 
                             error.code === 'ECONNRESET' || 
                             error.code === 'ETIMEDOUT';
    const isServerError = error.response && error.response.status >= 500;
    
    if ((isConnectionError || isServerError) && retries < MAX_RETRIES) {
      console.log(`[API] Retrying ${method} for ${endpoint} (Attempt ${retries + 1}/${MAX_RETRIES})`);
      
      // Wait before retrying (with exponential backoff)
      const delay = RETRY_DELAY * Math.pow(2, retries);
      await sleep(delay);
      
      // Retry the request
      return makeApiCall(method, endpoint, data, retries + 1);
    }
    
    // If we've exhausted retries or it's not a retryable error, throw it
    throw error;
  }
}

// Export both the API_ENDPOINTS and the makeApiCall function
module.exports = {
  makeApiCall,
  API_ENDPOINTS
};