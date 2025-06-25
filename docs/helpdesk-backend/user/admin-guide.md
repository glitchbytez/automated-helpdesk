# Helpdesk Backend Administrator Guide

## Overview

This guide provides administrators with comprehensive instructions for managing, configuring, and maintaining the Helpdesk Backend system. The backend serves as the central management system for support tickets, user accounts, and system operations.

## System Administration

### Initial Setup

#### First-Time Configuration

1. **Database Setup**
   - Ensure MongoDB is running and accessible
   - Run database migrations if required
   - Verify connection to MongoDB instance

2. **Environment Configuration**
   - Set up all required environment variables
   - Configure email settings for notifications
   - Set JWT secrets and authentication parameters

3. **Admin Account Creation**
   ```bash
   # Create the first admin user
   npm run create-admin
   # Follow prompts to set up admin credentials
   ```

#### System Health Checks

Regular health monitoring is essential:

```bash
# Check system status
curl http://localhost:5500/api/v1/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "email": "configured",
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

### User Management

#### Creating User Accounts

**Admin Users:**
```bash
# Via script
npm run create-admin-user

# Via API
POST /api/v1/users
{
  "email": "admin@institution.edu",
  "password": "secure_password",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin"
}
```

**Agent Accounts:**
```bash
# Create support agent
POST /api/v1/users
{
  "email": "agent@institution.edu",
  "password": "temporary_password",
  "firstName": "Support",
  "lastName": "Agent",
  "role": "agent",
  "department": "IT Support"
}
```

#### Managing User Roles

**Role Hierarchy:**
- **Admin**: Full system access, user management, system configuration
- **Agent**: Ticket management, user support, reporting access
- **User**: Create tickets, view own tickets, basic support access

**Role Assignment:**
```bash
# Update user role
PATCH /api/v1/users/{userId}
{
  "role": "agent",
  "permissions": ["view_all_tickets", "assign_tickets", "close_tickets"]
}
```

#### User Account Actions

**Deactivate User:**
```bash
PATCH /api/v1/users/{userId}
{
  "isActive": false,
  "deactivationReason": "User left institution"
}
```

**Reset Password:**
```bash
POST /api/v1/auth/admin/reset-password
{
  "userId": "676c123456789abcdef",
  "sendEmail": true
}
```

### Ticket System Configuration

#### Ticket Categories

Configure categories to organize support requests:

```bash
# Add new category
POST /api/v1/admin/categories
{
  "name": "Network Issues",
  "description": "Problems related to network connectivity",
  "department": "IT Support",
  "defaultPriority": "normal",
  "autoAssignment": true
}
```

#### Priority Levels

Set up priority levels for proper ticket escalation:

```json
{
  "priorities": [
    {
      "level": "low",
      "name": "Low Priority",
      "slaHours": 72,
      "escalationHours": 48
    },
    {
      "level": "normal", 
      "name": "Normal Priority",
      "slaHours": 24,
      "escalationHours": 16
    },
    {
      "level": "high",
      "name": "High Priority", 
      "slaHours": 8,
      "escalationHours": 4
    },
    {
      "level": "urgent",
      "name": "Urgent",
      "slaHours": 2,
      "escalationHours": 1
    }
  ]
}
```

#### SLA Configuration

**Service Level Agreements:**
```bash
# Configure SLA rules
POST /api/v1/admin/sla
{
  "category": "technical",
  "priority": "high",
  "responseTime": 4, // hours
  "resolutionTime": 24, // hours
  "businessHoursOnly": true,
  "escalationRules": [
    {
      "condition": "no_response",
      "timeLimit": 6,
      "action": "escalate_to_manager"
    }
  ]
}
```

### Email Configuration

#### SMTP Settings

Configure email for notifications and communications:

```bash
# Environment variables
EMAIL_HOST=smtp.institution.edu
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=helpdesk@institution.edu
EMAIL_PASSWORD=secure_email_password
EMAIL_FROM_NAME=Campus Helpdesk
EMAIL_FROM_ADDRESS=helpdesk@institution.edu
```

#### Email Templates

**Customize notification templates:**

```bash
# Update ticket created template
PUT /api/v1/admin/email-templates/ticket-created
{
  "subject": "New Support Ticket Created - {{ticketNumber}}",
  "htmlBody": "<html>...</html>",
  "textBody": "Your ticket {{ticketNumber}} has been created..."
}
```

**Available Templates:**
- `ticket-created` - New ticket confirmation
- `ticket-assigned` - Ticket assignment notification
- `ticket-updated` - Status update notification
- `ticket-resolved` - Resolution notification
- `password-reset` - Password reset email

### System Monitoring

#### Performance Metrics

**Key Performance Indicators (KPIs):**

1. **Response Time Metrics**
   ```bash
   GET /api/v1/admin/metrics/response-times
   ```

2. **Ticket Volume Trends**
   ```bash
   GET /api/v1/admin/metrics/ticket-volume?period=30d
   ```

3. **Agent Performance**
   ```bash
   GET /api/v1/admin/metrics/agent-performance
   ```

#### System Health Dashboard

Access real-time system status:

```bash
# System overview
GET /api/v1/admin/dashboard
{
  "activeTickets": 45,
  "pendingTickets": 12,
  "activeAgents": 8,
  "systemLoad": {
    "cpu": 25.5,
    "memory": 68.2,
    "database": "healthy"
  },
  "recentActivity": [...]
}
```

#### Error Monitoring

**Log Management:**
```bash
# View error logs
GET /api/v1/admin/logs?level=error&limit=50

# System error patterns
GET /api/v1/admin/logs/patterns
```

### Backup and Maintenance

#### Database Backup

**Regular Backup Schedule:**
```bash
# Create backup
npm run backup:create

# Automated daily backup (cron job)
0 2 * * * cd /path/to/app && npm run backup:create

# Restore from backup
npm run backup:restore --file=backup-2025-01-15.tar.gz
```

#### System Updates

**Update Process:**
1. **Backup Current System**
2. **Test Update in Staging**
3. **Schedule Maintenance Window**
4. **Deploy Update**
5. **Verify System Health**

```bash
# Check for updates
npm run check-updates

# Apply updates
npm run update --version=1.2.0

# Rollback if needed
npm run rollback --version=1.1.5
```

### Security Management

#### Authentication Security

**JWT Configuration:**
```bash
# Secure JWT settings
JWT_SECRET=very-long-random-string-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=campus-helpdesk
```

**Password Policies:**
```bash
# Configure password requirements
PUT /api/v1/admin/security/password-policy
{
  "minLength": 8,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireNumbers": true,
  "requireSpecialChars": true,
  "preventReuse": 5,
  "maxAge": 90 // days
}
```

#### API Security

**Rate Limiting:**
```bash
# Configure rate limits
PUT /api/v1/admin/security/rate-limits
{
  "general": {
    "windowMs": 900000, // 15 minutes
    "max": 100 // requests
  },
  "auth": {
    "windowMs": 900000,
    "max": 5
  }
}
```

**IP Whitelisting:**
```bash
# Allow specific IP ranges
PUT /api/v1/admin/security/ip-whitelist
{
  "enabled": true,
  "ranges": [
    "192.168.1.0/24",
    "10.0.0.0/8"
  ]
}
```

### Integration Management

#### Third-Party Integrations

**LDAP/Active Directory:**
```bash
# Configure LDAP authentication
PUT /api/v1/admin/integrations/ldap
{
  "enabled": true,
  "server": "ldap.institution.edu",
  "port": 389,
  "baseDN": "dc=institution,dc=edu",
  "userAttribute": "sAMAccountName",
  "emailAttribute": "mail"
}
```

**Single Sign-On (SSO):**
```bash
# Configure SAML SSO
PUT /api/v1/admin/integrations/sso
{
  "provider": "saml",
  "entityId": "campus-helpdesk",
  "ssoUrl": "https://sso.institution.edu/login",
  "certificatePath": "/path/to/cert.pem"
}
```

### Reporting and Analytics

#### Built-in Reports

**Standard Reports:**
- Daily ticket summary
- Agent performance metrics
- Customer satisfaction scores
- System usage statistics

```bash
# Generate monthly report
POST /api/v1/admin/reports/generate
{
  "type": "monthly_summary",
  "period": "2025-01",
  "includeCharts": true,
  "deliveryMethod": "email",
  "recipients": ["admin@institution.edu"]
}
```

#### Custom Reports

**Create Custom Queries:**
```bash
POST /api/v1/admin/reports/custom
{
  "name": "High Priority Response Times",
  "description": "Track response times for high priority tickets",
  "query": {
    "collection": "tickets",
    "filters": {
      "priority": "high",
      "createdAt": {"$gte": "2025-01-01"}
    },
    "aggregation": [
      {"$group": {"_id": "$assignedTo", "avgResponseTime": {"$avg": "$responseTime"}}}
    ]
  },
  "schedule": "weekly"
}
```

### Troubleshooting

#### Common Issues

**Database Connection Problems:**
```bash
# Check MongoDB status
systemctl status mongod

# Test connection
node -e "const mongoose = require('mongoose'); 
         mongoose.connect('mongodb://localhost:27017/helpdesk')
         .then(() => console.log('Connected'))
         .catch(err => console.error('Error:', err));"
```

**Email Delivery Issues:**
```bash
# Test email configuration
npm run test:email --to=test@example.com
```

**Performance Issues:**
```bash
# Check system resources
npm run diagnostics

# Database performance
npm run db:analyze

# Clear application cache
npm run cache:clear
```

#### Maintenance Mode

**Enable Maintenance Mode:**
```bash
# Put system in maintenance mode
POST /api/v1/admin/maintenance
{
  "enabled": true,
  "message": "System maintenance in progress. Please try again in 30 minutes.",
  "allowedRoles": ["admin"]
}
```

### Command Line Tools

#### Available Scripts

```bash
# User management
npm run create-admin-user
npm run create-agent-user
npm run list-users
npm run deactivate-user --email=user@example.com

# Database operations
npm run db:migrate
npm run db:seed
npm run db:reset
npm run db:backup

# System operations
npm run health-check
npm run clear-cache
npm run generate-report --type=daily

# Development tools
npm run dev          # Start development server
npm run test         # Run test suite
npm run lint         # Code quality check
```

### Best Practices

#### Security Best Practices

1. **Regular Updates**: Keep all dependencies updated
2. **Strong Passwords**: Enforce strong password policies
3. **Regular Backups**: Automated daily backups
4. **Access Logging**: Monitor all admin activities
5. **Principle of Least Privilege**: Grant minimum required permissions

#### Performance Best Practices

1. **Database Indexing**: Maintain proper database indexes
2. **Cache Management**: Implement appropriate caching strategies
3. **Resource Monitoring**: Regular system resource monitoring
4. **Query Optimization**: Optimize database queries

#### Operational Best Practices

1. **Change Management**: Document all system changes
2. **Incident Response**: Have incident response procedures
3. **Regular Audits**: Perform security and performance audits
4. **Documentation**: Keep documentation current

---

*This administrator guide should be reviewed and updated regularly to reflect system changes and new features.*

*Last updated: [Current Date]*
*Version: 1.0* 