# Chatbot Frontend Architecture

## Overview

The Chatbot Frontend is a Next.js 15 application that provides a modern, responsive chat interface for users to interact with the AI-powered campus support system. The application integrates with the Rasa backend for conversational AI and the chatbot server for real-time WebSocket communication.

## Technology Stack

### Core Technologies

- **Next.js 15.3.3**: React framework with server-side rendering and routing
- **React 19.0.0**: Frontend UI library with latest features
- **React DOM 19.0.0**: DOM manipulation for React components

### Key Dependencies

- **@glitchbytez/rasa-chat-widget 1.2.0**: Pre-built chat widget for Rasa integration

### Development Tools

- **Turbopack**: Fast bundler for development (enabled via `--turbopack` flag)
- **ESLint**: Code linting and quality enforcement

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Browser   │    │ Chatbot Frontend│    │  Rasa Backend   │
│                 │◄──►│    (Next.js)    │◄──►│     (5005)      │
│                 │    │     (3000)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Chatbot Server  │
                       │   (WebSocket)   │
                       │     (5501)      │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Helpdesk System │
                       │   (Backend)     │
                       │     (5500)      │
                       └─────────────────┘
```

### Component Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.js          # Root layout component
│   ├── page.js            # Home page with chat widget
│   ├── globals.css        # Global styles
│   └── favicon.ico        # Site favicon
├── components/            # Reusable React components
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
└── styles/               # Component-specific styles
```

## Core Components

### 1. Root Layout (`app/layout.js`)

**Purpose**: Defines the base HTML structure and metadata for all pages

**Key Features**:
- HTML document structure
- Meta tags for SEO and social sharing
- Global CSS imports
- Font loading and optimization

**Metadata Configuration**:
```javascript
export const metadata = {
  title: "Campus Support Chatbot",
  description: "AI-powered campus support system",
  // Additional SEO metadata
}
```

### 2. Chat Page (`app/page.js`)

**Purpose**: Main chat interface page that hosts the Rasa chat widget

**Key Features**:
- Rasa chat widget integration
- Responsive layout
- Error boundary handling
- Loading states

**Widget Configuration**:
```javascript
import { RasaChatWidget } from '@glitchbytez/rasa-chat-widget';

// Widget connects to Rasa server
const rasaServerUrl = process.env.NEXT_PUBLIC_RASA_URL || 'http://localhost:5005';
```

### 3. Chat Widget Integration

**Component**: `@glitchbytez/rasa-chat-widget`

**Configuration**:
- **Rasa Server URL**: Connects to Rasa backend for AI responses
- **WebSocket Support**: Real-time bidirectional communication
- **Customizable UI**: Themeable chat interface
- **Message Handling**: Supports text, images, and custom actions

**Props and Configuration**:
```javascript
<RasaChatWidget
  socketUrl={process.env.NEXT_PUBLIC_RASA_URL}
  socketPath="/socket.io"
  title="Campus Support"
  subtitle="How can I help you today?"
  customData={{
    userId: userId,
    sessionId: sessionId
  }}
/>
```

## Data Flow

### Message Flow Architecture

```
User Input → Chat Widget → WebSocket → Rasa Backend
                                         │
                                         ▼
                               AI Processing (OpenAI)
                                         │
                                         ▼
                               Response Generation
                                         │
                                         ▼
Bot Response ← Chat Widget ← WebSocket ← Rasa Backend
```

### Real-time Communication

1. **User Message Submission**:
   - User types message in chat widget
   - Widget validates and formats message
   - Message sent via WebSocket to Rasa server

2. **Bot Processing**:
   - Rasa receives message via Socket.IO
   - NLU processing extracts intent and entities
   - Dialogue management determines response
   - Custom actions may be triggered

3. **Response Delivery**:
   - Rasa sends response back via WebSocket
   - Chat widget receives and displays response
   - UI updates with typing indicators and status

### State Management

**Local State (React)**:
- Chat widget state (messages, UI state)
- Connection status
- User session data

**Session Persistence**:
- Conversation history (memory-based)
- User preferences (localStorage)
- Connection recovery state

## Environment Configuration

### Environment Variables

```bash
# Frontend URLs (Next.js Public Variables)
NEXT_PUBLIC_RASA_URL=http://localhost:5005
NEXT_PUBLIC_SOCKET_URL=http://localhost:5501

# Development Configuration
NODE_ENV=development|production
```

### Next.js Configuration (`next.config.mjs`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Build optimization
  experimental: {
    turbo: true
  }
};

export default nextConfig;
```

## Security Considerations

### Client-Side Security

1. **Environment Variables**:
   - Only `NEXT_PUBLIC_*` variables exposed to client
   - Sensitive data kept server-side only

2. **WebSocket Security**:
   - WSS (secure WebSocket) in production
   - Origin validation on server side

3. **Input Validation**:
   - Message length limits
   - XSS prevention through React's built-in escaping
   - Content Security Policy headers

### Data Privacy

1. **User Data**:
   - No persistent storage of sensitive information
   - Session-based conversation history
   - Clear data on session end

2. **GDPR Compliance**:
   - User consent for data processing
   - Right to data deletion
   - Minimal data collection

## Performance Optimization

### Next.js Optimizations

1. **Static Generation**:
   - Pre-rendered pages for fast loading
   - Automatic code splitting

2. **Image Optimization**:
   - Next.js Image component for optimized images
   - WebP format support

3. **Font Optimization**:
   - Google Fonts optimization
   - Font display swap

### Runtime Performance

1. **Bundle Size**:
   - Tree shaking for unused code elimination
   - Dynamic imports for code splitting

2. **Caching Strategy**:
   - Static assets cached at CDN level
   - API responses cached where appropriate

3. **Memory Management**:
   - WebSocket connection cleanup
   - Event listener cleanup

## Error Handling

### Client-Side Error Handling

1. **React Error Boundaries**:
   ```javascript
   class ChatErrorBoundary extends React.Component {
     componentDidCatch(error, errorInfo) {
       // Log error to monitoring service
       console.error('Chat widget error:', error, errorInfo);
     }
   }
   ```

2. **WebSocket Error Handling**:
   - Connection failure recovery
   - Automatic reconnection attempts
   - Graceful degradation

3. **User-Friendly Messages**:
   - Clear error messages for users
   - Fallback contact methods
   - Retry mechanisms

### Network Error Recovery

1. **Connection Monitoring**:
   - Online/offline detection
   - WebSocket state monitoring
   - Automatic reconnection

2. **Message Queue**:
   - Queue messages during disconnection
   - Retry failed messages
   - Duplicate message prevention

## Monitoring and Analytics

### Performance Monitoring

1. **Core Web Vitals**:
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

2. **User Experience Metrics**:
   - Chat widget load time
   - Message response time
   - Error rates

### User Analytics

1. **Conversation Metrics**:
   - Message volume
   - Session duration
   - User satisfaction scores

2. **Technical Metrics**:
   - Connection success rates
   - Error frequency
   - Performance benchmarks

## Development Workflow

### Development Server

```bash
# Start development server with Turbopack
npm run dev

# Server runs on http://localhost:3000
# Hot reload enabled for fast development
```

### Build Process

```bash
# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Code Quality

1. **ESLint Configuration**:
   - Next.js recommended rules
   - React hooks rules
   - Custom project rules

2. **Code Formatting**:
   - Consistent code style
   - Automated formatting on save

## Testing Strategy

### Unit Testing

1. **Component Testing**:
   - React component rendering
   - Props validation
   - Event handling

2. **Hook Testing**:
   - Custom hook behavior
   - State management
   - Side effects

### Integration Testing

1. **Widget Integration**:
   - Rasa chat widget functionality
   - WebSocket communication
   - Message flow

2. **API Integration**:
   - Backend service communication
   - Error handling
   - Response validation

### End-to-End Testing

1. **User Journey Testing**:
   - Complete conversation flows
   - Error scenarios
   - Cross-browser compatibility

## Deployment Architecture

### Build Artifacts

```
.next/
├── static/           # Static assets
├── server/          # Server-side code
└── cache/           # Build cache
```

### Production Configuration

1. **Environment Setup**:
   - Production environment variables
   - Performance monitoring
   - Error logging

2. **CDN Integration**:
   - Static asset delivery
   - Global edge caching
   - Image optimization

3. **Docker Deployment**:
   - Containerized application
   - Multi-stage builds
   - Health checks

---

*This architecture supports a scalable, maintainable, and user-friendly chat interface that integrates seamlessly with the broader campus support ecosystem.*

*Last updated: [Current Date]*
*Version: 1.0* 