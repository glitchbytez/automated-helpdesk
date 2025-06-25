# Complete Project Architecture

## Overview

This document provides a comprehensive overview of the multi-service architecture powering the Student Support Platform. The system consists of two main applications - a **Chatbot System** for AI-powered assistance and a **Helpdesk System** for human agent support - with seamless integration between both.

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Student Support Platform                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │         Chatbot System          │    │        Helpdesk System             │ │
│  │                                 │    │                                     │ │
│  │  ┌─────────────────────────────┐ │    │  ┌─────────────────────────────────┐ │ │
│  │  │   Chatbot Frontend          │ │    │  │   Helpdesk Frontend            │ │ │
│  │  │   (Next.js - Port 3000)     │ │    │  │   (Next.js - Port 3001)        │ │ │
│  │  └─────────────────────────────┘ │    │  └─────────────────────────────────┘ │ │
│  │              │                   │    │              │                       │ │
│  │              ▼                   │    │              ▼                       │ │
│  │  ┌─────────────────────────────┐ │    │  ┌─────────────────────────────────┐ │ │
│  │  │   Chatbot Server            │ │◄──►│  │   Helpdesk Backend             │ │ │
│  │  │   (WebSocket - Port 5501)   │ │    │  │   (Express.js - Port 5500)     │ │ │
│  │  └─────────────────────────────┘ │    │  └─────────────────────────────────┘ │ │
│  │              │                   │    │              │                       │ │
│  │              ▼                   │    │              ▼                       │ │
│  │  ┌─────────────────────────────┐ │    │  ┌─────────────────────────────────┐ │ │
│  │  │      Rasa Backend           │ │    │  │         MongoDB                │ │ │
│  │  │   (AI/NLP - Port 5005)      │ │    │  │      (Port 27017)              │ │ │
│  │  └─────────────────────────────┘ │    │  └─────────────────────────────────┘ │ │
│  │              │                   │    │                                     │ │
│  │              ▼                   │    │                                     │ │
│  │  ┌─────────────────────────────┐ │    │                                     │ │
│  │  │  Chatbot Data Service       │ │    │                                     │ │
│  │  │   (Embeddings - Port 5502)  │ │    │                                     │ │
│  │  └─────────────────────────────┘ │    │                                     │ │
│  │              │                   │    │                                     │ │
│  │              ▼                   │    │                                     │ │
│  │  ┌─────────────────────────────┐ │    │                                     │ │
│  │  │      Milvus Vector DB       │ │    │                                     │ │
│  │  │      (Port 19530)           │ │    │                                     │ │
│  │  └─────────────────────────────┘ │    │                                     │ │
│  └─────────────────────────────────┘    └─────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                        Shared Infrastructure                                │ │
│  │                                                                             │ │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │   │    Etcd     │  │   MinIO     │  │  OpenAI API │  │   Docker        │   │ │
│  │   │ (Port 2379) │  │(Ports 9000/1)│  │  (External) │  │  Orchestration  │   │ │
│  │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Service Breakdown

### Chatbot System Components

#### 1. Chatbot Frontend (Next.js)
- **Purpose**: User interface for AI-powered chat
- **Technology**: Next.js 14, React, Tailwind CSS
- **Port**: 3000
- **Features**:
  - Real-time chat interface
  - WebSocket connection to chatbot server
  - File upload capabilities
  - Responsive design

#### 2. Chatbot Server (WebSocket Service)
- **Purpose**: Real-time communication orchestrator
- **Technology**: Node.js, Socket.IO
- **Port**: 5501
- **Features**:
  - WebSocket connection management
  - Message routing between services
  - Agent handoff coordination
  - Session management

#### 3. Rasa Backend (AI/NLP Engine)
- **Purpose**: Natural Language Processing and conversation management
- **Technology**: Rasa Open Source 3.6, Python
- **Ports**: 5005 (API), 5055 (Actions)
- **Features**:
  - Intent classification
  - Entity extraction
  - Dialogue management
  - Custom actions for ticket creation

#### 4. Chatbot Data Service (Vector Database Manager)
- **Purpose**: Knowledge base management and semantic search
- **Technology**: Node.js, Express.js
- **Port**: 5502
- **Features**:
  - Document processing (PDF extraction)
  - OpenAI embedding generation
  - Vector storage in Milvus
  - Semantic search capabilities

#### 5. Milvus Vector Database
- **Purpose**: High-performance vector storage and similarity search
- **Technology**: Milvus 2.5.5
- **Port**: 19530
- **Features**:
  - Vector similarity search
  - Cosine similarity metrics
  - Collection management
  - Scalable vector operations

### Helpdesk System Components

#### 1. Helpdesk Frontend (Admin Dashboard)
- **Purpose**: Agent and administrator interface
- **Technology**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Port**: 3001
- **Features**:
  - Ticket management dashboard
  - Real-time chat interface
  - User and agent management
  - Analytics and reporting
  - Knowledge base management

#### 2. Helpdesk Backend (API Server)
- **Purpose**: Core business logic and API services
- **Technology**: Node.js, Express.js
- **Port**: 5500
- **Features**:
  - RESTful API endpoints
  - Authentication and authorization
  - Ticket lifecycle management
  - User management
  - Real-time notifications
  - Email integration

#### 3. MongoDB Database
- **Purpose**: Primary data storage
- **Technology**: MongoDB
- **Port**: 27017
- **Features**:
  - User accounts and profiles
  - Ticket data and history
  - Chat messages and sessions
  - System configuration

### Supporting Infrastructure

#### 1. Etcd (Milvus Dependency)
- **Purpose**: Distributed key-value store for Milvus
- **Port**: 2379

#### 2. MinIO (Object Storage)
- **Purpose**: S3-compatible object storage for Milvus
- **Ports**: 9000 (API), 9001 (Console)

#### 3. OpenAI API
- **Purpose**: AI services for embeddings and language processing
- **Integration**: External API calls

## Data Flow Architecture

### 1. Student Chat Interaction Flow

```
Student → Chatbot Frontend → Chatbot Server → Rasa Backend
    ↓                                              ↓
Response ← WebSocket ← Message Router ← NLP Processing
                           ↓
                    (If complex query)
                           ↓
                  Chatbot Data Service → Milvus → Semantic Search
                           ↓
                    Knowledge Base Results
```

### 2. Agent Handoff Flow

```
Student Request → Rasa Backend → Custom Action → Helpdesk API
      ↓                                              ↓
Notification ← Helpdesk Frontend ← Real-time Update ← Ticket Created
      ↓
Agent Response → Helpdesk Backend → Chatbot Server → Student
```

### 3. Knowledge Base Processing Flow

```
Document Upload → Chatbot Data Service → Text Extraction
       ↓                    ↓
PDF Processing → Text Chunking → OpenAI Embeddings → Milvus Storage
       ↓                    ↓
Metadata Storage → Search Index → Vector Similarity Search
```

## Technology Stack Summary

### Frontend Technologies
- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: React Context, SWR for data fetching
- **Real-time**: Socket.IO client
- **Build Tool**: Webpack (via Next.js)

### Backend Technologies
- **API Framework**: Express.js (Node.js)
- **Real-time Communication**: Socket.IO
- **AI/ML**: Rasa Open Source, OpenAI API
- **Authentication**: JWT tokens
- **File Processing**: Multer, PDF-parse

### Databases
- **Primary Database**: MongoDB (document store)
- **Vector Database**: Milvus (similarity search)
- **Caching**: Redis (optional, for sessions)
- **Object Storage**: MinIO (S3-compatible)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Process Management**: PM2 (production)
- **Load Balancing**: Nginx (production)
- **Monitoring**: Built-in health checks

## Deployment Architecture

### Docker Compose Structure
```yaml
services:
  # Frontend Services
  chatbot-frontend:     # Student chat interface
  helpdesk-frontend:    # Admin dashboard
  
  # Backend Services  
  chatbot-server:       # WebSocket orchestrator
  helpdesk-backend:     # REST API server
  rasa-backend:         # AI/NLP engine
  chatbot-data-service: # Vector DB manager
  
  # Databases
  mongodb:              # Primary database
  milvus:              # Vector database
  etcd:                # Milvus dependency
  minio:               # Object storage
```

### Service Dependencies
```
chatbot-frontend     → chatbot-server
chatbot-server       → rasa-backend, helpdesk-backend
rasa-backend         → chatbot-data-service, helpdesk-backend
chatbot-data-service → milvus, openai-api
helpdesk-frontend    → helpdesk-backend
helpdesk-backend     → mongodb
milvus               → etcd, minio
```

## Security Architecture

### Authentication Flow
```
User Login → JWT Token → Service Authorization → Resource Access
     ↓              ↓              ↓              ↓
Credentials → Token Generation → Token Validation → API Access
```

### API Security
- **JWT Authentication**: Stateless token-based auth
- **Rate Limiting**: Request throttling per endpoint
- **CORS Configuration**: Restricted origin access
- **Input Validation**: Request payload sanitization
- **API Key Management**: External service authentication

## Environment Configuration

### Development Environment
```bash
# Chatbot System
CHATBOT_FRONTEND_URL=http://localhost:3000
CHATBOT_SERVER_URL=http://localhost:5501
RASA_SERVER_URL=http://localhost:5005
CHATBOT_DATA_SERVICE_URL=http://localhost:5502

# Helpdesk System  
HELPDESK_FRONTEND_URL=http://localhost:3001
HELPDESK_BACKEND_URL=http://localhost:5500

# Databases
MONGODB_URL=mongodb://localhost:27017/helpdesk
MILVUS_HOST=localhost:19530

# External Services
OPENAI_API_KEY=your_openai_api_key
```

### Production Environment
```bash
# Load-balanced URLs
CHATBOT_FRONTEND_URL=https://chat.yourdomain.com
HELPDESK_FRONTEND_URL=https://admin.yourdomain.com

# Internal service communication
INTERNAL_NETWORK=docker_internal

# Security
JWT_SECRET=production_secret
API_RATE_LIMITS=enabled
CORS_ORIGINS=restricted_origins
```

## Deployment Architecture

### Docker Compose Structure
```yaml
services:
  # Frontend Services
  chatbot-frontend:     # Student chat interface
  helpdesk-frontend:    # Admin dashboard
  
  # Backend Services  
  chatbot-server:       # WebSocket orchestrator
  helpdesk-backend:     # REST API server
  rasa-backend:         # AI/NLP engine
  chatbot-data-service: # Vector DB manager
  
  # Databases
  mongodb:              # Primary database
  milvus:              # Vector database
  etcd:                # Milvus dependency
  minio:               # Object storage
```

### Service Dependencies
```
chatbot-frontend     → chatbot-server
chatbot-server       → rasa-backend, helpdesk-backend
rasa-backend         → chatbot-data-service, helpdesk-backend
chatbot-data-service → milvus, openai-api
helpdesk-frontend    → helpdesk-backend
helpdesk-backend     → mongodb
milvus               → etcd, minio
```

## Security Architecture

### Authentication Flow
```
User Login → JWT Token → Service Authorization → Resource Access
     ↓              ↓              ↓              ↓
Credentials → Token Generation → Token Validation → API Access
```

### API Security
- **JWT Authentication**: Stateless token-based auth
- **Rate Limiting**: Request throttling per endpoint
- **CORS Configuration**: Restricted origin access
- **Input Validation**: Request payload sanitization
- **API Key Management**: External service authentication

## Environment Configuration

### Development Environment
```bash
# Chatbot System
CHATBOT_FRONTEND_URL=http://localhost:3000
CHATBOT_SERVER_URL=http://localhost:5501
RASA_SERVER_URL=http://localhost:5005
CHATBOT_DATA_SERVICE_URL=http://localhost:5502

# Helpdesk System  
HELPDESK_FRONTEND_URL=http://localhost:3001
HELPDESK_BACKEND_URL=http://localhost:5500

# Databases
MONGODB_URL=mongodb://localhost:27017/helpdesk
MILVUS_HOST=localhost:19530

# External Services
OPENAI_API_KEY=your_openai_api_key
```

---

*This architecture document provides a comprehensive overview of the Student Support Platform's multi-service design, enabling effective development, deployment, and maintenance of the system.*

*Last updated: [Current Date]*
*Version: 1.0* 