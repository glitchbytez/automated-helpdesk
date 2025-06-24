# Production Setup Guide

This document outlines the changes made to prepare the helpdesk backend for production deployment.

## Changes Made

### 1. Dependencies Cleanup
- **Removed unnecessary packages** from `package.json`:
  - `debug` - Not used in the codebase
  - `http-errors` - Not used in the codebase  
  - `node-fetch` - Not used in the codebase
  - `pug` - Not used (this is an API, not a view-based app)
  - `slugify` - Not used in the codebase

- **Moved development dependencies**:
  - `nodemon` moved to `devDependencies`

- **Updated project version** from `0.0.0` to `1.0.0`
- **Added Node.js engine requirement** (`>=18.0.0`)

### 2. Git Configuration
- **Created comprehensive `.gitignore`** with:
  - Node.js specific ignores
  - Environment files
  - IDE files
  - OS-generated files
  - Logs and temporary files
  - Production builds and certificates

- **Created `.dockerignore`** for optimized Docker builds

### 3. Production Configuration Files
- **`ecosystem.config.js`** - PM2 configuration for production deployment
  - Cluster mode for better performance
  - Memory restart limits
  - Log file management
  - Environment-specific settings

- **`logs/` directory** - Structured logging for production

## Production Deployment

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start in production mode
pm2 start ecosystem.config.js --env production

# Monitor
pm2 status
pm2 logs
pm2 monit
```

### Using Docker
```bash
# Build image
docker build -t campus-support-api .

# Run container
docker run -d \
  --name campus-support-api \
  -p 5500:5500 \
  --env-file .env.production \
  campus-support-api
```

### Environment Variables
Ensure the following environment variables are set for production:
- `NODE_ENV=production`
- `PORT=5500`
- `MONGODB_URI`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- Email configuration variables
- Frontend URL for CORS

## Security Considerations
- All sensitive data is properly ignored in version control
- Helmet middleware is configured for security headers
- JWT tokens have proper expiration
- CORS is configured with specific allowed origins
- Environment-specific configurations are separated

## Performance Optimizations
- Compression middleware enabled
- Cluster mode with PM2
- Memory limits configured
- Proper error handling and graceful shutdowns
- MongoDB connection pooling through Mongoose

## Monitoring
- Structured logging with timestamps
- PM2 process monitoring
- Health check endpoint at `/health`
- Error logging and handling middleware 