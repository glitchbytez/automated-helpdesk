# Chatbot Server Integration Guide

## Overview

The Chatbot Server provides real-time WebSocket communication between the chatbot frontend, Rasa backend, and helpdesk system. It enables seamless handoffs from AI-powered chat to human support agents.

## Service Architecture

### Core Functions

1. **Real-time Messaging**: WebSocket-based communication
2. **Session Management**: User chat session handling  
3. **Agent Handoff**: Transfer from bot to human agents
4. **Message Routing**: Intelligent routing between services
5. **Presence Management**: Online/offline status tracking

### Integration Points

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Chatbot Frontend│◄──►│ Chatbot Server  │◄──►│ Helpdesk System │
│   (WebSocket)   │    │   (WebSocket)   │    │   (API/Socket)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Rasa Backend   │
                       │   (Socket.IO)   │
                       └─────────────────┘
```

## Client Integration

### WebSocket Connection

#### Basic Connection Setup

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5501', {
  transports: ['websocket', 'polling'],
  auth: {
    token: userAuthToken,
    userId: currentUserId
  }
});

socket.on('connect', () => {
  console.log('Connected to chatbot server');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

#### Authentication

```javascript
socket.emit('authenticate', {
  token: 'jwt_token_here',
  userInfo: {
    id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'student'
  }
});

socket.on('authenticated', (data) => {
  console.log('Authentication successful:', data);
});
```

### Message Exchange

#### Sending Messages

```javascript
// Send chat message
socket.emit('chat_message', {
  content: 'I need help with course registration',
  type: 'text',
  sessionId: currentSessionId,
  timestamp: new Date().toISOString()
});

// Send typing indicator
socket.emit('typing_start', { sessionId: currentSessionId });
socket.emit('typing_stop', { sessionId: currentSessionId });
```

#### Receiving Messages

```javascript
// Receive bot responses
socket.on('bot_message', (data) => {
  displayMessage({
    sender: 'bot',
    content: data.content,
    type: data.type,
    timestamp: data.timestamp
  });
});

// Receive agent messages
socket.on('agent_message', (data) => {
  displayMessage({
    sender: 'agent',
    senderName: data.agent.name,
    content: data.content,
    timestamp: data.timestamp
  });
});

// Handle typing indicators
socket.on('typing_start', (data) => {
  showTypingIndicator(data.sender);
});
```

## Event Reference

### Client Events (Outgoing)

| Event | Description | Payload |
|-------|-------------|---------|
| `authenticate` | Authenticate user session | `{ token, userInfo }` |
| `start_session` | Initialize chat session | `{ userInfo, initialMessage }` |
| `chat_message` | Send chat message | `{ content, sessionId }` |
| `typing_start` | Start typing indicator | `{ sessionId }` |
| `request_agent` | Request human agent | `{ sessionId, reason }` |

### Server Events (Incoming)

| Event | Description | Payload |
|-------|-------------|---------|
| `authenticated` | Authentication successful | `{ user, session }` |
| `session_started` | New session created | `{ sessionId }` |
| `bot_message` | Bot response | `{ content, type, sessionId }` |
| `agent_message` | Agent response | `{ content, agent, sessionId }` |
| `agent_assigned` | Agent assigned | `{ sessionId, agent }` |
| `error` | General error | `{ error, message }` |

## Advanced Features

### Agent Handoff

```javascript
// Request agent assistance
socket.emit('request_agent', {
  sessionId: currentSessionId,
  reason: 'complex_issue',
  priority: 'normal'
});

socket.on('agent_assigned', (data) => {
  showMessage(`${data.agent.name} has joined the conversation`);
});
```

### Error Handling

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  showErrorMessage('Unable to connect to chat service');
});

socket.on('error', (error) => {
  console.error('Chat error:', error);
  handleChatError(error);
});
```

### File Sharing

```javascript
// Upload and share file
socket.emit('chat_message', {
  content: `Shared file: ${file.name}`,
  type: 'file',
  file: {
    name: file.name,
    url: fileData.url,
    size: file.size
  },
  sessionId: currentSessionId
});
```

## Security Considerations

- Use secure WebSocket connections (WSS) in production
- Validate all user inputs before sending
- Implement proper authentication and authorization
- Handle token expiration gracefully
- Sanitize message content to prevent XSS

## Testing

```javascript
// Test connection
async function testConnection(url) {
  const socket = io(url, { timeout: 5000 });
  
  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      socket.disconnect();
      resolve({ success: true });
    });
    
    socket.on('connect_error', reject);
  });
}
```

---

*This integration guide provides the essential information for connecting to the Chatbot Server WebSocket service.*

*Last updated: [Current Date]*
*Version: 1.0* 