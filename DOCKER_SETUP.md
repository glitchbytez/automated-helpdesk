# Docker Setup Guide

This guide explains how to set up and run the complete multi-container application using Docker.

## Architecture Overview

The application consists of the following services:

### Core Services
- **Chatbot Frontend** (Port 3000) - Next.js application for the chatbot interface
- **Helpdesk Frontend** (Port 3001) - Next.js application for the helpdesk system
- **Helpdesk Backend** (Port 5000) - Node.js/Express API for helpdesk operations
- **Chatbot Data Service** (Port 3002) - Node.js/Express API for managing Milvus data
- **Chatbot Server** (Port 3003) - WebSocket server for real-time communication
- **Rasa Backend** (Ports 5005, 5055) - Rasa chatbot with action server

### Databases
- **MongoDB** (Port 27017) - Primary database for helpdesk system
- **Milvus** (Port 19530) - Vector database for chatbot embeddings
- **Etcd** (Port 2379) - Key-value store for Milvus
- **MinIO** (Ports 9000, 9001) - Object storage for Milvus

## Docker Architecture Philosophy

### Single Orchestration Point
This project follows the **single orchestration point** pattern:
- ✅ **One main `docker-compose.yml`** at the root level orchestrates ALL services
- ✅ **Individual `Dockerfile`** for each service defines how to build that service
- ✅ **Centralized environment configuration** in root `.env` file
- ❌ **No individual docker-compose files** in service directories (these create conflicts)

### Why This Architecture?
1. **Consistency**: All services use the same network and configuration
2. **No Port Conflicts**: Central orchestration prevents port collisions
3. **Simplified Management**: One command starts/stops the entire application
4. **Environment Clarity**: Single source of truth for all configuration
5. **Service Dependencies**: Proper dependency ordering and health checks

### File Structure:
```
complete-project/
├── docker-compose.yml          # 🎯 MAIN orchestration file
├── .env.example               # 🎯 MAIN environment template
├── .env                       # 🎯 MAIN environment configuration
├── chatbot-frontend/
│   ├── Dockerfile            # ✅ Service-specific build instructions
│   └── .dockerignore         # ✅ Service-specific ignore rules
├── helpdesk-backend/
│   ├── Dockerfile            # ✅ Service-specific build instructions
│   └── .dockerignore         # ✅ Service-specific ignore rules
└── [other-services]/
    ├── Dockerfile            # ✅ Service-specific build instructions
    └── .dockerignore         # ✅ Service-specific ignore rules
```

## Prerequisites

- Docker and Docker Compose installed
- At least 8GB of available RAM
- OpenAI API key (for chatbot functionality)

## Quick Start

1. **Clone and navigate to the project directory**
   ```bash
   cd /path/to/your/project
   ```

2. **Copy and configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file and update the following required values:
   ```env
   OPENAI_API_KEY=your-actual-openai-api-key
   JWT_SECRET=your-super-secret-jwt-key
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-email-password
   ```

3. **Build and start all services**
   ```bash
   docker-compose up -d
   ```

4. **Monitor the startup process**
   ```bash
   docker-compose logs -f
   ```

## Service Access Points

Once all services are running, you can access:

- **Chatbot Frontend**: http://localhost:3000
- **Helpdesk Frontend**: http://localhost:3001
- **Helpdesk API**: http://localhost:5500
- **Chatbot Data Service**: http://localhost:5502
- **WebSocket Server**: http://localhost:5501
- **Rasa API**: http://localhost:5005
- **MinIO Console**: http://localhost:9001 (admin/password123)

## Management Commands

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### Stop and remove all data (DESTRUCTIVE)
```bash
docker-compose down -v
```

### View logs for all services
```bash
docker-compose logs -f
```

### View logs for a specific service
```bash
docker-compose logs -f [service-name]
# Example: docker-compose logs -f helpdesk-backend
```

### Rebuild a specific service
```bash
docker-compose build [service-name]
docker-compose up -d [service-name]
```

### Scale a service (if needed)
```bash
docker-compose up -d --scale helpdesk-backend=2
```

## Development Workflow

### Making Code Changes

1. **For Node.js services** (helpdesk-backend, chatbot-data-service, chatbot-server):
   ```bash
   # Stop the specific service
   docker-compose stop [service-name]
   
   # Rebuild with changes
   docker-compose build [service-name]
   
   # Start the service
   docker-compose up -d [service-name]
   ```

2. **For Next.js frontends** (chatbot-frontend, helpdesk-frontend):
   ```bash
   # Rebuild and restart
   docker-compose build [frontend-service]
   docker-compose up -d [frontend-service]
   ```

3. **For Rasa backend**:
   ```bash
   # Rebuild (includes retraining)
   docker-compose build rasa-backend
   docker-compose up -d rasa-backend
   ```

### Database Management

#### MongoDB
```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p password123

# Backup database
docker-compose exec mongodb mongodump --out /data/backup

# View database logs
docker-compose logs mongodb
```

#### Milvus
```bash
# Check Milvus status
curl http://localhost:19530/health

# View Milvus logs
docker-compose logs milvus
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   - Ensure ports 3000-3003, 5000, 5005, 5055, 9000-9001, 19530, 27017 are not in use
   - Modify ports in `docker-compose.yml` if needed

2. **Insufficient memory**
   - Milvus requires significant memory. Ensure Docker has at least 8GB allocated
   - Consider scaling down services if needed

3. **Slow startup**
   - Initial build and data preparation can take 10-15 minutes
   - Rasa model training happens during container build

4. **Service connection issues**
   - Wait for all dependencies to be healthy before accessing applications
   - Check service logs for connection errors

### Health Checks

```bash
# Check all container status
docker-compose ps

# Test service endpoints
curl http://localhost:5500/api/health  # Helpdesk backend
curl http://localhost:5502/api/health  # Chatbot data service
curl http://localhost:5005/health  # Rasa server
```

### Debugging Steps

1. **Check container logs**
   ```bash
   docker-compose logs [service-name]
   ```

2. **Access container shell**
   ```bash
   docker-compose exec [service-name] sh
   ```

3. **Check network connectivity**
   ```bash
   docker-compose exec [service-name] ping [other-service-name]
   ```

4. **Restart problematic service**
   ```bash
   docker-compose restart [service-name]
   ```

## Production Considerations

### Security
- Change all default passwords in `.env`
- Use proper SSL certificates
- Implement proper firewall rules
- Regular security updates

### Performance
- Consider using production-optimized images
- Implement proper logging and monitoring
- Use external databases for better performance
- Implement load balancing for frontend services

### Backup Strategy
- Regular database backups
- Volume backups for persistent data
- Application configuration backups

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for LLM functionality | Required |
| `JWT_SECRET` | Secret key for JWT token generation | Required |
| `MONGODB_URI` | MongoDB connection string | Auto-configured |
| `EMAIL_USERNAME` | SMTP username for notifications | Required |
| `EMAIL_PASSWORD` | SMTP password for notifications | Required |
| `MILVUS_HOST` | Milvus database host | milvus |
| `MILVUS_PORT` | Milvus database port | 19530 |

For a complete list, see `.env.example`. 