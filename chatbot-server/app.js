const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

// MongoDB cache instead of Redis
const MongoCache = require('./utils/mongoCache');

// Load environment variables
dotenv.config();

// Import API utility
const { makeApiCall, API_ENDPOINTS } = require('./utils/api');

const app        = express();
const httpServer = http.createServer(app);

// Initialize MongoDB cache
const cache = new MongoCache();

// allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
];

// Enhanced Socket.IO configuration with more specific CORS settings
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins, // Specify your frontend URLs
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Enable both WebSocket and polling
  allowEIO3: true, // Allow Engine.IO 3 compatibility
  pingTimeout: 60000, // Increase ping timeout to 60 seconds
  pingInterval: 25000 // Increase ping interval to 25 seconds
});

// Backend API configuration
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5500/api/v1';

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: require('./package.json').version,
      services: {
        server: 'healthy',
        mongodb: 'checking'
      }
    };

    // Check MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      healthCheck.services.mongodb = 'healthy';
      
      // Optional: Quick MongoDB ping test
      try {
        await mongoose.connection.db.admin().ping();
        healthCheck.services.mongodb = 'healthy';
      } catch (dbPingError) {
        healthCheck.services.mongodb = 'degraded';
        healthCheck.status = 'degraded';
      }
    } else {
      healthCheck.services.mongodb = 'unhealthy';
      healthCheck.status = 'unhealthy';
    }

    // Return appropriate HTTP status
    const httpStatus = healthCheck.status === 'ok' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;
    
    res.status(httpStatus).json(healthCheck);
  } catch (error) {
    console.error('[HEALTH] Health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        server: 'unhealthy',
        mongodb: 'unknown'
      }
    });
  }
});

// Readiness check (for Kubernetes)
app.get('/ready', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Check if MongoDB is connected and ready
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      res.status(200).json({ 
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({ 
        status: 'not ready',
        reason: 'MongoDB not connected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready',
      reason: 'Database connectivity issue',
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness check (for Kubernetes)
app.get('/live', (req, res) => {
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get a session by ticket ID
app.get('/sessions/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    console.log(`[SERVER] Searching for session with ticket ID: ${ticketId}`);
    
    // Try to find in MongoDB cache first
    let matchingSession = await cache.findSessionsByTicketId(ticketId);
    
    if (matchingSession) {
      console.log(`[SERVER] Found session with ticket ID ${ticketId} in cache`);
      res.json(matchingSession);
    } else {
      // Fallback to API call (same as before)
      try {
        console.log(`[SERVER] Trying to fetch session from database with ticket ID: ${ticketId}`);
        const response = await makeApiCall('GET', `sessions/ticket/${ticketId}/public`);
        if (response.data && response.data.session) {
          console.log(`[SERVER] Found session in database with ticket ID ${ticketId}`);
          res.json(response.data.session);
        } else {
          console.log(`[SERVER] No session found with ticket ID: ${ticketId}`);
          res.status(404).json({ error: 'No chat found with that ticket ID' });
        }
      } catch (dbError) {
        console.log(`[SERVER] No session found with ticket ID: ${ticketId}`);
        res.status(404).json({ error: 'No chat found with that ticket ID' });
      }
    }
  } catch (error) {
    console.error('[SERVER] Error finding session by ticket ID:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a session (e.g., add ticketId)
app.patch('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;
    
    console.log(`[SERVER] Updating session ${sessionId} with data:`, updateData);
    
    // Update the session in the database
    await makeApiCall('PATCH', API_ENDPOINTS.UPDATE_SESSION(sessionId), updateData)
      .then(response => {
        console.log(`[SERVER] Session ${sessionId} updated successfully`);
        res.status(200).json({ success: true, message: 'Session updated successfully', data: response });
      })
      .catch(err => {
        console.error(`[SERVER] Error updating session ${sessionId}:`, err.message);
        res.status(500).json({ success: false, message: `Error updating session: ${err.message}` });
      });
  } catch (error) {
    console.error('[SERVER] Error in session update endpoint:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Preload sessions and messages
app.get('/preload', async (req, res) => {
  try {
    // Check MongoDB cache first
    const cachedData = await cache.get('preloadData');

    if (cachedData) {
      console.log('[CACHE] preloadData hit (MongoDB)');
      return res.json(cachedData);
    }

    console.log('[CACHE] preloadData miss, querying API');
    
    // Get sessions and messages from the API
    const sessionsResponse = await makeApiCall('GET', 'sessions/public');
    const sessions = sessionsResponse.data.sessions || [];
    
    const messagesResponse = await makeApiCall('GET', 'messages/public');
    const messages = messagesResponse.data.messages || [];

    // Format data to match what the frontend expects
    const data = sessions.map(session => {
      const sessionMessages = messages
        .filter(msg => msg.sessionId === session.sessionId)
        .map(m => ({
          from: m.from,
          text: m.text,
          createdAt: m.timestamp || m.createdAt
        }));
      
      return {
        sessionId: session.sessionId,
        disconnectedAt: session.conversationEndedAt || session.disconnectedAt || null,
        assignedAgent: session.agentName || session.assignedAgent || null,
        requestLiveChat: !!session.requestLiveChat,
        userName: session.userName || 'Anonymous',
        userEmail: session.userEmail || null,
        ticketId: session.ticketId || null,
        messages: sessionMessages
      };
    });

    // Cache in MongoDB for 60 seconds
    await cache.set('preloadData', data, 60);
    res.json(data);
  } catch (error) {
    console.error('Error in /preload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get previous messages for a session
app.get('/messages/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    // Use the API to get messages for this session
    const messagesResponse = await makeApiCall('GET', API_ENDPOINTS.GET_MESSAGES(sessionId));
    const messages = messagesResponse.data.messages || [];
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.IO
io.on('connection', socket => {
  console.log('New connection:', socket.id);

  socket.on('agentAssigned', async ({ sessionId, agentName }) => {
    try {
      // Check if this session already has an assigned agent
      const existingAgentId = await cache.getAssignedAgent(sessionId);
      
      if (existingAgentId && existingAgentId !== socket.id) {
        console.log(`[SERVER] Session ${sessionId} is already assigned to agent ${existingAgentId}`);
        socket.emit('assignmentRejected', { 
          sessionId, 
          reason: 'This conversation is already being handled by another agent.'
        });
        return;
      }
      
      // Check if the conversation is closed (via API call)
      try {
        const sessionResponse = await makeApiCall('GET', API_ENDPOINTS.GET_SESSION(sessionId));
        if (sessionResponse.data && sessionResponse.data.session) {
          const session = sessionResponse.data.session;
          if (session.disconnectedAt || session.status === 'closed') {
            console.log(`[SERVER] Session ${sessionId} is closed and cannot be joined`);
            socket.emit('assignmentRejected', { 
              sessionId, 
              reason: 'This conversation is closed and cannot be joined.'
            });
            return;
          }
        }
      } catch (error) {
        console.error(`[SERVER] Error checking session status: ${error.message}`);
      }
      
      // Store the agent assignment in MongoDB
      await cache.assignAgent(sessionId, socket.id, {
        agentName,
        agentId: socket.data.agentId,
        assignedAt: new Date()
      });
      
      // Update the session with agent information using the API
      // Only send the agent ID if it's a valid MongoDB ObjectId
      const updateData = {
        agentName,
        assignedAt: new Date()
      };
      
      // If socket.data.agentId exists and is a valid MongoDB ObjectId (24 hex chars)
      if (socket.data.agentId && /^[0-9a-fA-F]{24}$/.test(socket.data.agentId)) {
        updateData.agentId = socket.data.agentId;
      }
      
      await makeApiCall('PATCH', API_ENDPOINTS.UPDATE_SESSION(sessionId), updateData);
      
      // Get the user's socket ID
      const userSocketId = await redis.get(`sessionToSocket:${sessionId}`);
      
      // Notify the user that an agent has been assigned
      if (userSocketId) {
        io.to(userSocketId).emit('agentAssigned', { agentName });
      }
      
      // Notify the agent that they've been assigned
      socket.emit('assignmentConfirmed', { 
        sessionId, 
        agentName,
        timestamp: new Date()
      });
      
      console.log(`[SERVER] Agent ${agentName} assigned to session ${sessionId}`);
    } catch (error) {
      console.error('[SERVER] Error in agentAssigned:', error);
      socket.emit('assignmentRejected', { 
        sessionId, 
        reason: 'An error occurred while assigning the agent.'
      });
    }
  });

  socket.on('register', async ({ role, sessionId: clientSessionId, agentId, userName, userEmail, requestLiveChat = false }) => {
    // For admin connections, use the provided UUID sessionId
    // For user connections, fallback to socket.id if no sessionId provided
    const sessionId = clientSessionId || socket.id;
    socket.data.sessionId = sessionId;
    
    if (role === 'user') {
      socket.data.role = 'user';
      socket.data.userName = userName;
      socket.data.userEmail = userEmail;
      
      // Store the mapping in MongoDB
      await cache.setSocketMapping(sessionId, socket.id, 'user', {
        userName: userName || 'Anonymous',
        userEmail: userEmail || null
      });
      
      // Check if session exists
      try {
        const sessionResponse = await makeApiCall('GET', API_ENDPOINTS.GET_SESSION(sessionId));
        
        if (!sessionResponse.data.session) {
          // Create a new session using the API
          await makeApiCall('POST', 'CREATE_SESSION', {
            sessionId,
            userName: userName || 'Anonymous',
            userEmail: userEmail || null,
            requestLiveChat: !!requestLiveChat,
            conversationEnded: false
          });
        }
      } catch (error) {
        // If session not found, create a new one
        if (error.response && error.response.status === 404) {
          await makeApiCall('POST', 'CREATE_SESSION', {
            sessionId,
            userName: userName || 'Anonymous',
            userEmail: userEmail || null,
            requestLiveChat: !!requestLiveChat,
            conversationEnded: false
          });
        } else {
          console.error('[SERVER] Error checking session:', error);
        }
      }
      
      // Notify admins about the new chat session without creating a ticket
      try {
        console.log(`[SERVER] New chat session registered: ${sessionId}`);
        
        // Notify admins about the new chat session
        io.to('admins').emit('newChatSession', {
          sessionId,
          userName: userName || 'Anonymous',
          userEmail: userEmail || null,
          timestamp: new Date(),
          requestLiveChat: !!requestLiveChat
        });
        
      } catch (error) {
        console.error('[SERVER] Error creating ticket:', error);
      }
    } else if (role === 'admin') {
      socket.data.role = 'admin';
      socket.data.isAgent = true;
      
      // Store the actual agent ID (MongoDB ObjectId) from the frontend
      // Only store it if it's a valid MongoDB ObjectId
      if (agentId && /^[0-9a-fA-F]{24}$/.test(agentId)) {
        socket.data.agentId = agentId;
        console.log(`[SERVER] Registered admin with valid MongoDB ObjectId: ${agentId}`);
      } else {
        console.warn(`[SERVER] Admin registered without valid MongoDB ObjectId. Using socket ID for local tracking only.`);
      }
      
      socket.data.agentName = userName || 'Agent';
      
      // Store admin mapping in MongoDB
      await cache.setSocketMapping(sessionId, socket.id, 'admin', {
        agentName: userName || 'Agent',
        agentId: socket.data.agentId
      });
      
      socket.join('admins');
      
      // Notify the admin about any active chat sessions
      const activeSessions = await makeApiCall('GET', 'sessions/active/public');
      if (activeSessions.data && activeSessions.data.sessions) {
        activeSessions.data.sessions.forEach(session => {
          if (session.requestLiveChat) {
            socket.emit('newChatRequest', { 
              sessionId: session.sessionId, 
              userName: session.userName || null,
              timestamp: new Date()
            });
          }
        });
      }
    }
    
    console.log(`[SERVER] REGISTER: role=${role} sessionId=${sessionId} socketId=${socket.id}`);
  });

  // Handle conversation end by admin
  socket.on('endConversation', async ({ sessionId }) => {
    try {
      if (!socket.data.isAgent) {
        console.log(`[SERVER] Non-admin attempted to end conversation: ${sessionId}`);
        return;
      }

      console.log(`[SERVER] Admin ending conversation: ${sessionId}`);
      
      // Mark the session as ended using the API
      await makeApiCall('PATCH', API_ENDPOINTS.UPDATE_SESSION(sessionId), {
        conversationEnded: true,
        conversationEndedBy: socket.data.agentName,
        conversationEndedAt: new Date()
      });
      
      const userSocketId = await cache.getSocketBySession(sessionId, 'user');
      
      if (userSocketId) {
        io.to(userSocketId).emit('conversationEnded', { 
          message: 'The agent has ended this conversation.'
        });
      }
      
      // Notify all admins that the conversation has ended
      io.to('admins').emit('conversationEnded', { 
        sessionId,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('[SERVER] Error ending conversation:', error);
    }
  });

  socket.on('agentTyping', async ({ sessionId }) => {
    try{
      const userSocketId = await cache.getSocketBySession(sessionId, 'user');
      if (userSocketId) {
        io.to(userSocketId).emit('agentTyping', { sessionId });
      }
    } catch (error) {
      console.error('[SERVER] Error in agentTyping:', error);
    }
  });

  socket.on('userTyping', async ({ sessionId }) => {
    io.to('admins').emit('userTyping', { sessionId });
  });

  socket.on('userMessage', async ({ sessionId: payloadSessionId, text }) => {
    const sessionId = payloadSessionId || socket.data.sessionId;
    if (!sessionId) return console.error('No sessionId for userMessage');

    // Save message to chatbot database using the API
    const messageResponse = await makeApiCall('POST', 'CREATE_MESSAGE', {
      sessionId,
      from: 'user',
      text,
      timestamp: new Date()
    });

    // Invalidate cache
    await cache.del('preloadData');

    // Get the session data
    try {
      const sessionResponse = await makeApiCall('GET', API_ENDPOINTS.GET_SESSION(sessionId));
      const session = sessionResponse.data.session;
      
      // Log the user message
      console.log(`[SERVER] USER MESSAGE: ${text}`);
    } catch (error) {
      console.error('[SERVER] Error getting session data:', error);
    }

    // Broadcast to admins
    io.to('admins').emit('userMessage', {
      sessionId,
      text,
      timestamp: new Date()
    });

    console.log(`[SERVER] USER MESSAGE: ${text}`);
  });

  socket.on('agentMessage', async ({ sessionId, text }) => {
    try {
      const agentId = socket.data.agentId;
      if (!agentId) {
        console.error('No agentId for agentMessage');
        socket.emit('messageRejected', { 
          sessionId, 
          reason: 'Agent ID not found. Please reconnect.'
        });
        return;
      }
      
      const assignedAgentId = await cache.getAssignedAgent(sessionId);
      
      if (!assignedAgentId) {
        // No agent is assigned to this conversation yet
        console.log(`[SERVER] Agent ${socket.id} attempted to send message to unassigned session: ${sessionId}`);
        socket.emit('messageRejected', { 
          sessionId, 
          reason: 'You must join this conversation before sending messages.'
        });
        return;
      }
      
      if (assignedAgentId !== socket.id) {
        // Another agent is assigned to this conversation
        console.log(`[SERVER] Agent ${socket.id} attempted to send message to session assigned to ${assignedAgentId}`);
        socket.emit('messageRejected', { 
          sessionId, 
          reason: 'This conversation is being handled by another agent.'
        });
        return;
      }

      // Save message to chatbot database using the API
      const messageData = {
        sessionId,
        from: 'agent',
        text,
        agentName: socket.data.agentName || 'Agent',
        timestamp: new Date()
      };
      
      // Only add agentId if it's a valid MongoDB ObjectId (24 hex chars)
      // This ensures we're using the actual agent's MongoDB ObjectId from the frontend
      if (socket.data.agentId && /^[0-9a-fA-F]{24}$/.test(socket.data.agentId)) {
        messageData.agentId = socket.data.agentId;
        console.log(`[SERVER] Using agent ID: ${socket.data.agentId} for message`);
      } else {
        console.warn(`[SERVER] No valid MongoDB ObjectId found for agent. Message will be created without agentId reference.`);
      }
      
      await makeApiCall('POST', 'CREATE_MESSAGE', messageData);

      await cache.del('preloadData');

      // Log the agent message
      console.log(`[SERVER] AGENT MESSAGE: ${text} (from ${socket.data.agentName || 'Agent'})`);
      
      // Get the session data for reference
      try {
        const sessionResponse = await makeApiCall('GET', API_ENDPOINTS.GET_SESSION(sessionId));
        const session = sessionResponse.data.session;
      } catch (error) {
        console.error('[SERVER] Error getting session data:', error);
      }

      const userSocketId = await cache.getSocketBySession(sessionId, 'user');
      if (userSocketId) {
        io.to(userSocketId).emit('agentMessage', {
          sessionId,
          text,
          agentName: socket.data.agentName || 'Agent',
          timestamp: new Date()
        });
      }

      console.log(`[SERVER] AGENT MESSAGE: ${text}`);
    } catch (error) {
      console.error('[SERVER] Error in agentMessage:', error);
      socket.emit('messageRejected', { 
        sessionId, 
        reason: 'An error occurred while sending your message.'
      });
    }
  });

  socket.on('disconnect', async () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    if (socket.data.isAgent) {
      try {
        // Get all sessions assigned to this agent
        const assignedSessions = await cache.getAgentAssignments(socket.id);
        
        for (const sessionId of assignedSessions) {
          console.log(`[SERVER] Cleaning up session ${sessionId} after agent ${socket.id} disconnected`);
          
          await cache.removeAgentAssignment(sessionId);
          
          io.to('admins').emit('agentLeft', {
            sessionId,
            timestamp: new Date()
          });
          
          const userSocketId = await cache.getSocketBySession(sessionId, 'user');
          
          if (userSocketId) {
            io.to(userSocketId).emit('agentLeft', {
              message: 'The agent has left the conversation. Another agent will assist you shortly.'
            });
          }
          
          await makeApiCall('PATCH', API_ENDPOINTS.UPDATE_SESSION(sessionId), {
            agentDisconnectedAt: new Date(),
            agentLeft: true
          }).catch(err => console.error(`[SERVER] Error updating session: ${err.message}`));
        }
      } catch (error) {
        console.error('[SERVER] Error cleaning up after agent disconnect:', error);
      }
    }
    
    // Remove socket mappings
    await cache.removeSocketMapping(socket.id);
  });
});

// Cleanup job - run every 30 minutes
setInterval(async () => {
  try {
    await cache.cleanup();
    console.log('[CLEANUP] MongoDB cache cleanup completed');
  } catch (error) {
    console.error('[CLEANUP] Error during cleanup:', error);
  }
}, 30 * 60 * 1000);

httpServer.listen(5501, () => {
  console.log('🚀 Socket.IO server running on http://localhost:5501 (MongoDB mode)');
});
