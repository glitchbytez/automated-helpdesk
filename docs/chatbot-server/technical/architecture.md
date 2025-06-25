# Chatbot Server Technical Architecture

## Overview

The Chatbot Server is a Node.js WebSocket service that orchestrates real-time communication between chatbot clients, the Rasa backend, and the helpdesk system. It manages chat sessions, handles agent handoffs, and provides seamless integration between AI-powered and human-assisted support.

## Technology Stack

### Core Technologies

- **Node.js 18+**: JavaScript runtime environment
- **Express.js**: Web application framework
- **Socket.IO**: Real-time bidirectional communication
- **MongoDB**: Session and message persistence
- **Redis**: Session cache and pub/sub (optional)

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Chatbot Server                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ WebSocket   │  │ Session     │  │ Message     │          │
│  │ Manager     │  │ Manager     │  │ Router      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Agent       │  │ Auth        │  │ API         │          │
│  │ Manager     │  │ Middleware  │  │ Gateway     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. WebSocket Manager

Handles Socket.IO connections and real-time communication.

```javascript
// utils/socketManager.js
class SocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const user = await this.verifyToken(token);
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user.id}`);
      
      socket.on('start_session', this.handleStartSession.bind(this, socket));
      socket.on('chat_message', this.handleChatMessage.bind(this, socket));
      socket.on('request_agent', this.handleAgentRequest.bind(this, socket));
      socket.on('disconnect', this.handleDisconnect.bind(this, socket));
    });
  }
}
```

### 2. Session Manager

Manages chat sessions and their lifecycle.

```javascript
// utils/sessionManager.js
class SessionManager {
  constructor() {
    this.activeSessions = new Map();
    this.sessionStore = new MongoSessionStore();
  }

  async createSession(userId, initialMessage) {
    const sessionId = this.generateSessionId();
    
    const session = {
      id: sessionId,
      userId: userId,
      status: 'active',
      type: 'bot', // 'bot' or 'agent'
      participants: [userId],
      messages: [],
      metadata: {
        startedAt: new Date(),
        lastActivity: new Date(),
        platform: 'web'
      }
    };

    this.activeSessions.set(sessionId, session);
    await this.sessionStore.save(session);
    
    return session;
  }

  async handoffToAgent(sessionId, reason = 'user_request') {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    // Find available agent
    const agent = await this.findAvailableAgent(session.metadata.category);
    
    if (agent) {
      session.type = 'agent';
      session.assignedAgent = agent.id;
      session.participants.push(agent.id);
      
      this.activeSessions.set(sessionId, session);
      await this.sessionStore.update(sessionId, session);
      
      return { success: true, agent };
    } else {
      // Add to queue
      await this.addToAgentQueue(sessionId, reason);
      return { success: false, queued: true };
    }
  }
}
```

### 3. Message Router

Routes messages between different services and participants.

```javascript
// utils/messageRouter.js
class MessageRouter {
  constructor(socketManager, rasaClient, helpdeskClient) {
    this.socketManager = socketManager;
    this.rasaClient = rasaClient;
    this.helpdeskClient = helpdeskClient;
  }

  async routeMessage(message, session) {
    switch (session.type) {
      case 'bot':
        return await this.routeToBot(message, session);
      case 'agent':
        return await this.routeToAgent(message, session);
      default:
        throw new Error('Unknown session type');
    }
  }

  async routeToBot(message, session) {
    try {
      // Send to Rasa for AI response
      const botResponse = await this.rasaClient.sendMessage({
        sender: session.userId,
        message: message.content,
        metadata: session.metadata
      });

      // Check if handoff is needed
      if (botResponse.intent === 'request_human_help') {
        await this.initiateHandoff(session.id, 'bot_escalation');
      }

      return botResponse;
    } catch (error) {
      console.error('Bot routing error:', error);
      // Fallback to agent if bot fails
      await this.initiateHandoff(session.id, 'bot_failure');
      throw error;
    }
  }

  async routeToAgent(message, session) {
    // Send to helpdesk system
    return await this.helpdeskClient.sendMessage({
      sessionId: session.id,
      agentId: session.assignedAgent,
      userId: session.userId,
      content: message.content,
      type: message.type
    });
  }
}
```

### 4. Agent Manager

Manages agent availability and assignment.

```javascript
// utils/agentManager.js
class AgentManager {
  constructor() {
    this.availableAgents = new Map();
    this.agentSessions = new Map();
    this.agentQueue = [];
  }

  async registerAgent(agentId, capabilities = []) {
    const agent = {
      id: agentId,
      status: 'available',
      capabilities: capabilities,
      currentSessions: [],
      maxSessions: 5,
      lastActivity: new Date()
    };

    this.availableAgents.set(agentId, agent);
    await this.processQueue();
  }

  async findAvailableAgent(category = null) {
    for (const [agentId, agent] of this.availableAgents) {
      if (agent.status === 'available' && 
          agent.currentSessions.length < agent.maxSessions) {
        
        // Check if agent has required capabilities
        if (category && !agent.capabilities.includes(category)) {
          continue;
        }

        return agent;
      }
    }
    return null;
  }

  async assignSession(agentId, sessionId) {
    const agent = this.availableAgents.get(agentId);
    if (!agent) throw new Error('Agent not found');

    agent.currentSessions.push(sessionId);
    agent.lastActivity = new Date();

    if (agent.currentSessions.length >= agent.maxSessions) {
      agent.status = 'busy';
    }

    this.availableAgents.set(agentId, agent);
    this.agentSessions.set(sessionId, agentId);
  }
}
```

## Real-time Communication Flow

### Message Flow Diagram

```
User Message → WebSocket → Session Manager → Message Router
                                                    │
                                                    ▼
                                            ┌──────────────┐
                                            │ Bot or Agent │
                                            └──────────────┘
                                                    │
                                                    ▼
Response ← WebSocket ← Session Manager ← Message Router
```

### Event Handling

```javascript
// Event handlers in main server
async function handleChatMessage(socket, data) {
  try {
    const { sessionId, content, type = 'text' } = data;
    
    // Validate session
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: 'Invalid session' });
      return;
    }

    // Create message object
    const message = {
      id: generateMessageId(),
      sessionId: sessionId,
      senderId: socket.user.id,
      content: content,
      type: type,
      timestamp: new Date()
    };

    // Route message
    const response = await messageRouter.routeMessage(message, session);
    
    // Broadcast response
    if (response) {
      socket.to(sessionId).emit('message_received', response);
      socket.emit('message_sent', { messageId: message.id, status: 'delivered' });
    }

  } catch (error) {
    console.error('Message handling error:', error);
    socket.emit('error', { message: 'Message delivery failed' });
  }
}
```

## Integration Interfaces

### Rasa Backend Integration

```javascript
// integrations/rasaClient.js
class RasaClient {
  constructor(rasaUrl) {
    this.rasaUrl = rasaUrl;
    this.socket = io(`${rasaUrl}/socket.io`);
  }

  async sendMessage(data) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Rasa timeout'));
      }, 30000);

      this.socket.emit('user_uttered', {
        text: data.message,
        parse_data: {
          intent: { name: '', confidence: 0 },
          entities: [],
          text: data.message
        }
      });

      this.socket.once('bot_uttered', (response) => {
        clearTimeout(timeout);
        resolve({
          content: response.text,
          type: 'text',
          intent: response.parse_data?.intent?.name,
          confidence: response.parse_data?.intent?.confidence,
          entities: response.parse_data?.entities || []
        });
      });
    });
  }
}
```

### Helpdesk Integration

```javascript
// integrations/helpdeskClient.js
class HelpdeskClient {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async createTicket(sessionData) {
    const response = await fetch(`${this.apiUrl}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        subject: `Chat Support Request - ${sessionData.id}`,
        description: `User requested agent assistance during chat session`,
        priority: 'normal',
        category: 'general',
        userId: sessionData.userId,
        metadata: {
          sessionId: sessionData.id,
          source: 'chat'
        }
      })
    });

    return response.json();
  }

  async sendMessage(messageData) {
    // Send message to helpdesk system
    // This could be via API or WebSocket depending on helpdesk implementation
  }
}
```

## Data Models

### Session Model

```javascript
const sessionSchema = {
  id: String,
  userId: String,
  status: String, // 'active', 'waiting', 'ended'
  type: String,   // 'bot', 'agent'
  participants: [String],
  assignedAgent: String,
  messages: [{
    id: String,
    senderId: String,
    content: String,
    type: String,
    timestamp: Date,
    metadata: Object
  }],
  metadata: {
    startedAt: Date,
    endedAt: Date,
    lastActivity: Date,
    category: String,
    priority: String,
    source: String,
    userAgent: String,
    ipAddress: String
  }
};
```

### Agent Model

```javascript
const agentSchema = {
  id: String,
  name: String,
  email: String,
  status: String, // 'available', 'busy', 'offline'
  capabilities: [String],
  currentSessions: [String],
  maxSessions: Number,
  performance: {
    totalSessions: Number,
    averageResponseTime: Number,
    satisfactionRating: Number
  },
  schedule: {
    timezone: String,
    workingHours: Object
  }
};
```

## Performance Considerations

### Scaling Strategies

1. **Horizontal Scaling**: Multiple server instances with load balancing
2. **Redis Adapter**: For Socket.IO clustering
3. **Session Sharding**: Distribute sessions across instances
4. **Connection Pooling**: Efficient database connections

### Memory Management

```javascript
// Periodic cleanup of inactive sessions
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

  for (const [sessionId, session] of sessionManager.activeSessions) {
    if (now - session.metadata.lastActivity > inactiveThreshold) {
      sessionManager.endSession(sessionId, 'timeout');
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes
```

### Monitoring and Metrics

```javascript
// Performance monitoring
class MetricsCollector {
  constructor() {
    this.metrics = {
      connectionsCount: 0,
      activeSessionsCount: 0,
      messagesPerSecond: 0,
      averageResponseTime: 0
    };
  }

  trackConnection() {
    this.metrics.connectionsCount++;
  }

  trackMessage(responseTime) {
    this.updateAverageResponseTime(responseTime);
    this.incrementMessageCounter();
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date(),
      uptime: process.uptime()
    };
  }
}
```

---

*This architecture provides a scalable foundation for real-time chat communication with support for both AI and human assistance.*

*Last updated: [Current Date]*
*Version: 1.0* 