import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Socket service for handling real-time communication
 */
export const socketService = {
  socket: null,
  
  /**
   * Initialize the socket connection
   * @param {string} url - Socket server URL
   * @param {Object} options - Connection options
   * @returns {Object} Socket instance
   */
  initialize(url = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:5501', options = {}) {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return this.socket;
    }
    
    // Close existing socket if it exists but isn't connected
    if (this.socket) {
      console.log('Closing existing socket connection');
      this.socket.close();
      this.socket = null;
    }
    
    try {
      // Check if we can reach the server before initializing socket
      // Use the preload endpoint which we know exists
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const serverCheckPromise = fetch(`${url}/preload`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      }).then(response => {
        clearTimeout(timeoutId);
        if (response.ok) {
          console.log('Chat server is available');
        }
        return response;
      }).catch(err => {
        clearTimeout(timeoutId);
        console.warn(`Server check failed: ${err.message}. Proceeding with socket connection anyway.`);
        // Continue with socket connection even if health check fails
      });
      
      // Initialize socket with improved error handling
      this.socket = io(url, {
        transports: ['websocket', 'polling'],  // Allow fallback to polling if websocket fails
        reconnectionAttempts: 5,              // Try to reconnect 5 times
        reconnectionDelay: 1000,             // Start with 1 second delay
        reconnectionDelayMax: 5000,          // Maximum delay of 5 seconds
        timeout: 10000,                      // Reduced connection timeout
        autoConnect: true,                   // Auto connect on initialization
        forceNew: true,                      // Force a new connection
        withCredentials: true,               // Send cookies for cross-site requests
        ...options
      });
      
      // Set up error handling with more detailed logging
      this.socket.on('connect', () => {
        console.log('Socket connected successfully');
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        // Create a mock socket with basic functionality if connection fails
        if (!this.socket.connected && this.socket.io._reconnectionAttempts >= 3) {
          console.warn('Creating mock socket functionality for offline use');
          this._setupMockSocketFunctions();
        }
      });
      
      this.socket.on('connect_timeout', () => {
        console.error('Socket connection timeout');
      });
      
      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
      });
      
      this.socket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error.message);
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
      });
      
      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      console.log('Socket initialized');
      return this.socket;
    } catch (error) {
      console.error('Error initializing socket:', error);
      // Create a mock socket with basic functionality
      this._setupMockSocketFunctions();
      return this.socket;
    }
  },
  
  /**
   * Set up mock socket functions for offline use
   * @private
   */
  _setupMockSocketFunctions() {
    if (!this.socket) {
      this.socket = {};
    }
    
    // Add mock emit function
    this.socket.emit = (event, data) => {
      console.log(`Mock socket emit: ${event}`, data);
      return true; // Always return success
    };
    
    // Add mock on function
    this.socket.on = (event, callback) => {
      console.log(`Mock socket registered event: ${event}`);
      // Store callbacks for potential future use
      if (!this._mockCallbacks) {
        this._mockCallbacks = {};
      }
      if (!this._mockCallbacks[event]) {
        this._mockCallbacks[event] = [];
      }
      this._mockCallbacks[event].push(callback);
    };
    
    // Add mock connected property
    Object.defineProperty(this.socket, 'connected', {
      get: function() {
        return false;
      }
    });
    
    console.warn('Mock socket functions set up for offline use');
  },
  
  /**
   * Get the socket instance
   * @returns {Object|null} Socket instance or null if not initialized
   */
  getSocket() {
    return this.socket;
  },
  
  /**
   * Register as an admin/agent
   * @param {string} agentId - Agent ID
   * @returns {string} The generated session ID
   */
  registerAsAdmin(agentId) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return null;
    }
    
    // Generate a UUID for the admin session
    const sessionId = uuidv4();
    
    this.socket.emit('register', {
      role: 'admin',
      agentId,
      sessionId
    });
    
    return sessionId;
  },
  
  /**
   * Listen for new chat requests
   * @param {Function} callback - Callback function to handle new chat requests
   */
  onNewChatRequest(callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('newChatRequest', callback);
  },
  
  /**
   * Listen for user messages
   * @param {Function} callback - Callback function to handle user messages
   */
  onUserMessage(callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('userMessage', callback);
  },
  
  /**
   * Listen for conversation ended events
   * @param {Function} callback - Callback function to handle conversation ended events
   */
  onConversationEnded(callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('conversationEnded', callback);
  },
  
  /**
   * Listen for assignment confirmation events
   * @param {Function} callback - Callback function to handle assignment confirmation
   */
  onAssignmentConfirmed(callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('assignmentConfirmed', callback);
  },
  
  /**
   * Listen for assignment rejection events
   * @param {Function} callback - Callback function to handle assignment rejection
   */
  onAssignmentRejected(callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('assignmentRejected', callback);
  },
  
  /**
   * Listen for message rejection events
   * @param {Function} callback - Callback function to handle message rejection
   */
  onMessageRejected(callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('messageRejected', callback);
  },
  
  /**
   * Listen for agent left events
   * @param {Function} callback - Callback function to handle agent left events
   */
  onAgentLeft(callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('agentLeft', callback);
  },
  
  /**
   * End a conversation (admin only)
   * @param {string} sessionId - Session ID
   * @returns {boolean} Success status
   */
  endConversation(sessionId) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return false;
    }
    
    this.socket.emit('endConversation', { sessionId });
    return true;
  },
  
  /**
   * Send a message as an agent
   * @param {string} sessionId - Session ID
   * @param {string} text - Message text
   */
  sendAgentMessage(sessionId, text) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.emit('agentMessage', { sessionId, text });
  },
  
  /**
   * Assign an agent to a session
   * @param {string} sessionId - Session ID
   * @param {string} agentName - Agent name
   */
  assignAgent(sessionId, agentName) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.emit('agentAssigned', { sessionId, agentName });
  },
  
  /**
   * Disconnect the socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket disconnected');
    }
  }
};
