const mongoose = require('mongoose');

// Schema for socket-to-session mappings
const SocketMappingSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  socketId: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], required: true },
  userName: String,
  userEmail: String,
  agentName: String,
  agentId: String,
  lastSeen: { type: Date, default: Date.now, expires: 3600 } // Auto-delete after 1 hour
}, {
  timestamps: true
});

// Compound indexes for efficient lookups
SocketMappingSchema.index({ sessionId: 1, role: 1 });
SocketMappingSchema.index({ socketId: 1 });

// Schema for agent assignments
const AgentAssignmentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  agentSocketId: { type: String, required: true },
  agentId: String,
  agentName: String,
  assignedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now, expires: 7200 } // Auto-delete after 2 hours
}, {
  timestamps: true
});

// Schema for caching data with TTL
const CacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true, expires: 0 } // MongoDB TTL index
}, {
  timestamps: true
});

// Create models
const SocketMapping = mongoose.model('SocketMapping', SocketMappingSchema);
const AgentAssignment = mongoose.model('AgentAssignment', AgentAssignmentSchema);
const Cache = mongoose.model('Cache', CacheSchema);

module.exports = {
  SocketMapping,
  AgentAssignment,
  Cache
}; 