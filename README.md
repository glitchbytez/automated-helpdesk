# Student Support Platform

A comprehensive multi-service application providing AI-powered chatbot assistance and human agent support for student services.

## 🏗️ System Architecture

This project consists of **8 interconnected services** organized into two main systems:

### Chatbot System (AI-Powered Support)
- **Chatbot Frontend** (Next.js) - Student chat interface
- **Chatbot Server** (Node.js/Socket.IO) - Real-time communication orchestrator  
- **Rasa Backend** (Python/Rasa) - Natural language processing engine
- **Chatbot Data Service** (Node.js) - Vector database and semantic search
- **Milvus Vector Database** - High-performance vector storage

### Helpdesk System (Human Agent Support)
- **Helpdesk Frontend** (Next.js) - Admin dashboard and agent interface
- **Helpdesk Backend** (Node.js/Express) - REST API and business logic
- **MongoDB Database** - Primary data storage

### Supporting Infrastructure
- **Etcd** - Distributed key-value store (Milvus dependency)
- **MinIO** - S3-compatible object storage
- **OpenAI API** - AI embeddings and language processing

## 📋 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd complete-project
cp .env.production .env
```

### 2. Start All Services
```bash
docker-compose up -d
```

### 3. Access Applications
- **Student Chat Interface**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001
- **Rasa API**: http://localhost:5005
- **Helpdesk API**: http://localhost:5500

## 🔗 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Chatbot Frontend | http://localhost:3000 | Student chat interface |
| Helpdesk Frontend | http://localhost:3001 | Admin/agent dashboard |
| Chatbot Server | http://localhost:5501 | WebSocket communication |
| Helpdesk Backend | http://localhost:5500 | REST API server |
| Rasa Backend | http://localhost:5005 | AI/NLP processing |
| Chatbot Data Service | http://localhost:5502 | Vector database management |
| MongoDB | mongodb://localhost:27017 | Primary database |
| Milvus | http://localhost:19530 | Vector database |

## 🎯 Key Features

### For Students
- **AI-Powered Chat**: Natural language support for common queries
- **Seamless Handoff**: Automatic escalation to human agents when needed
- **Knowledge Base Search**: Semantic search through uploaded documents
- **Multi-modal Support**: Text and file upload capabilities

### For Agents & Administrators
- **Ticket Management**: Comprehensive helpdesk functionality
- **Real-time Chat**: Live chat interface with students
- **User Management**: Agent and student account administration
- **Analytics & Reporting**: Performance metrics and insights
- **Knowledge Base Management**: Document upload and management

### Technical Features
- **Real-time Communication**: WebSocket-based messaging
- **Vector Search**: AI-powered semantic search capabilities
- **Containerized Deployment**: Docker-based infrastructure
- **Scalable Architecture**: Microservices-based design
- **Comprehensive API**: RESTful APIs with full documentation

## 📚 Documentation

### 🏛️ System Architecture
- **[Complete System Architecture](ARCHITECTURE.md)** - Comprehensive technical overview
- **[Docker Setup Guide](DOCKER_SETUP.md)** - Deployment and configuration

### 📖 Service Documentation

#### Chatbot System
- **[Chatbot Frontend](chatbot-frontend/docs/)** - User guide, architecture, deployment
- **[Chatbot Server](chatbot-server/docs/)** - Integration guide, technical architecture
- **[Rasa Backend](rasa-backend/docs/)** - Training guide, technical architecture
- **[Chatbot Data Service](chatbot-data-service/docs/)** - Technical architecture

#### Helpdesk System
- **[Helpdesk Frontend](helpdesk-frontend/docs/)** - User guide, technical architecture  
- **[Helpdesk Backend](helpdesk-backend/docs/)** - Admin guide, API documentation

## 🚀 Development

### Local Development Setup
```bash
# Install dependencies for each service
cd chatbot-frontend && npm install
cd ../helpdesk-frontend && npm install
cd ../helpdesk-backend && npm install
cd ../chatbot-server && npm install
cd ../chatbot-data-service && npm install

# Start development servers
npm run dev:all  # If script is configured
```

### Environment Configuration
Copy `.env.production` to `.env` and update values as needed:
- OpenAI API key for AI embeddings
- MongoDB connection string
- Email service configuration
- JWT secrets and API keys

### Testing
```bash
# Run tests for specific service
cd helpdesk-backend && npm test
cd ../chatbot-server && npm test

# Integration testing
docker-compose -f docker-compose.test.yml up
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
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Individual Services
```bash
# Start specific services
docker-compose up chatbot-frontend helpdesk-backend mongodb
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
- **Service Docs**: Check individual service `docs/` folders

### Troubleshooting
- Check service logs: `docker-compose logs <service-name>`
- Verify service health: `curl http://localhost:<port>/health`
- Review environment configuration
- Consult service-specific troubleshooting guides

### Getting Help
- Check the documentation first
- Review existing issues
- Create detailed bug reports
- Include logs and environment details

---

*Built with ❤️ for seamless student support experiences* 