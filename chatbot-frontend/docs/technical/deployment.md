# Chatbot Frontend Deployment Guide

## Overview

This guide covers the deployment process for the Chatbot Frontend Next.js application, including Docker containerization, environment configuration, and production deployment strategies.

## Prerequisites

### System Requirements

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Docker**: Version 20.10 or higher (for containerized deployment)
- **Memory**: Minimum 2GB RAM for build process
- **Storage**: Minimum 1GB available space

### Dependencies

- Access to Rasa backend server
- WebSocket server for real-time communication
- Valid SSL certificates (for production)

## Environment Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Required - Backend Service URLs
NEXT_PUBLIC_RASA_URL=http://localhost:5005
NEXT_PUBLIC_SOCKET_URL=http://localhost:5501

# Optional - Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_NAME="Campus Support Chatbot"

# Optional - Analytics and Monitoring
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### Production Environment Variables

```bash
# Production URLs (update with your domain)
NEXT_PUBLIC_RASA_URL=https://your-domain.com/rasa
NEXT_PUBLIC_SOCKET_URL=wss://your-domain.com/chat

# Security Headers
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret
```

## Local Development Deployment

### Standard Node.js Deployment

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Development Server**:
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

3. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

### Development with Docker

1. **Build Docker Image**:
   ```bash
   docker build -t chatbot-frontend .
   ```

2. **Run Container**:
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_RASA_URL=http://localhost:5005 \
     -e NEXT_PUBLIC_SOCKET_URL=http://localhost:5501 \
     chatbot-frontend
   ```

## Docker Deployment

### Dockerfile Analysis

```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and set permissions
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
RUN npm run build

# Copy application code and set ownership
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
```

### Build Commands

1. **Build Image**:
   ```bash
   docker build -t chatbot-frontend:latest .
   ```

2. **Build with Build Args**:
   ```bash
   docker build \
     --build-arg NODE_ENV=production \
     --build-arg NEXT_PUBLIC_RASA_URL=https://api.example.com/rasa \
     -t chatbot-frontend:v1.0.0 .
   ```

3. **Multi-platform Build**:
   ```bash
   docker buildx build \
     --platform linux/amd64,linux/arm64 \
     -t chatbot-frontend:latest .
   ```

### Container Runtime

1. **Basic Run**:
   ```bash
   docker run -d \
     --name chatbot-frontend \
     -p 3000:3000 \
     chatbot-frontend:latest
   ```

2. **With Environment Variables**:
   ```bash
   docker run -d \
     --name chatbot-frontend \
     -p 3000:3000 \
     -e NEXT_PUBLIC_RASA_URL=https://rasa.example.com \
     -e NEXT_PUBLIC_SOCKET_URL=wss://socket.example.com \
     chatbot-frontend:latest
   ```

3. **With Volume Mounts**:
   ```bash
   docker run -d \
     --name chatbot-frontend \
     -p 3000:3000 \
     -v $(pwd)/logs:/app/logs \
     chatbot-frontend:latest
   ```

## Docker Compose Deployment

### Complete Stack Deployment

The application is designed to be deployed as part of a multi-container stack:

```yaml
version: '3.8'

services:
  chatbot-frontend:
    build:
      context: ./chatbot-frontend
      dockerfile: Dockerfile
    container_name: chatbot-frontend
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_RASA_URL: http://rasa-backend:5005
      NEXT_PUBLIC_SOCKET_URL: http://chatbot-server:5501
    ports:
      - "3000:3000"
    depends_on:
      - rasa-backend
      - chatbot-server
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Deployment Commands

1. **Start Full Stack**:
   ```bash
   docker-compose up -d
   ```

2. **Build and Start**:
   ```bash
   docker-compose up --build -d
   ```

3. **Scale Frontend**:
   ```bash
   docker-compose up --scale chatbot-frontend=3 -d
   ```

## Production Deployment Strategies

### 1. Traditional Server Deployment

#### Prerequisites
- Ubuntu 20.04 LTS or CentOS 8
- Node.js 18+ installed
- PM2 for process management
- Nginx for reverse proxy

#### Deployment Steps

1. **Server Setup**:
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   npm install -g pm2
   ```

2. **Application Deployment**:
   ```bash
   # Clone repository
   git clone <repository-url>
   cd chatbot-frontend
   
   # Install dependencies
   npm ci
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "chatbot-frontend" -- start
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### 2. Container Orchestration (Docker Swarm)

#### Swarm Service Definition

```yaml
version: '3.8'

services:
  chatbot-frontend:
    image: chatbot-frontend:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_RASA_URL=http://rasa-backend:5005
    ports:
      - "3000:3000"
    networks:
      - app-network
```

#### Deployment Commands

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml chatbot-stack

# Scale service
docker service scale chatbot-stack_chatbot-frontend=5

# Update service
docker service update --image chatbot-frontend:v2.0.0 chatbot-stack_chatbot-frontend
```

### 3. Kubernetes Deployment

#### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chatbot-frontend
  labels:
    app: chatbot-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chatbot-frontend
  template:
    metadata:
      labels:
        app: chatbot-frontend
    spec:
      containers:
      - name: chatbot-frontend
        image: chatbot-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_RASA_URL
          value: "http://rasa-backend-service:5005"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: chatbot-frontend-service
spec:
  selector:
    app: chatbot-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

## Performance Optimization

### Build Optimization

1. **Bundle Analysis**:
   ```bash
   npm install -g @next/bundle-analyzer
   ANALYZE=true npm run build
   ```

2. **Build Configuration**:
   ```javascript
   // next.config.mjs
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'standalone',
     experimental: {
       turbo: true
     },
     compress: true,
     images: {
       formats: ['image/webp', 'image/avif'],
     },
   };
   ```

### Runtime Optimization

1. **Memory Limits**:
   ```bash
   # Set Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=2048" npm start
   ```

2. **PM2 Configuration**:
   ```json
   {
     "apps": [{
       "name": "chatbot-frontend",
       "script": "npm",
       "args": "start",
       "instances": "max",
       "exec_mode": "cluster",
       "max_memory_restart": "1G",
       "node_args": "--max-old-space-size=2048"
     }]
   }
   ```

## Monitoring and Health Checks

### Health Check Implementation

```javascript
// pages/api/health.js
export default function handler(req, res) {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    version: process.env.NEXT_PUBLIC_APP_VERSION
  };
  
  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).json(healthcheck);
  }
}
```

### Monitoring Setup

1. **Application Monitoring**:
   ```bash
   # Install monitoring tools
   npm install @sentry/nextjs
   ```

2. **Metrics Collection**:
   ```javascript
   // Prometheus metrics endpoint
   import { register, collectDefaultMetrics } from 'prom-client';
   
   collectDefaultMetrics();
   
   export default async function handler(req, res) {
     res.setHeader('Content-Type', register.contentType);
     res.end(await register.metrics());
   }
   ```

## Security Configuration

### Security Headers

```javascript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};
```

### HTTPS Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**:
   ```bash
   # Clear cache and reinstall
   rm -rf .next node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Memory Issues**:
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

3. **Port Conflicts**:
   ```bash
   # Check port usage
   lsof -i :3000
   # Kill processes if needed
   kill -9 <PID>
   ```

### Debugging Commands

```bash
# Check container logs
docker logs chatbot-frontend

# Execute into container
docker exec -it chatbot-frontend sh

# Check process status
pm2 status
pm2 logs chatbot-frontend

# Monitor resource usage
htop
docker stats
```

## Rollback Procedures

### Docker Rollback

```bash
# Tag current version
docker tag chatbot-frontend:latest chatbot-frontend:backup

# Rollback to previous version
docker stop chatbot-frontend
docker rm chatbot-frontend
docker run -d --name chatbot-frontend chatbot-frontend:v1.0.0
```

### PM2 Rollback

```bash
# Stop current version
pm2 stop chatbot-frontend

# Deploy previous version
git checkout v1.0.0
npm ci
npm run build
pm2 restart chatbot-frontend
```

---

*This deployment guide ensures reliable, scalable, and secure deployment of the chatbot frontend across various environments.*

*Last updated: [Current Date]*
*Version: 1.0* 