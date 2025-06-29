# Campus Support Helpdesk System

A comprehensive multi-service application designed to streamline campus support operations with an integrated helpdesk system and AI-powered chatbot.

## 🌟 Features

### Helpdesk System
- **Ticket Management**: Create, assign, track, and resolve support tickets
- **Role-Based Access**: Admin, Agent, and User roles with appropriate permissions
- **Real-time Updates**: WebSocket-based live ticket status updates
- **Knowledge Base**: Document management for common issues and solutions
- **Reporting & Analytics**: Comprehensive ticket metrics and performance reports
- **Email Notifications**: Automated email alerts for ticket updates

### AI Chatbot
- **Intelligent Responses**: Rasa-powered NLU for natural conversation flow
- **Context Awareness**: Maintains conversation context across interactions
- **Ticket Integration**: Can create and track tickets directly from chat
- **Vector Search**: Semantic search through knowledge base using Milvus
- **Human Handoff**: Seamless escalation to human agents when needed
- **Multi-channel**: Web interface with potential for other platforms

### Technical Features
- **Microservices Architecture**: Scalable, maintainable service-based design
- **Real-time Communication**: WebSocket connections for live updates
- **Vector Database**: Milvus for efficient similarity search
- **Document Embeddings**: OpenAI embeddings for semantic understanding
- **Responsive Design**: Modern, mobile-first UI with Tailwind CSS
- **Security**: JWT authentication, role-based authorization, input validation

## 🏗️ Architecture

### Service Overview
```
Frontend Layer:
├── Helpdesk Frontend (Next.js) - Main dashboard interface
└── Chatbot Frontend (Next.js) - Chat interface

API Layer:
├── Helpdesk Backend (Node.js) - Core business logic & REST API
├── Chatbot Server (Node.js) - WebSocket server for real-time chat
└── Chatbot Data Service (Node.js) - Vector database management

AI Layer:
└── Rasa Backend (Python) - NLU/NLG conversational AI

Data Layer:
├── MongoDB - Primary database (tickets, users, chats)
└── Milvus - Vector database (embeddings, semantic search)
```

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for local development)
- **Python 3.8+** (for Rasa development)

### 1. Clone the Repository
```bash
git clone [repository-url]
cd complete-project
```

### 2. Environment Setup
```bash
# Create environment files (see .env.example in each service)
cp helpdesk-backend/.env.example helpdesk-backend/.env
cp chatbot-data-service/.env.example chatbot-data-service/.env
# ... configure other services as needed
```

### 3. Start with Docker
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## 📡 Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| **Helpdesk Frontend** | http://localhost:3001 | Main support dashboard |
| **Chatbot Frontend** | http://localhost:3000 | Chatbot interface |
| **Helpdesk Backend** | http://localhost:5500 | REST API |
| **Chatbot Data Service** | http://localhost:5502 | Vector database API |
| **Chatbot Server** | http://localhost:5501 | WebSocket server |
| **Rasa Backend** | http://localhost:5005 | Rasa NLU/Core API |

## 🔧 Development

### Local Development Setup

```bash
# Start infrastructure services only
docker compose up mongodb milvus etcd minio -d

# Run individual services locally
cd helpdesk-backend && npm install && npm run dev
cd helpdesk-frontend && npm install && npm run dev
cd chatbot-data-service && npm install && npm run dev
# ... etc
```

### Development Commands

```bash
# View service logs
docker compose logs -f <service-name>

# Restart specific service
docker compose restart <service-name>

# Enter service container
docker compose exec <service-name> sh

# Rebuild specific service
docker compose build <service-name>
```

### Database Access

```bash
# MongoDB
mongosh mongodb://admin:password123@localhost:27017/helpdesk?authSource=admin

# Milvus (requires Python client)
python -c "from pymilvus import connections; connections.connect('localhost', 19530)"
```

## 🧪 Testing

```bash
# Run tests for specific service
cd helpdesk-backend && npm test
cd chatbot-server && npm test

# Integration testing (if configured)
docker compose -f docker-compose.test.yml up
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js/Express** - REST APIs
- **Socket.IO** - WebSocket server
- **Rasa 3.6** - Conversational AI
- **MongoDB** - Document database
- **Milvus** - Vector database

### AI/ML
- **OpenAI API** - Text embeddings
- **Rasa NLU** - Intent classification
- **Vector Similarity Search** - Semantic search

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Load balancing (production)
- **PM2** - Process management

## 🔒 Security Features

- **JWT Authentication** - Secure API access
- **Rate Limiting** - API request throttling
- **Input Validation** - Request sanitization
- **CORS Configuration** - Cross-origin protection
- **Environment Security** - Secure credential management

## 📊 Monitoring & Health Checks

Each service includes health check endpoints:
- `/health` or `/api/health` - Service status
- `/status` - Detailed service information
- Built-in Docker health checks
- Performance metrics collection

## 🔄 Deployment Options

### Development
```bash
docker compose up -d
```

### Production
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Individual Services
```bash
# Start specific services
docker compose up chatbot-frontend helpdesk-backend mongodb
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## 📝 License

[Your License Here]

## 🆘 Support

### Documentation
- **System Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Setup Guide**: See [DOCKER_SETUP.md](DOCKER_SETUP.md)
- **Development Guide**: See [DEVELOPMENT.md](DEVELOPMENT.md)
- **All Service Documentation**: Browse [docs/](docs/) directory

### Troubleshooting
- Check service logs: `docker compose logs <service-name>`
- Verify service health: `curl http://localhost:<port>/health`
- Review environment configuration
- Consult service-specific troubleshooting guides

---

*Built with ❤️ for seamless student support experiences* 