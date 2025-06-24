const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500/api/v1"

/**
 * Base API service for making HTTP requests to the backend
 */
export const api = {
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: "GET", ...options })
  },

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    })
  },

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    })
  },

  /**
   * Make a PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    })
  },

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: "DELETE", ...options })
  },

  /**
   * Make a request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}) {
    try {
      // Remove leading slash from endpoint to avoid double slashes
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
      const url = `${API_URL}/${cleanEndpoint}`

      // Get token from localStorage if available
      let token = null
      if (typeof window !== "undefined") {
        token = localStorage.getItem("token")
      }

      // Set headers
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      })
      
      try {
        const responseText = await response.text()
        
        // Check if response is empty
        if (!responseText || responseText.trim() === '') {
          return { status: response.status, statusText: response.statusText, data: null };
        }
        
        // Try to parse the response as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          throw new Error(`Invalid JSON response: ${jsonError.message}`);
        }
        
        if (!response.ok) {
          // Create an error object that preserves the original backend error
          const error = new Error(data.message || "Something went wrong")
          error.status = response.status
          error.response = { data }
          throw error
        }
        
        return data
      } catch (parseError) {
        // If it's already a proper error (from !response.ok), re-throw it
        if (parseError.status && parseError.response) {
          throw parseError
        }
        // Only wrap parsing errors
        throw new Error(`Failed to parse API response: ${parseError.message}`)
      }
    } catch (error) {
      // Only log actual errors, not normal API responses
      if (error.message && !error.message.includes('Failed to parse API response')) {
        console.error(`API Error (${endpoint}):`, error.message)
      }
      throw error
    }
  },
}
