# Campus Support Helpdesk Backend

Enterprise-grade Node.js/Express backend for the Campus Support Helpdesk System.

## Features

- **User Authentication & Authorization** - JWT-based auth with role-based permissions
- **Ticket Management System** - Complete CRUD operations with priority levels
- **Real-time Chat Support** - WebSocket integration for live communication
- **Email Notifications** - Automated notifications for ticket updates
- **Report Generation** - Analytics and reporting functionality
- **Default Account Creation** - Automatic setup of initial admin and user accounts
- **RESTful API Design** - Clean, documented API endpoints
- **Database Integration** - MongoDB with Mongoose ODM

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB database
- Valid email service (for notifications)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start

# For development (with auto-reload)
npm run dev
```

### Default Accounts

The system automatically creates default accounts when the user collection is empty:

**Automatic Creation:**
- Accounts are created automatically when the server starts and finds no existing users
- This ensures immediate system access for initial setup

**Default Credentials:**
- **Admin**: `admin@example.com` / `admin123`
- **Agent**: `agent@example.com` / `agent123` 
- **User**: `user@example.com` / `user123`

**Security Features:**
- All default accounts require password change on first login
- Passwords are automatically hashed using bcrypt
- Accounts have appropriate role-based permissions

### Manual Account Management

```bash
# Check which default accounts exist
npm run setup-accounts check

# Create all default accounts
npm run setup-accounts create

# Create specific account type
npm run setup-accounts create admin
npm run setup-accounts create agent
npm run setup-accounts create user

# View default credentials
npm run setup-accounts credentials

# Show help
npm run setup-accounts help

# Legacy admin creation (still available)
npm run create-admin
```

## API Documentation

### Authentication

All API endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Core Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/users` - List users (admin/agent)
- `POST /api/tickets` - Create support ticket
- `GET /api/tickets` - List tickets (role-based filtering)
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket (admin only)

### User Roles & Permissions

**Admin Role:**
- Full system access
- User management
- System settings
- All ticket operations
- Knowledge base management

**Agent Role:**
- View and manage assigned tickets
- Create tickets
- Access to support tools
- Limited user management

**Limited Role (User):**
- Create tickets
- View own tickets
- Basic profile management

## Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/helpdesk

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=90d

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Server Configuration
PORT=5500
NODE_ENV=production

# CORS Origins
CORS_ORIGIN=http://localhost:3001
```

## Database Schema

### User Model
- Authentication & profile information
- Role-based permissions system
- Password management with bcrypt
- Notification preferences

### Ticket Model
- Support ticket information
- Priority and status tracking
- Assignment and resolution workflow
- Activity history

## Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **Role-Based Access Control** - Granular permissions
- **Password Reset** - Secure token-based reset
- **Input Validation** - Comprehensive data validation
- **CORS Protection** - Configurable origin restrictions
- **Rate Limiting** - API request throttling
- **Security Headers** - Helmet.js security middleware

## Development

### Scripts

```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm run setup-accounts  # Account management
npm run create-admin    # Legacy admin creation
```

### Project Structure

```
helpdesk-backend/
├── app.js                 # Express app configuration
├── server.js              # Server startup & MongoDB connection
├── config/
│   └── env.js            # Environment configuration
├── controllers/          # Route controllers
├── middleware/           # Custom middleware
├── models/               # Mongoose schemas
├── routes/               # API routes
├── scripts/              # Utility scripts
├── utils/                # Helper utilities
└── logs/                 # Application logs
```

## Production Deployment

### Docker

```bash
# Build image
docker build -t helpdesk-backend .

# Run container
docker run -p 5500:5500 --env-file .env helpdesk-backend
```

### Environment Setup

1. **Database**: Set up MongoDB instance
2. **Email Service**: Configure SMTP/Gmail
3. **Environment Variables**: Set production values
4. **Security**: Use strong JWT secrets
5. **SSL**: Enable HTTPS in production

## Troubleshooting

### Common Issues

**Database Connection Errors:**
- Verify MongoDB URI and credentials
- Check network connectivity
- Ensure database service is running

**Authentication Issues:**
- Verify JWT secret configuration
- Check token expiration settings
- Validate user permissions

**Email Delivery Problems:**
- Confirm SMTP settings
- Check email service authentication
- Verify sender reputation

### Logs

Application logs are stored in the `logs/` directory:
- `error.log` - Error messages
- `combined.log` - All log levels
- Console output for development

## Support

For technical support or questions:
- Create an issue in the project repository
- Review the troubleshooting guide
- Check the API documentation

## License

This project is licensed under the MIT License.

