# Health Check Examples

## Quick Test

Test the health endpoints manually:

```bash
# Basic health check
curl http://localhost:5501/health

# Readiness check  
curl http://localhost:5501/ready

# Liveness check
curl http://localhost:5501/live
```

## Expected Responses

### Healthy Server Response (`/health`)
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "server": "healthy",
    "mongodb": "healthy"
  }
}
```

### MongoDB Disconnected Response
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600.5,
  "environment": "production", 
  "version": "1.0.0",
  "services": {
    "server": "healthy",
    "mongodb": "unhealthy"
  }
}
```

## Docker Compose with Health Checks

```yaml
version: '3.8'
services:
  chatbot-server:
    build: .
    ports:
      - "5501:5501"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5501/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
```

## Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chatbot-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chatbot-server
  template:
    metadata:
      labels:
        app: chatbot-server
    spec:
      containers:
      - name: chatbot-server
        image: chatbot-server:latest
        ports:
        - containerPort: 5501
        livenessProbe:
          httpGet:
            path: /live
            port: 5501
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 5501
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Monitoring Integration

### Prometheus (metrics endpoint)
```javascript
// Add to app.js for Prometheus integration
app.get('/metrics', async (req, res) => {
  const metrics = {
    uptime_seconds: process.uptime(),
    mongodb_connection_state: require('mongoose').connection.readyState,
    active_connections: io.engine.clientsCount || 0,
    memory_usage: process.memoryUsage(),
    timestamp: Date.now()
  };
  
  res.set('Content-Type', 'text/plain');
  res.send(Object.entries(metrics)
    .map(([key, value]) => `chatbot_${key} ${value}`)
    .join('\n'));
});
```

### Load Balancer Configuration

#### Nginx
```nginx
upstream chatbot_servers {
    server 127.0.0.1:5501;
    server 127.0.0.1:5502;
    server 127.0.0.1:5503;
}

server {
    location / {
        proxy_pass http://chatbot_servers;
        
        # Health check
        health_check uri=/health 
                    interval=5s 
                    fails=3 
                    passes=2;
    }
}
```

#### AWS Application Load Balancer
- Target Group Health Check Path: `/health`
- Health Check Interval: 30 seconds
- Healthy Threshold: 2
- Unhealthy Threshold: 5

## Monitoring Scripts

### Simple Monitoring Script
```bash
#!/bin/bash
# monitor.sh

ENDPOINT="http://localhost:5501/health"
LOG_FILE="/var/log/chatbot-health.log"

while true; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT)
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ $RESPONSE -eq 200 ]; then
        echo "$TIMESTAMP - Health check OK ($RESPONSE)" >> $LOG_FILE
    else
        echo "$TIMESTAMP - Health check FAILED ($RESPONSE)" >> $LOG_FILE
        # Send alert (email, Slack, etc.)
    fi
    
    sleep 60
done
```

### Advanced Node.js Monitor
```javascript
// health-monitor.js
const axios = require('axios');

class HealthMonitor {
  constructor(endpoint = 'http://localhost:5501/health') {
    this.endpoint = endpoint;
    this.alertThreshold = 3; // failures before alert
    this.failureCount = 0;
  }

  async check() {
    try {
      const response = await axios.get(this.endpoint, { timeout: 5000 });
      
      if (response.status === 200 && response.data.status === 'ok') {
        this.failureCount = 0;
        console.log('✅ Health check passed');
        return true;
      } else {
        this.handleFailure('Degraded health status');
        return false;
      }
    } catch (error) {
      this.handleFailure(`Request failed: ${error.message}`);
      return false;
    }
  }

  handleFailure(reason) {
    this.failureCount++;
    console.log(`❌ Health check failed: ${reason} (${this.failureCount}/${this.alertThreshold})`);
    
    if (this.failureCount >= this.alertThreshold) {
      this.sendAlert(reason);
    }
  }

  sendAlert(reason) {
    // Implement your alerting logic
    console.log(`🚨 ALERT: Service unhealthy - ${reason}`);
    // Send email, Slack notification, etc.
  }
}

// Usage
const monitor = new HealthMonitor();
setInterval(() => monitor.check(), 30000); // Check every 30 seconds
```

## Usage Tips

1. **Development**: Use `/health` for manual testing
2. **Load Balancers**: Use `/health` for upstream health checks  
3. **Kubernetes**: Use `/live` and `/ready` for probes
4. **Monitoring Systems**: Parse `/health` JSON response for detailed status
5. **CI/CD**: Use health checks in deployment verification 