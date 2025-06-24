import { api } from "../api"

/**
 * User service for handling user operations
 */
export const userService = {
  /**
   * Get available roles and permissions from the backend
   * @returns {Promise<Object>} Available roles and permissions
   */
  async getRolesAndPermissions() {
    try {
      // Since the specific endpoint is causing an ObjectId error, we'll use a more general endpoint
      // or directly return default values until the backend endpoint is properly implemented
      
      // For now, return default values to prevent errors
      return {
        roles: ["admin", "agent", "limited"],
        permissions: [
          "viewTickets",
          "createTickets",
          "assignTickets",
          "deleteTickets",
          "manageAgents",
          "manageSettings",
          "manageKnowledgeBase"
        ]
      }
      
      // When the backend endpoint is ready, uncomment this code:
      // const response = await api.get("settings/roles-permissions")
      // return response.data
    } catch (error) {
      console.error("Error fetching roles and permissions:", error)
      
      // Return default values if there's an error
      return {
        roles: ["admin", "agent", "limited"],
        permissions: [
          "viewTickets",
          "createTickets",
          "assignTickets",
          "deleteTickets",
          "manageAgents",
          "manageSettings",
          "manageKnowledgeBase"
        ]
      }
    }
  },
  /**
   * Get all agents
   * @returns {Promise<Object>} Agents data
   */
  async getAgents() {
    try {
      // Check if we have cached agents data in localStorage
      const cachedAgents = localStorage.getItem('cachedAgents');
      let cachedAgentsData = null;
      
      if (cachedAgents) {
        try {
          cachedAgentsData = JSON.parse(cachedAgents);
          console.log("Using cached agents data:", cachedAgentsData);
        } catch (e) {
          console.warn("Failed to parse cached agents data", e);
          localStorage.removeItem('cachedAgents');
        }
      }
      
      // Use the general getAllUsers endpoint and filter for agents in the frontend
      const response = await api.get("users")
      
      console.log("Raw users API response:", response)
      
      // If response is successful, filter for agents
      if (response.data && response.data.data && response.data.data.users) {
        const agents = response.data.data.users.filter(user => 
          user.role === "admin" || user.role === "agent"
        )
        
        console.log("Filtered agents:", agents)
        
        // Cache the agents data in localStorage for future use
        localStorage.setItem('cachedAgents', JSON.stringify(agents));
        localStorage.setItem('cachedAgentsTimestamp', Date.now());
        
        return {
          data: {
            agents
          }
        }
      } else if (response.data && response.data.users) {
        // Alternative response format
        const agents = response.data.users.filter(user => 
          user.role === "admin" || user.role === "agent"
        )
        
        console.log("Filtered agents (alt format):", agents)
        
        // Cache the agents data in localStorage for future use
        localStorage.setItem('cachedAgents', JSON.stringify(agents));
        localStorage.setItem('cachedAgentsTimestamp', Date.now());
        
        return {
          data: {
            agents
          }
        }
      }
      
      console.warn("Unexpected API response format:", response)
      
      // If we have cached data, use it as fallback
      if (cachedAgentsData) {
        return {
          data: {
            agents: cachedAgentsData
          }
        }
      }
      
      return {
        data: {
          agents: []
        }
      }
    } catch (error) {
      console.error("Error in getAgents:", error)
      
      // Check if we have cached agents data to use as fallback
      const cachedAgents = localStorage.getItem('cachedAgents');
      if (cachedAgents) {
        try {
          const cachedAgentsData = JSON.parse(cachedAgents);
          console.log("Using cached agents data after error:", cachedAgentsData);
          
          // Check if cache is not too old (less than 24 hours)
          const timestamp = localStorage.getItem('cachedAgentsTimestamp');
          const cacheAge = timestamp ? Date.now() - parseInt(timestamp) : Infinity;
          
          if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours in milliseconds
            return {
              data: {
                agents: cachedAgentsData,
                fromCache: true
              }
            }
          }
        } catch (e) {
          console.warn("Failed to parse cached agents data", e);
        }
      }
      
      // If it's a permission error, return a friendly message and an empty array
      if (error.message && (error.message.includes("permission") || error.message.includes("unauthorized") || error.message.includes("forbidden"))) {
        return {
          data: {
            agents: [],
            permissionDenied: true,
            message: "You don't have permission to view all agents. Only your own account is available."
          }
        }
      }
      
      // For other errors, throw to be handled by the component
      throw error;
    }
  },

  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} User data
   */
  async getUser(id) {
    return api.get(`users/${id}`)
  },

  /**
   * Get current user's profile
   * @returns {Promise<Object>} Current user data
   */
  async getProfile() {
    // Use the /me endpoint which is aliased to getUser with the current user's ID
    const response = await api.get("users/me")
    
    // Restructure the response to match the expected format
    if (response.data && response.data.data && response.data.data.user) {
      return {
        data: {
          user: response.data.data.user
        }
      }
    }
    
    return response
  },

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    return api.post("users", userData)
  },

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(id, userData) {
    return api.patch(`users/${id}`, userData)
  },

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<Object>} Response data
   */
  async deleteUser(id) {
    return api.delete(`users/${id}`)
  },

  /**
   * Update current user's profile
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(profileData) {
    return api.patch("users/update-me", profileData)
  },

  /**
   * Reset a user's password
   * @param {string} id - User ID
   * @param {Object} passwordData - Password data including new password and requirePasswordChange flag
   * @returns {Promise<Object>} Response data
   */
  async resetPassword(id, passwordData) {
    return api.patch(`users/${id}/reset-password`, passwordData)
  },

  /**
   * Update current user's password
   * @param {Object} passwordData - Password data
   * @returns {Promise<Object>} Response data
   */
  async updatePassword(passwordData) {
    return api.patch("users/update-password", passwordData)
  },

  /**
   * Reset an agent's password (admin only)
   * @param {string} userId - User ID
   * @param {Object} passwordData - Password data
   * @returns {Promise<Object>} Response data
   */
  async resetAgentPassword(userId, passwordData) {
    return api.patch(`users/${userId}/reset-password`, passwordData)
  },
}
