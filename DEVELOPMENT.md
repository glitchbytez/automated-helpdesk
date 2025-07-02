# Development Guide

This guide explains how to set up and work with the Campus Support Helpdesk System in a development environment.

## 🚀 Quick Start

### 1. Prerequisites
- **Docker Desktop 4.0+** or **Docker Engine 20.0+**
- **Docker Compose v2.0+**
- **Node.js 18+** (for local development)
- **Python 3.8+** (for Rasa development)

### 2. Clone and Setup
```bash
git clone [repository-url]
cd complete-project

# Create environment files
cp helpdesk-backend/.env.example helpdesk-backend/.env
cp chatbot-data-service/.env.example chatbot-data-service/.env
# Configure other services as needed
```

### 3. Start Development Environment
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## 🏗️ Development Architecture

### Service Structure
```
complete-project/
├── helpdesk-frontend/     # Next.js dashboard (port 3001)
├── chatbot-frontend/      # Next.js chat interface (port 3000)
├── helpdesk-backend/      # Node.js API server (port 5500)
├── chatbot-server/        # WebSocket server (port 5501)
├── chatbot-data-service/  # Vector DB service (port 5502)
├── rasa-backend/          # Rasa AI service (port 5005)
└── docker-compose.yml     # Service orchestration
```

### Service Dependencies
```
Frontend Services
├── helpdesk-frontend → helpdesk-backend
└── chatbot-frontend → chatbot-server, rasa-backend

Backend Services
├── helpdesk-backend → mongodb
├── chatbot-server → mongodb, helpdesk-backend
├── chatbot-data-service → milvus, openai-api
└── rasa-backend → milvus, openai-api

Infrastructure
├── mongodb (port 27017)
├── milvus (port 19530)
├── etcd (port 2379)
└── minio (port 9000)
```

## 🛠️ Development Commands

### Basic Service Management
```bash
# Start all services
docker compose up -d

# Start specific services
docker compose up helpdesk-backend mongodb -d

# View service logs
docker compose logs -f helpdesk-backend

# Restart specific service
docker compose restart helpdesk-backend

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Service Monitoring
```bash
# Check service status
docker compose ps

# View real-time logs
docker compose logs -f

# Monitor resource usage
docker stats

# Enter service container
docker compose exec helpdesk-backend bash
```

### Development Workflow
```bash
# 1. Start infrastructure services
docker compose up mongodb milvus etcd minio -d

# 2. Run individual services locally for development
cd helpdesk-backend
npm install
npm run dev

# 3. Or rebuild specific service after changes
docker compose build helpdesk-backend
docker compose up helpdesk-backend -d
```

## 🔧 Local Development Setup

### Option 1: Full Docker Development
```bash
# Start all services in Docker
docker compose up -d

# Make code changes in your editor
# Rebuild services when needed
docker compose build <service-name>
docker compose up <service-name> -d
```

### Option 2: Hybrid Development
```bash
# Start infrastructure only
docker compose up mongodb milvus etcd minio -d

# Run specific services locally
cd helpdesk-backend && npm run dev
cd helpdesk-frontend && npm run dev
# ... etc
```

### Option 3: Service-by-Service Development
```bash
# Start dependencies for a specific service
docker compose up mongodb -d  # For helpdesk-backend

# Run the service locally
cd helpdesk-backend
npm install
npm run dev
```

## 🔍 Service Configuration

### Environment Variables
Each service has its own environment configuration:

```bash
# Helpdesk Backend
helpdesk-backend/.env
├── NODE_ENV=development
├── MONGODB_URI=mongodb://admin:password123@localhost:27017/helpdesk?authSource=admin
├── JWT_SECRET=your_jwt_secret
└── PORT=5500

# Chatbot Data Service
chatbot-data-service/.env
├── NODE_ENV=development
├── MILVUS_HOST=localhost
├── MILVUS_PORT=19530
├── OPENAI_API_KEY=your_openai_key
└── PORT=5502
```

### Service URLs
| Service | URL | Health Check |
|---------|-----|-------------|
| Helpdesk Frontend | http://localhost:3001 | N/A |
| Chatbot Frontend | http://localhost:3000 | N/A |
| Helpdesk Backend | http://localhost:5500 | /api/health |
| Chatbot Data Service | http://localhost:5502 | /api/health |
| Chatbot Server | http://localhost:5501 | /health |
| Rasa Backend | http://localhost:5005 | /status |

## 🐛 Debugging & Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -an | findstr :5500   # Windows
lsof -i :5500                 # Linux/macOS

# Stop conflicting services
docker compose down
```

#### 2. Database Connection Issues
```bash
# Check MongoDB status
docker compose logs mongodb

# Test connection
mongosh mongodb://admin:password123@localhost:27017/helpdesk?authSource=admin
```

#### 3. Service Won't Start
```bash
# Check service logs
docker compose logs <service-name>

# Rebuild service
docker compose build <service-name>

# Remove containers and start fresh
docker compose down
docker compose up -d
```

#### 4. Volume Permission Issues (Linux/macOS)
```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./helpdesk-backend/uploads
sudo chown -R $USER:$USER ./chatbot-data-service/uploads
```

### Health Checks
```bash
# Check all service health
curl http://localhost:5500/api/health    # Helpdesk Backend
curl http://localhost:5502/api/health    # Chatbot Data Service
curl http://localhost:5501/health        # Chatbot Server
curl http://localhost:5005/status        # Rasa Backend
```

### Log Analysis
```bash
# View logs with timestamps
docker compose logs -f -t

# Filter logs for specific service
docker compose logs helpdesk-backend | grep ERROR

# Follow logs for multiple services
docker compose logs -f helpdesk-backend mongodb
```

## 📦 Dependency Management

### Node.js Services
```bash
# Install new dependencies
docker compose exec helpdesk-backend npm install package-name

# Update package.json and rebuild
docker compose build helpdesk-backend
docker compose up helpdesk-backend -d
```

### Python Services (Rasa)
```bash
# Install Python packages
docker compose exec rasa-backend pip install package-name

# Update requirements.txt and rebuild
docker compose build rasa-backend
docker compose up rasa-backend -d
```

## 🧪 Testing

### Unit Tests
```bash
# Run tests for specific service
docker compose exec helpdesk-backend npm test
docker compose exec chatbot-server npm test
```

### Integration Tests
```bash
# Test API endpoints
curl -X POST http://localhost:5500/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Test WebSocket connection
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:5501');
socket.on('connect', () => console.log('Connected'));
"
```

### Database Testing
```bash
# Test MongoDB connection
mongosh mongodb://admin:password123@localhost:27017/helpdesk?authSource=admin

# Test Milvus connection
python -c "
from pymilvus import connections
connections.connect('localhost', 19530)
print('Milvus connected')
"
```

## 🔄 Development Workflow

### 1. Starting a Development Session
```bash
# 1. Pull latest changes
git pull origin main

# 2. Start infrastructure
docker compose up mongodb milvus etcd minio -d

# 3. Start your service of choice
cd helpdesk-backend && npm run dev
# OR
docker compose up helpdesk-backend -d

# 4. Start frontend
cd helpdesk-frontend && npm run dev
```

### 2. Making Changes
```bash
# 1. Edit code in your preferred editor
# 2. For Docker services, rebuild after changes
docker compose build helpdesk-backend
docker compose up helpdesk-backend -d

# 3. For local services, changes are hot-reloaded
# 4. Test your changes
curl http://localhost:5500/api/health
```

### 3. Testing Changes
```bash
# View logs
docker compose logs -f helpdesk-backend

# Test specific functionality
curl -X GET http://localhost:5500/api/v1/tickets

# Check database changes
mongosh mongodb://admin:password123@localhost:27017/helpdesk?authSource=admin
```

### 4. Committing Changes
```bash
# Stop services
docker compose down

# Run tests
npm test

# Commit changes
git add .
git commit -m "Your commit message"
git push origin feature-branch
```

## 📊 Performance Monitoring

### Resource Usage
```bash
# Monitor container resources
docker stats

# Check disk usage
docker system df

# Clean up unused resources
docker system prune
```

### Service Performance
```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5500/api/health

# Check database performance
mongosh --eval "db.runCommand({serverStatus: 1})"
```

## 🚀 Advanced Development

### Custom Docker Builds
```bash
# Build with specific target
docker compose build --build-arg NODE_ENV=development helpdesk-backend

# Build without cache
docker compose build --no-cache helpdesk-backend
```

### Network Debugging
```bash
# Inspect Docker networks
docker network ls
docker network inspect complete-project_default

# Test inter-service communication
docker compose exec helpdesk-backend curl http://mongodb:27017
```

### Database Management
```bash
# Backup MongoDB
mongodump --uri="mongodb://admin:password123@localhost:27017/helpdesk?authSource=admin"

# Restore MongoDB
mongorestore --uri="mongodb://admin:password123@localhost:27017/helpdesk?authSource=admin" dump/
```

## 📋 Development Tips

1. **Service Isolation**: Develop services independently using Docker for dependencies
2. **Log Monitoring**: Always keep logs open when developing (`docker compose logs -f`)
3. **Health Checks**: Use health endpoints to verify service status
4. **Database GUI**: Use MongoDB Compass for database visualization
5. **API Testing**: Use Postman or curl for API development
6. **Hot Reload**: Use `npm run dev` for faster frontend development
7. **Container Cleanup**: Periodically run `docker system prune` to free space

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Development Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Rasa Documentation](https://rasa.com/docs/rasa/)

---

Happy developing! 🎉 