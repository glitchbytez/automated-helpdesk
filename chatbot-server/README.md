# Chatbot Server

A production-ready MongoDB-based Socket.IO chatbot server with real-time agent assignment and message routing.

## Features

- **Real-time messaging** with Socket.IO
- **Agent assignment** system for live chat support
- **MongoDB persistence** for session and agent data
- **Automatic cleanup** of expired sessions and assignments
- **REST API** for session management and message history
- **Caching system** for improved performance
- **Production optimized** with minimal dependencies

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **MongoDB** - Database with TTL indexes for automatic cleanup
- **Mongoose** - MongoDB ODM
- **Axios** - HTTP client for external API calls

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd chatbot-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chatbot-realtime

# Backend API Configuration  
BACKEND_API_URL=http://localhost:5500/api/v1

# Server Configuration
PORT=5501
NODE_ENV=production
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run prod
```

### Standard
```bash
npm start
```

## API Endpoints

### Health Checks
- `GET /health` - Comprehensive health check with MongoDB status
- `GET /ready` - Readiness probe (for Kubernetes)
- `GET /live` - Liveness probe (for Kubernetes)

### Sessions
- `GET /sessions/ticket/:ticketId` - Get session by ticket ID
- `PATCH /sessions/:sessionId` - Update session data
- `GET /preload` - Get cached sessions and messages data
- `GET /messages/:sessionId` - Get messages for a session

## Socket.IO Events

### User Events
- `register` - Register as user or admin
- `userMessage` - Send message from user
- `userTyping` - User typing indicator

### Agent Events  
- `agentAssigned` - Assign agent to session
- `agentMessage` - Send message from agent
- `agentTyping` - Agent typing indicator
- `endConversation` - End conversation (admin only)

### System Events
- `assignmentConfirmed` - Agent assignment confirmed
- `assignmentRejected` - Agent assignment rejected
- `conversationEnded` - Conversation ended
- `agentLeft` - Agent disconnected

## MongoDB Collections

### SocketMappings
Stores session-to-socket relationships with 1-hour TTL.

### AgentAssignments  
Tracks agent-to-session assignments with 2-hour TTL.

### Caches
General purpose caching with configurable TTL.

## Production Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5501
CMD ["npm", "run", "prod"]
```

### PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start app.js --name chatbot-server
pm2 save
pm2 startup
```

### Performance Considerations

- **Connection pooling**: MongoDB connections are reused
- **TTL indexes**: Automatic cleanup of expired data
- **Caching**: 60-second cache for frequently accessed data
- **Minimal dependencies**: Only 6 production dependencies
- **Memory efficient**: No Redis overhead

## Monitoring

### Health Check Endpoints

The server provides multiple health check endpoints for monitoring:

#### `/health` - Comprehensive Health Check
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "server": "healthy",
    "mongodb": "healthy"
  }
}
```

**Status Codes:**
- `200` - Healthy or degraded but functional
- `503` - Unhealthy (service unavailable)

#### `/ready` - Readiness Probe
For Kubernetes deployments. Returns `200` when MongoDB is connected and ready.

#### `/live` - Liveness Probe  
For Kubernetes deployments. Always returns `200` if server is responding.

### Logging

The server logs key events:
- MongoDB connection status
- Socket connections/disconnections  
- Agent assignments
- Cache hits/misses
- Cleanup operations
- Health check failures

## Security

- **CORS** enabled for specified origins
- **Environment variables** for sensitive configuration
- **Input validation** on all socket events
- **Error handling** with proper error messages

## License

MIT License 