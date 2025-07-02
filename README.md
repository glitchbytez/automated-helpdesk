# 🎓 Campus Support Helpdesk System

<div align="center">

![Campus Support](https://img.shields.io/badge/Campus-Support-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js)
![Rasa](https://img.shields.io/badge/Rasa-3.6-5A17EE?style=for-the-badge&logo=rasa)

**A comprehensive multi-service application designed to streamline campus support operations with an integrated helpdesk system and AI-powered chatbot.**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🌟 Features

### 🎯 **Helpdesk System**
- **📋 Ticket Management**: Create, assign, track, and resolve support tickets with full lifecycle management
- **👥 Role-Based Access**: Comprehensive admin, agent, and user roles with granular permissions
- **⚡ Real-time Updates**: WebSocket-based live ticket status updates and notifications
- **📚 Knowledge Base**: Centralized document management with semantic search capabilities
- **📊 Analytics & Reporting**: Comprehensive metrics, performance tracking, and detailed reports
- **📧 Email Notifications**: Automated email alerts for ticket updates and status changes
- **🔐 Security**: JWT authentication, role-based authorization, and input validation

### 🤖 **AI-Powered Chatbot**
- **🧠 Intelligent Responses**: Rasa-powered NLU for natural conversation flow and intent recognition
- **💭 Context Awareness**: Maintains conversation context across multiple interactions
- **🎫 Ticket Integration**: Direct ticket creation and tracking from chat interface
- **🔍 Vector Search**: Semantic search through knowledge base using Milvus vector database
- **🤝 Human Handoff**: Seamless escalation to human agents with context preservation
- **📱 Multi-channel**: Web interface with extensible architecture for additional platforms

### 🛠️ **Technical Excellence**
- **🏗️ Microservices Architecture**: Scalable, maintainable service-based design
- **🔄 Real-time Communication**: WebSocket connections for live updates and notifications
- **🗃️ Vector Database**: Milvus for efficient similarity search and semantic understanding
- **🤖 AI Embeddings**: OpenAI embeddings for advanced semantic text processing
- **📱 Responsive Design**: Modern, mobile-first UI built with Tailwind CSS and shadcn/ui
- **🐳 Containerized**: Complete Docker setup for development and production deployment

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        HF[Helpdesk Frontend<br/>Next.js]
        CF[Chatbot Frontend<br/>Next.js]
    end
    
    subgraph "API Layer"
        HB[Helpdesk Backend<br/>Node.js/Express]
        CS[Chatbot Server<br/>WebSocket]
        CDS[Chatbot Data Service<br/>Vector Management]
    end
    
    subgraph "AI Layer"
        RB[Rasa Backend<br/>Python/Rasa]
    end
    
    subgraph "Data Layer"
        MDB[(MongoDB<br/>Primary Database)]
        MVS[(Milvus<br/>Vector Database)]
    end
    
    HF --> HB
    CF --> CS
    CF --> CDS
    CS --> HB
    CS --> RB
    CDS --> MVS
    RB --> MVS
    HB --> MDB
    CS --> MDB
    
    style HF fill:#e1f5fe
    style CF fill:#e1f5fe
    style HB fill:#f3e5f5
    style CS fill:#f3e5f5
    style CDS fill:#f3e5f5
    style RB fill:#fff3e0
    style MDB fill:#e8f5e8
    style MVS fill:#e8f5e8
```

### 🔧 **Service Overview**

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| **Helpdesk Frontend** | 3001 | Next.js 14, Tailwind CSS | Main support dashboard interface |
| **Chatbot Frontend** | 3000 | Next.js 14, Socket.IO | Interactive chat interface |
| **Helpdesk Backend** | 5500 | Node.js, Express, MongoDB | Core business logic & REST API |
| **Chatbot Server** | 5501 | Node.js, Socket.IO | WebSocket server for real-time chat |
| **Chatbot Data Service** | 5502 | Node.js, Milvus | Vector database management |
| **Rasa Backend** | 5005 | Python, Rasa 3.6 | Conversational AI engine |

---

## 🚀 Quick Start

### 📋 **Prerequisites**

- **Docker & Docker Compose** (recommended for quick setup)
- **Node.js 18+** (for local development)
- **Python 3.8+** (for Rasa development)
- **OpenAI API Key** (required for AI features)

### ⚡ **1-Minute Setup**

```bash
# 1. Clone the repository
git clone https://github.com/glitchbytez/complete-project.git
cd campus-support-helpdesk

# 2. Create environment file
cp .env.example .env
# Edit .env with your actual values (see Configuration section)

# 3. Start all services
docker compose up -d

# 4. Access the applications
# Helpdesk Dashboard: http://localhost:3001
# Chatbot Interface: http://localhost:3000
```

### 🔧 **Configuration**

Create your `.env` file with the following required variables:

```bash
# Copy the example file
cp .env.example .env

# Essential configurations:
OPENAI_API_KEY=your_openai_api_key_here
RASA_PRO_LICENSE=your_rasa_license_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
JWT_SECRET=your_secure_jwt_secret
```

> 📝 **Note**: The project uses a **single centralized `.env` file** in the root directory. Docker Compose automatically reads this file and distributes the appropriate environment variables to each service. This approach ensures consistency and eliminates the confusion of multiple environment files.

---

## 📡 Service Endpoints

| Service | Development URL | Purpose |
|---------|----------------|---------|
| **🏠 Helpdesk Dashboard** | http://localhost:3001 | Main support interface |
| **💬 Chatbot Interface** | http://localhost:3000 | AI chat interface |
| **🔌 Helpdesk API** | http://localhost:5500 | REST API endpoints |
| **🌐 WebSocket Server** | http://localhost:5501 | Real-time communication |
| **🗄️ Vector Database API** | http://localhost:5502 | Knowledge base management |
| **🤖 Rasa API** | http://localhost:5005 | AI conversation engine |

---

## 🛠️ Development

### 🏃‍♂️ **Local Development Setup**

```bash
# Start only infrastructure services
docker compose up mongodb milvus etcd minio -d

# Run services locally for development
cd helpdesk-backend && npm install && npm run dev
cd helpdesk-frontend && npm install && npm run dev
cd chatbot-data-service && npm install && npm run dev
cd chatbot-server && npm install && npm run dev
cd chatbot-frontend && npm install && npm run dev

# For Rasa development
cd rasa-backend && pip install -r requirements.txt && rasa run --enable-api
```

### 🔨 **Development Commands**

```bash
# Service Management
docker compose logs -f <service-name>        # View logs
docker compose restart <service-name>        # Restart service
docker compose exec <service-name> sh        # Enter container
docker compose build <service-name>          # Rebuild service

# Database Access
mongosh mongodb://admin:password123@localhost:27017/helpdesk?authSource=admin

# Health Checks
curl http://localhost:5500/api/health        # Helpdesk API
curl http://localhost:5502/api/health        # Vector Database
curl http://localhost:5005/webhooks/rest/webhook # Rasa API
```

### 🧪 **Testing**

```bash
# Backend API Tests
cd helpdesk-backend && npm test

# Frontend Tests (if configured)
cd helpdesk-frontend && npm test

# Integration Tests
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## 🛡️ Security Features

- **🔐 JWT Authentication**: Secure API access with refresh token support
- **⏱️ Rate Limiting**: API request throttling to prevent abuse
- **🛡️ Input Validation**: Comprehensive request sanitization and validation
- **🌐 CORS Configuration**: Secure cross-origin resource sharing
- **🔑 Environment Security**: Secure credential management and encryption
- **👥 Role-Based Access**: Granular permissions and access control

---

## 🔧 Technology Stack

### **Frontend Technologies**
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling framework
- **shadcn/ui** - Modern, accessible UI components
- **Socket.IO Client** - Real-time communication
- **React Hook Form** - Form handling and validation

### **Backend Technologies**
- **Node.js/Express** - REST API development
- **Socket.IO** - WebSocket server for real-time features
- **Rasa 3.6** - Open source conversational AI
- **MongoDB** - Document database for structured data
- **Milvus** - Vector database for AI embeddings

### **AI/ML Technologies**
- **OpenAI API** - Text embeddings and AI processing
- **Rasa NLU** - Natural language understanding
- **Vector Similarity Search** - Semantic search capabilities
- **LangChain** - AI application development framework

### **Infrastructure**
- **Docker & Docker Compose** - Containerization and orchestration
- **Nginx** - Load balancing and reverse proxy (production)
- **PM2** - Process management for Node.js applications

---

## 📊 Monitoring & Health Checks

Each service includes comprehensive health monitoring:

- **`/health`** - Basic service status
- **`/api/health`** - Detailed health information
- **Built-in Docker health checks** - Container-level monitoring
- **Performance metrics** - Response time and throughput tracking
- **Error logging** - Comprehensive error tracking and reporting

---

## 🚀 Deployment

### 🏠 **Local Development**
```bash
docker compose up -d
```

### 🌐 **Production Deployment**
```bash
# Using production configuration
docker compose -f docker-compose.prod.yml up -d

# With environment file
docker compose --env-file .env.production up -d
```

### ☁️ **Cloud Deployment**

The application is designed to be cloud-native and can be deployed on:

- **AWS**: ECS, EKS, or EC2 with Docker
- **Azure**: Container Instances or AKS
- **Google Cloud**: Cloud Run or GKE
- **DigitalOcean**: App Platform or Droplets

---

## 📚 Complete Documentation Suite

The Campus Support Helpdesk System comes with comprehensive documentation for all users:

### 🎯 **For End Users**
- [📖 **User Manual**](USER_MANUAL.md) - Complete guide covering all features and workflows
- [⚡ **Quick Reference**](QUICK_REFERENCE.md) - Essential information for daily use
- [📚 **User Guide Directory**](docs/USER_GUIDE.md) - Organized documentation index

### 🚀 **For Getting Started**
- [⚡ **Quick Setup**](SETUP.md) - Get running in 5 minutes
- [🔧 **Development Setup**](DEVELOPMENT.md) - Detailed development guide
- [🐳 **Docker Setup**](DOCKER_SETUP.md) - Container deployment guide

### 👨‍💻 **For Developers & Administrators**
- [🎯 **API Documentation**](helpdesk-backend/docs/technical/api.md) - REST API reference
- [👨‍💼 **Admin Guide**](helpdesk-backend/docs/user/admin-guide.md) - Administrative functions
- [🏗️ **Architecture Guide**](helpdesk-frontend/docs/technical/architecture.md) - System architecture
- [🤖 **Rasa Training Guide**](rasa-backend/docs/user/training-guide.md) - AI model training

### 🤝 **For Contributors**
- [🤝 **Contributing Guide**](CONTRIBUTING.md) - How to contribute to the project
- [🔒 **Security Policy**](SECURITY.md) - Security guidelines and reporting
- [📄 **License**](LICENSE) - MIT License terms

> 💡 **Quick Start**: New to the system? Start with the [Quick Reference](QUICK_REFERENCE.md) and then dive into the [User Manual](USER_MANUAL.md) as needed.

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

### 🌟 **How to Contribute**

1. **🍴 Fork the repository**
2. **🌿 Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **💝 Commit your changes**: `git commit -m 'Add amazing feature'`
4. **📤 Push to the branch**: `git push origin feature/amazing-feature`
5. **🔀 Open a Pull Request**

### 📋 **Development Guidelines**

- Follow the existing code style and conventions
- Add tests for new features when possible
- Update documentation for significant changes
- Ensure Docker builds pass before submitting PRs

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💖 Acknowledgments

- **Rasa** for the open-source conversational AI platform
- **Milvus** for the vector database technology
- **OpenAI** for the embedding models
- **Next.js & Tailwind CSS** for the modern frontend framework
- **shadcn/ui** for the beautiful UI components

---

## 🆘 Support

If you encounter any issues or have questions:

1. **📖 Check the documentation** in the `docs/` directories
2. **🔍 Search existing issues** in the GitHub repository
3. **🆕 Create a new issue** with detailed information
4. **💬 Join our community** discussions

---

<div align="center">

**⭐ If this project helped you, please consider giving it a star! ⭐**

Made with ❤️ for campus communities worldwide

</div> 