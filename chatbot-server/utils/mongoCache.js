const mongoose = require('mongoose');
const { SocketMapping, AgentAssignment, Cache } = require('../models/realtime');

class MongoCache {
  constructor() {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      this.connect();
    }
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot-realtime';
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected for real-time operations');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  }

  // Socket mapping operations (replaces sessionToSocket, socketToSession)
  async setSocketMapping(sessionId, socketId, role, userData = {}) {
    try {
      await SocketMapping.findOneAndUpdate(
        { sessionId, role },
        { 
          socketId, 
          lastSeen: new Date(),
          ...userData
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error setting socket mapping:', error);
    }
  }

  async getSocketBySession(sessionId, role = 'user') {
    try {
      const mapping = await SocketMapping.findOne({ sessionId, role });
      return mapping ? mapping.socketId : null;
    } catch (error) {
      console.error('Error getting socket by session:', error);
      return null;
    }
  }

  async getSessionBySocket(socketId) {
    try {
      const mapping = await SocketMapping.findOne({ socketId });
      return mapping ? mapping.sessionId : null;
    } catch (error) {
      console.error('Error getting session by socket:', error);
      return null;
    }
  }

  async removeSocketMapping(socketId) {
    try {
      await SocketMapping.deleteMany({ socketId });
    } catch (error) {
      console.error('Error removing socket mapping:', error);
    }
  }

  // Agent assignment operations (replaces sessionAgent, agentSessions)
  async assignAgent(sessionId, agentSocketId, agentData = {}) {
    try {
      const assignment = await AgentAssignment.findOneAndUpdate(
        { sessionId },
        { 
          agentSocketId,
          lastActivity: new Date(),
          ...agentData
        },
        { upsert: true, new: true }
      );
      return assignment;
    } catch (error) {
      console.error('Error assigning agent:', error);
      return null;
    }
  }

  async getAssignedAgent(sessionId) {
    try {
      const assignment = await AgentAssignment.findOne({ sessionId });
      return assignment ? assignment.agentSocketId : null;
    } catch (error) {
      console.error('Error getting assigned agent:', error);
      return null;
    }
  }

  async getAgentAssignments(agentSocketId) {
    try {
      const assignments = await AgentAssignment.find({ agentSocketId });
      return assignments.map(a => a.sessionId);
    } catch (error) {
      console.error('Error getting agent assignments:', error);
      return [];
    }
  }

  async removeAgentAssignment(sessionId) {
    try {
      await AgentAssignment.deleteOne({ sessionId });
    } catch (error) {
      console.error('Error removing agent assignment:', error);
    }
  }

  async removeAllAgentAssignments(agentSocketId) {
    try {
      const assignments = await AgentAssignment.find({ agentSocketId });
      await AgentAssignment.deleteMany({ agentSocketId });
      return assignments.map(a => a.sessionId);
    } catch (error) {
      console.error('Error removing all agent assignments:', error);
      return [];
    }
  }

  // Cache operations (replaces Redis caching)
  async set(key, data, ttlSeconds = 3600) {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      await Cache.findOneAndUpdate(
        { key },
        { data, expiresAt },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  async get(key) {
    try {
      const cached = await Cache.findOne({ key });
      if (!cached) return null;
      
      // Check if expired (extra safety, MongoDB TTL should handle this)
      if (cached.expiresAt < new Date()) {
        await Cache.deleteOne({ key });
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  async del(key) {
    try {
      await Cache.deleteOne({ key });
    } catch (error) {
      console.error('Error deleting cache:', error);
    }
  }

  // Session search operations (replaces Redis keys search)
  async findSessionsByTicketId(ticketId) {
    try {
      // This would need to be implemented based on how you store session data
      // For now, we'll return null and fall back to API calls
      return null;
    } catch (error) {
      console.error('Error finding sessions by ticket ID:', error);
      return null;
    }
  }

  // Cleanup operations
  async cleanup() {
    try {
      // Remove expired entries manually (backup to TTL)
      const now = new Date();
      await Cache.deleteMany({ expiresAt: { $lt: now } });
      await SocketMapping.deleteMany({ lastSeen: { $lt: new Date(now - 3600000) } }); // 1 hour ago
      await AgentAssignment.deleteMany({ lastActivity: { $lt: new Date(now - 7200000) } }); // 2 hours ago
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

module.exports = MongoCache; 