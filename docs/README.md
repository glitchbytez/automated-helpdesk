# Documentation Index

Welcome to the comprehensive documentation for the Student Support Platform. This directory contains **all project documentation** including the main project files and all service documentation organized by service name.

> 📁 **Complete Documentation Hub**: Everything you need is in this directory - from high-level project overview to detailed service documentation.

## 📋 Quick Navigation

### 🏛️ Main Documentation
- **[📖 Project Overview](PROJECT_README.md)** - Complete project overview and quick start
- **[🏗️ System Architecture](SYSTEM_ARCHITECTURE.md)** - Comprehensive technical architecture
- **[🐳 Docker Setup Guide](DOCKER_SETUP.md)** - Deployment and configuration guide

## 📚 Service Documentation

### 🤖 Chatbot System

#### Chatbot Frontend (Next.js - Port 3000)
📁 **[chatbot-frontend/](chatbot-frontend/)**
- **User Documentation**
  - **[User Guide](chatbot-frontend/user/user-guide.md)** - How to use the chat interface
  - **[Troubleshooting](chatbot-frontend/user/troubleshooting.md)** - Common issues and solutions
- **Technical Documentation**
  - **[Architecture](chatbot-frontend/technical/architecture.md)** - Component structure and design
  - **[Deployment](chatbot-frontend/technical/deployment.md)** - Build and deployment strategies

#### Chatbot Server (WebSocket - Port 5501)
📁 **[chatbot-server/](chatbot-server/)**
- **User Documentation**
  - **[Integration Guide](chatbot-server/user/integration-guide.md)** - WebSocket integration and usage
- **Technical Documentation**
  - **[Architecture](chatbot-server/technical/architecture.md)** - Real-time communication system

#### Rasa Backend (AI/NLP - Port 5005)
📁 **[rasa-backend/](rasa-backend/)**
- **User Documentation**
  - **[Training Guide](rasa-backend/user/training-guide.md)** - AI model training and management
- **Technical Documentation**
  - **[Architecture](rasa-backend/technical/architecture.md)** - NLP pipeline and AI components

#### Chatbot Data Service (Vector DB - Port 5502)
📁 **[chatbot-data-service/](chatbot-data-service/)**
- **Technical Documentation**
  - **[Architecture](chatbot-data-service/technical/architecture.md)** - Vector database and semantic search

### 🎫 Helpdesk System

#### Helpdesk Frontend (Admin Dashboard - Port 3001)
📁 **[helpdesk-frontend/](helpdesk-frontend/)**
- **User Documentation**
  - **[User Guide](helpdesk-frontend/user/user-guide.md)** - Complete guide for all user roles
- **Technical Documentation**
  - **[Architecture](helpdesk-frontend/technical/architecture.md)** - Frontend architecture and components

#### Helpdesk Backend (REST API - Port 5500)
📁 **[helpdesk-backend/](helpdesk-backend/)**
- **User Documentation**
  - **[Admin Guide](helpdesk-backend/user/admin-guide.md)** - System administration manual
- **Technical Documentation**
  - **[API Documentation](helpdesk-backend/technical/api.md)** - Complete REST API reference

## 🎯 Documentation by User Type

### 👨‍🎓 For Students
- **[Chatbot User Guide](chatbot-frontend/user/user-guide.md)** - How to use the AI chat interface
- **[Chat Troubleshooting](chatbot-frontend/user/troubleshooting.md)** - Solving chat-related issues

### 👨‍💼 For Agents
- **[Helpdesk User Guide](helpdesk-frontend/user/user-guide.md)** - Agent dashboard and tools
- **[Admin Guide](helpdesk-backend/user/admin-guide.md)** - Agent management features

### 👨‍💻 For Administrators
- **[System Architecture](SYSTEM_ARCHITECTURE.md)** - Complete system overview
- **[Docker Setup](DOCKER_SETUP.md)** - Deployment and infrastructure
- **[Admin Guide](helpdesk-backend/user/admin-guide.md)** - Administrative functions
- **[API Documentation](helpdesk-backend/technical/api.md)** - System integration

### 🛠️ For Developers
- **[System Architecture](SYSTEM_ARCHITECTURE.md)** - Technical system overview
- **[Chatbot Integration](chatbot-server/user/integration-guide.md)** - WebSocket development
- **[API Reference](helpdesk-backend/technical/api.md)** - Backend API development
- **[AI Training](rasa-backend/user/training-guide.md)** - Chatbot model development

### 🔌 For Integration Partners
- **[API Documentation](helpdesk-backend/technical/api.md)** - REST API integration
- **[WebSocket Integration](chatbot-server/user/integration-guide.md)** - Real-time communication
- **[System Architecture](SYSTEM_ARCHITECTURE.md)** - Integration points and data flows

## 📖 Documentation Types

### 📘 User Guides
User-facing documentation for end users, administrators, and operators:

| Service | User Documentation |
|---------|-------------------|
| Chatbot Frontend | [User Guide](chatbot-frontend/user/user-guide.md), [Troubleshooting](chatbot-frontend/user/troubleshooting.md) |
| Chatbot Server | [Integration Guide](chatbot-server/user/integration-guide.md) |
| Rasa Backend | [Training Guide](rasa-backend/user/training-guide.md) |
| Helpdesk Frontend | [User Guide](helpdesk-frontend/user/user-guide.md) |
| Helpdesk Backend | [Admin Guide](helpdesk-backend/user/admin-guide.md) |

### 🔧 Technical Documentation
Developer and system architect documentation:

| Service | Technical Documentation |
|---------|------------------------|
| Chatbot Frontend | [Architecture](chatbot-frontend/technical/architecture.md), [Deployment](chatbot-frontend/technical/deployment.md) |
| Chatbot Server | [Architecture](chatbot-server/technical/architecture.md) |
| Rasa Backend | [Architecture](rasa-backend/technical/architecture.md) |
| Chatbot Data Service | [Architecture](chatbot-data-service/technical/architecture.md) |
| Helpdesk Frontend | [Architecture](helpdesk-frontend/technical/architecture.md) |
| Helpdesk Backend | [API Documentation](helpdesk-backend/technical/api.md) |

## 🔍 Quick Reference

### Service URLs
| Service | URL | Purpose |
|---------|-----|---------|
| Chatbot Frontend | http://localhost:3000 | Student chat interface |
| Helpdesk Frontend | http://localhost:3001 | Admin/agent dashboard |
| Chatbot Server | http://localhost:5501 | WebSocket communication |
| Helpdesk Backend | http://localhost:5500 | REST API server |
| Rasa Backend | http://localhost:5005 | AI/NLP processing |
| Chatbot Data Service | http://localhost:5502 | Vector database management |

### Health Check Endpoints
| Service | Health Check URL |
|---------|------------------|
| Chatbot Frontend | http://localhost:3000/api/health |
| Helpdesk Frontend | http://localhost:3001/api/health |
| Chatbot Server | http://localhost:5501/health |
| Helpdesk Backend | http://localhost:5500/api/v1/health |
| Rasa Backend | http://localhost:5005/status |
| Chatbot Data Service | http://localhost:5502/api/health |

### API Endpoints
| Service | API Base URL |
|---------|--------------|
| Helpdesk Backend | http://localhost:5500/api/v1 |
| Rasa Backend | http://localhost:5005 |
| Chatbot Data Service | http://localhost:5502/api |

## 🚀 Getting Started

### For First-Time Users
1. **Start Here**: [Project Overview](PROJECT_README.md) - Complete project overview
2. **Setup**: [Docker Setup Guide](DOCKER_SETUP.md) - Get the system running
3. **Understand**: [System Architecture](SYSTEM_ARCHITECTURE.md) - How it all works together
4. **Use**: Choose your role-specific documentation above

### For Specific Tasks

#### Setting Up the System
- **[Docker Setup Guide](DOCKER_SETUP.md)** - Complete deployment guide
- **[Environment Configuration](DOCKER_SETUP.md#environment-configuration)** - Configuration details

#### Using the Chatbot
- **[Chatbot User Guide](chatbot-frontend/user/user-guide.md)** - Student interface
- **[Troubleshooting Chat Issues](chatbot-frontend/user/troubleshooting.md)** - Problem solving

#### Managing the Helpdesk
- **[Helpdesk User Guide](helpdesk-frontend/user/user-guide.md)** - Agent and admin interface
- **[Admin Guide](helpdesk-backend/user/admin-guide.md)** - System administration

#### Training the AI
- **[Rasa Training Guide](rasa-backend/user/training-guide.md)** - AI model management
- **[Rasa Architecture](rasa-backend/technical/architecture.md)** - Technical details

#### Integrating with APIs
- **[API Documentation](helpdesk-backend/technical/api.md)** - REST API reference
- **[WebSocket Integration](chatbot-server/user/integration-guide.md)** - Real-time communication

## 📝 Documentation Standards

All documentation in this repository follows these standards:
- **Clear Structure**: Organized sections with consistent formatting
- **Code Examples**: Practical examples for all technical concepts
- **User-Focused**: Written for the intended audience (users, admins, developers)
- **Up-to-Date**: Regularly updated with system changes
- **Cross-Referenced**: Links between related documentation

## 🆘 Need Help?

### Common Issues
- **Service Won't Start**: Check [Docker Setup Guide](DOCKER_SETUP.md#troubleshooting)
- **Chat Not Working**: See [Troubleshooting Guide](chatbot-frontend/user/troubleshooting.md)
- **API Issues**: Review [API Documentation](helpdesk-backend/technical/api.md)
- **AI Training Problems**: Check [Training Guide](rasa-backend/user/training-guide.md)

### Where to Find Information
1. **Quick Answers**: Check service-specific troubleshooting guides
2. **How-To Guides**: Look in user documentation for your role
3. **Technical Details**: Review technical architecture documents
4. **API Usage**: Consult API documentation and integration guides

### Support Contacts
- **Technical Issues**: Review technical architecture documents
- **User Issues**: Check user guides and troubleshooting sections
- **Integration Questions**: See API documentation and integration guides

---

*This documentation index provides easy navigation to all system documentation. Start with your role-specific sections above for the most relevant information.*

*Last updated: [Current Date]*
*Documentation Version: 1.0* 