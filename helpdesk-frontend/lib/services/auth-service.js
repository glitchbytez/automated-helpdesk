import { api } from "../api"

/**
 * Authentication service for handling user authentication
 */
export const authService = {
  /**
   * Login a user
   * @param {Object} credentials - User credentials
   * @returns {Promise<Object>} User data and token
   */
  async login(credentials) {
    try {
      const response = await api.post("auth/login", credentials)
      console.log('Raw login response:', response)
      
      // The backend sends: { status: "success", token, data: { user } }
      if (response && response.token) {
        // Store token
        console.log('Storing token:', response.token)
        localStorage.setItem("token", response.token)
        
        // Store user data
        if (response.data && response.data.user) {
          console.log('Storing user data from data.user:', response.data.user)
          localStorage.setItem("user", JSON.stringify(response.data.user))
        } else if (response.data) {
          console.log('Storing user data from data:', response.data)
          localStorage.setItem("user", JSON.stringify(response.data))
        }
      } else if (response.data && response.data.token) {
        // Fallback for wrapped response
        console.log('Storing token (fallback):', response.data.token)
        localStorage.setItem("token", response.data.token)
        
        if (response.data.data && response.data.data.user) {
          console.log('Storing user data from data.data.user:', response.data.data.user)
          localStorage.setItem("user", JSON.stringify(response.data.data.user))
        }
      }
      
      return response
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User data and token
   */
  async register(userData) {
    const response = await api.post("auth/register", userData)

    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token)
    }

    return response
  },

  /**
   * Logout the current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await api.get("auth/logout")
    } catch (error) {
      console.error('Error during logout:', error)
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local storage on logout
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  },

  /**
   * Get the current user's data
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    try {
      // Try to get user data from API
      const response = await api.get("users/me")
      
      // If successful, update localStorage with latest user data
      if (response.data && response.data.data && response.data.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.data.user))
      } else if (response.data && response.data.user) {
        // Handle the actual API response structure
        localStorage.setItem("user", JSON.stringify(response.data.user))
      }
      
      return response
    } catch (error) {
      console.error('Error getting current user:', error)
      
      // If API call fails but we have cached user data, return that
      const cachedUser = this.getCachedUser()
      if (cachedUser) {
        // Return in the format expected by the auth context
        return { data: { user: cachedUser } }
      }
      
      throw error
    }
  },
  
  /**
   * Get cached user data from localStorage
   * @returns {Object|null} User data or null if not found
   */
  getCachedUser() {
    if (typeof window === "undefined") return null
    
    try {
      const userData = localStorage.getItem("user")
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Error parsing cached user data:', error)
      return null
    }
  },

  /**
   * Request a password reset
   * @param {string} email - User's email
   * @returns {Promise<Object>} Response data
   */
  async forgotPassword(email) {
    return api.post("auth/forgot-password", { email })
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} Response data
   */
  async resetPassword(token, password) {
    return api.post(`auth/reset-password/${token}`, { password })
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem("token")
  },
}
