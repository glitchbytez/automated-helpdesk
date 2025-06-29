import { api } from "../api"
import { socketService } from "./socket-service"

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:5501';

/**
 * Chat service for handling chat operations
 */
export const chatService = {
  /**
   * Get all chats for the current agent
   * @returns {Promise<Object>} Chats data
   */
  async getMyChats() {
    return api.get("chats")
  },

  /**
   * Get a chat by ID
   * @param {string} id - Chat ID
   * @returns {Promise<Object>} Chat data
   */
  async getChat(id) {
    return api.get(`chats/${id}`)
  },

  /**
   * Get a chat by ticket ID
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Object>} Chat data
   */
  async getChatByTicketId(ticketId) {
    return api.get(`chats/ticket/${ticketId}`)
  },

  /**
   * Create a new chat
   * @param {Object} chatData - Chat data with user ID and initial message
   * @returns {Promise<Object>} Created chat
   */
  async createChat(chatData) {
    return api.post("chats", chatData)
  },

  /**
   * Update a chat
   * @param {string} id - Chat ID
   * @param {Object} chatData - Updated chat data
   * @returns {Promise<Object>} Updated chat
   */
  async updateChat(id, chatData) {
    return api.patch(`chats/${id}`, chatData)
  },

  /**
   * Close a chat
   * @param {string} id - Chat ID
   * @returns {Promise<Object>} Closed chat
   */
  async closeChat(id) {
    return api.delete(`chats/${id}`)
  },

  /**
   * Add a message to a chat
   * @param {string} chatId - Chat ID
   * @param {string} content - Message content
   * @returns {Promise<Object>} Updated chat with new message
   */
  async addMessage(chatId, content) {
    return api.post(`chats/${chatId}/messages`, { content })
  },

  /**
   * Mark all messages in a chat as read
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Updated chat with messages marked as read
   */
  async markAsRead(chatId) {
    return api.patch(`chats/${chatId}/read`)
  },
  
  /**
   * Get chat sessions from the chatbot server
   * @returns {Promise<Object>} Chat sessions data
   */
  async getChatSessions() {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        // Add a timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`${SOCKET_SERVER_URL}/preload`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch chat sessions: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        retries++;
        console.error(`Error fetching chat sessions (attempt ${retries}/${maxRetries}):`, error);
        
        if (error.name === 'AbortError') {
          console.log('Request timed out, retrying...');
        } else if (error.message.includes('Failed to fetch')) {
          console.log('Network error, retrying...');
        }
        
        // If we've reached max retries, return empty array
        if (retries >= maxRetries) {
          console.log('Max retries reached, returning empty array');
          return [];
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
    
    return [];
  },
  
  /**
   * Get messages for a specific chat session from the chatbot server
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Messages data
   */
  async getChatSessionMessages(sessionId) {
    try {
      const response = await fetch(`${SOCKET_SERVER_URL}/messages/${sessionId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch chat messages: ${response.status}`)
      }
      return response.json()
    } catch (error) {
      console.error("Error fetching chat messages:", error)
      return []
    }
  },
  
  /**
   * Send a message to a chat session via socket
   * @param {string} sessionId - Session ID
   * @param {string} text - Message text
   */
  sendMessageViaSocket(sessionId, text) {
    const socket = socketService.getSocket()
    if (!socket) {
      console.error('Socket not initialized')
      return false
    }
    
    socket.emit('agentMessage', { sessionId, text })
    return true
  },
  
  /**
   * Assign an agent to a chat session via socket
   * @param {string} sessionId - Session ID
   * @param {string} agentName - Agent name
   */
  assignAgentViaSocket(sessionId, agentName) {
    const socket = socketService.getSocket()
    if (!socket) {
      console.error('Socket not initialized')
      return false
    }
    
    socket.emit('agentAssigned', { sessionId, agentName })
    return true
  },
  
  /**
   * Get active chat sessions from the backend
   * @returns {Promise<Object>} Active chat sessions
   */
  async getActiveChatSessions() {
    try {
      const response = await api.get("sessions/active/public")
      return response.data?.sessions || []
    } catch (error) {
      console.error("Error fetching active chat sessions:", error)
      return []
    }
  },
  
  /**
   * Get chat requests from tickets
   * @returns {Promise<Object>} Chat request tickets
   */
  async getChatRequestTickets() {
    return api.get("tickets?source=chat")
  },
  
  /**
   * Convert a chat session to a ticket
   * @param {Object} sessionData - Session data including user info
   * @returns {Promise<Object>} Created ticket
   */
  async createTicketFromChat(sessionData) {
    try {
      // Format the chat data for a ticket
      const ticketData = {
        subject: `Chat Support: ${sessionData.userName || sessionData.userEmail || 'Anonymous User'}`,
        description: `Chat session ID: ${sessionData.sessionId}\n\nTranscript:\n${sessionData.messages.map(m => `${m.from}: ${m.text}`).join('\n')}`,
        priority: "Medium",
        category: "Support",
        channel: "Chat",
        // Include any additional data needed for the ticket
        chatSessionId: sessionData.sessionId,
        userEmail: sessionData.userEmail || 'anonymous@example.com'
      }
      
      return api.post("tickets", ticketData)
    } catch (error) {
      console.error("Error creating ticket from chat:", error)
      throw error
    }
  },
  
  /**
   * Update a chat session in the chatbot server
   * @param {string} sessionId - Session ID
   * @param {Object} updateData - Data to update (e.g., ticketId)
   * @returns {Promise<Object>} Updated session
   */
  async updateChatSession(sessionId, updateData) {
    try {
      console.log(`Updating chat session ${sessionId} with data:`, updateData);
      
      // Get the API endpoint for updating a session - use the same endpoint as the socket server
      const apiUrl = SOCKET_SERVER_URL;
      const endpoint = `${apiUrl}/sessions/${sessionId}`;
      
      console.log(`Using endpoint: ${endpoint}`);
      
      // Make the API call to update the session
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      console.log(`Update response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`Failed to update chat session: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Update result:', result);
      return result;
    } catch (error) {
      console.error("Error updating chat session:", error);
      throw error;
    }
  }
}
