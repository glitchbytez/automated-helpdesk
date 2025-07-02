# Use the official Node.js runtime as a parent image
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and set permissions
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and install dependencies as root
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code and set ownership
COPY --chown=nodejs:nodejs . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 5502

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5502/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Define the command to run the application
CMD ["npm", "start"] 