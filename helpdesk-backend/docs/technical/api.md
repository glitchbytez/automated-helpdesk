# Helpdesk Backend API Documentation

## Overview

The Helpdesk Backend provides a comprehensive RESTful API for managing support tickets, user authentication, real-time chat, and system administration. Built with Node.js and Express, it serves as the central data management layer for the helpdesk system.

## Base Configuration

### API Base URL
```
Production: https://your-domain.com/api/v1
Development: http://localhost:5500/api/v1
```

### Authentication

All protected endpoints require JWT authentication:

```http
Authorization: Bearer <jwt_token>
```

### Request/Response Format

- **Content-Type**: `application/json`
- **Character Encoding**: UTF-8
- **Date Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)

## Authentication Endpoints

### POST /auth/login

Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "676c123456789abcdef",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "INVALID_CREDENTIALS"
  }
}
```

### POST /auth/signup

Register a new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "676c123456789abcdef",
      "email": "newuser@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "user",
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/refresh

Refresh JWT token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/forgot-password

Initiate password reset process.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

## Ticket Management Endpoints

### GET /tickets

Retrieve tickets with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (open, pending, resolved, closed)
- `priority` (string): Filter by priority (low, normal, high, urgent)
- `assignedTo` (string): Filter by assigned agent ID
- `category` (string): Filter by ticket category
- `search` (string): Search in title and description
- `sortBy` (string): Sort field (createdAt, updatedAt, priority)
- `sortOrder` (string): Sort direction (asc, desc)

**Request:**
```http
GET /api/v1/tickets?page=1&limit=20&status=open&priority=high
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "676c123456789abcdef",
        "ticketNumber": "TKT-2025-001",
        "subject": "Unable to access student portal",
        "description": "I cannot log into the student portal...",
        "status": "open",
        "priority": "high",
        "category": "technical",
        "requester": {
          "id": "676c123456789abcdef",
          "email": "student@example.com",
          "firstName": "John",
          "lastName": "Doe"
        },
        "assignedTo": {
          "id": "676c123456789abcdef",
          "email": "agent@example.com",
          "firstName": "Jane",
          "lastName": "Agent"
        },
        "createdAt": "2025-01-15T10:30:00.000Z",
        "updatedAt": "2025-01-15T11:00:00.000Z",
        "dueDate": "2025-01-16T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 95,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### POST /tickets

Create a new support ticket.

**Request:**
```json
{
  "subject": "Password reset request",
  "description": "I need help resetting my password for the student portal.",
  "category": "account",
  "priority": "normal",
  "attachments": [
    {
      "filename": "screenshot.png",
      "url": "https://storage.example.com/files/screenshot.png",
      "size": 245760
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "676c123456789abcdef",
      "ticketNumber": "TKT-2025-002",
      "subject": "Password reset request",
      "description": "I need help resetting my password...",
      "status": "open",
      "priority": "normal",
      "category": "account",
      "requester": {
        "id": "676c123456789abcdef",
        "email": "student@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "assignedTo": null,
      "createdAt": "2025-01-15T12:00:00.000Z",
      "updatedAt": "2025-01-15T12:00:00.000Z"
    }
  }
}
```

### GET /tickets/:id

Retrieve a specific ticket by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "676c123456789abcdef",
      "ticketNumber": "TKT-2025-001",
      "subject": "Unable to access student portal",
      "description": "I cannot log into the student portal...",
      "status": "open",
      "priority": "high",
      "category": "technical",
      "requester": {
        "id": "676c123456789abcdef",
        "email": "student@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "assignedTo": {
        "id": "676c123456789abcdef",
        "email": "agent@example.com",
        "firstName": "Jane",
        "lastName": "Agent"
      },
      "messages": [
        {
          "id": "676c123456789abcdef",
          "content": "Initial ticket description",
          "sender": {
            "id": "676c123456789abcdef",
            "email": "student@example.com",
            "firstName": "John",
            "lastName": "Doe"
          },
          "type": "note",
          "isInternal": false,
          "createdAt": "2025-01-15T10:30:00.000Z"
        }
      ],
      "history": [
        {
          "id": "676c123456789abcdef",
          "action": "created",
          "details": "Ticket created",
          "performedBy": {
            "id": "676c123456789abcdef",
            "email": "student@example.com",
            "firstName": "John",
            "lastName": "Doe"
          },
          "createdAt": "2025-01-15T10:30:00.000Z"
        }
      ],
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T11:00:00.000Z"
    }
  }
}
```

### PATCH /tickets/:id

Update ticket details (status, priority, assignment, etc.).

**Request:**
```json
{
  "status": "in_progress",
  "priority": "high",
  "assignedTo": "676c123456789abcdef",
  "internalNote": "Escalating to senior agent"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "676c123456789abcdef",
      "ticketNumber": "TKT-2025-001",
      "status": "in_progress",
      "priority": "high",
      "assignedTo": {
        "id": "676c123456789abcdef",
        "email": "senior@example.com",
        "firstName": "Senior",
        "lastName": "Agent"
      },
      "updatedAt": "2025-01-15T13:00:00.000Z"
    }
  }
}
```

## Message Management Endpoints

### POST /tickets/:id/messages

Add a message to a ticket.

**Request:**
```json
{
  "content": "Thank you for your inquiry. I will investigate this issue.",
  "type": "reply",
  "isInternal": false,
  "attachments": [
    {
      "filename": "solution.pdf",
      "url": "https://storage.example.com/files/solution.pdf",
      "size": 1024000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "676c123456789abcdef",
      "content": "Thank you for your inquiry...",
      "sender": {
        "id": "676c123456789abcdef",
        "email": "agent@example.com",
        "firstName": "Jane",
        "lastName": "Agent"
      },
      "type": "reply",
      "isInternal": false,
      "attachments": [
        {
          "id": "676c123456789abcdef",
          "filename": "solution.pdf",
          "url": "https://storage.example.com/files/solution.pdf",
          "size": 1024000,
          "uploadedAt": "2025-01-15T13:30:00.000Z"
        }
      ],
      "createdAt": "2025-01-15T13:30:00.000Z"
    }
  }
}
```

### GET /tickets/:id/messages

Retrieve all messages for a ticket.

**Query Parameters:**
- `includeInternal` (boolean): Include internal notes (agent only)
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "676c123456789abcdef",
        "content": "Initial ticket description",
        "sender": {
          "id": "676c123456789abcdef",
          "email": "student@example.com",
          "firstName": "John",
          "lastName": "Doe"
        },
        "type": "note",
        "isInternal": false,
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 3,
      "itemsPerPage": 20
    }
  }
}
```

## User Management Endpoints

### GET /users

Retrieve users with filtering (Admin only).

**Query Parameters:**
- `role` (string): Filter by role (user, agent, admin)
- `isActive` (boolean): Filter by active status
- `search` (string): Search in name and email
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "676c123456789abcdef",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user",
        "isActive": true,
        "lastLoginAt": "2025-01-15T10:00:00.000Z",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 195,
      "itemsPerPage": 20
    }
  }
}
```

### POST /users

Create a new user (Admin only).

**Request:**
```json
{
  "email": "newagent@example.com",
  "password": "temporarypassword",
  "firstName": "New",
  "lastName": "Agent",
  "role": "agent",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "676c123456789abcdef",
      "email": "newagent@example.com",
      "firstName": "New",
      "lastName": "Agent",
      "role": "agent",
      "isActive": true,
      "createdAt": "2025-01-15T14:00:00.000Z"
    }
  }
}
```

### GET /users/:id

Retrieve specific user details.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "676c123456789abcdef",
      "email": "agent@example.com",
      "firstName": "Jane",
      "lastName": "Agent",
      "role": "agent",
      "isActive": true,
      "profile": {
        "department": "IT Support",
        "phone": "+1-555-0123",
        "timezone": "America/New_York"
      },
      "stats": {
        "ticketsAssigned": 45,
        "ticketsResolved": 38,
        "averageResponseTime": 2.5
      },
      "lastLoginAt": "2025-01-15T09:00:00.000Z",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

### PATCH /users/:id

Update user information.

**Request:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "isActive": false,
  "profile": {
    "department": "Technical Support",
    "phone": "+1-555-0124"
  }
}
```

## Chat Management Endpoints

### GET /chats

Retrieve chat sessions.

**Query Parameters:**
- `status` (string): Filter by status (active, closed)
- `assignedTo` (string): Filter by agent ID
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "id": "676c123456789abcdef",
        "participants": [
          {
            "id": "676c123456789abcdef",
            "email": "student@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "role": "user"
          },
          {
            "id": "676c123456789abcdef",
            "email": "agent@example.com",
            "firstName": "Jane",
            "lastName": "Agent",
            "role": "agent"
          }
        ],
        "status": "active",
        "subject": "Portal access issue",
        "lastMessage": {
          "content": "Let me check your account status",
          "sender": "676c123456789abcdef",
          "timestamp": "2025-01-15T14:30:00.000Z"
        },
        "createdAt": "2025-01-15T14:00:00.000Z",
        "updatedAt": "2025-01-15T14:30:00.000Z"
      }
    ]
  }
}
```

### POST /chats

Initiate a new chat session.

**Request:**
```json
{
  "subject": "Technical assistance needed",
  "initialMessage": "I need help with my account access"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chat": {
      "id": "676c123456789abcdef",
      "participants": [
        {
          "id": "676c123456789abcdef",
          "email": "student@example.com",
          "firstName": "John",
          "lastName": "Doe",
          "role": "user"
        }
      ],
      "status": "waiting",
      "subject": "Technical assistance needed",
      "createdAt": "2025-01-15T15:00:00.000Z"
    }
  }
}
```

### GET /chats/:id/messages

Retrieve chat messages.

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "676c123456789abcdef",
        "content": "I need help with my account access",
        "sender": {
          "id": "676c123456789abcdef",
          "email": "student@example.com",
          "firstName": "John",
          "lastName": "Doe"
        },
        "type": "text",
        "timestamp": "2025-01-15T15:00:00.000Z"
      },
      {
        "id": "676c123456789abcdef",
        "content": "I'll be happy to help you with that",
        "sender": {
          "id": "676c123456789abcdef",
          "email": "agent@example.com",
          "firstName": "Jane",
          "lastName": "Agent"
        },
        "type": "text",
        "timestamp": "2025-01-15T15:01:00.000Z"
      }
    ]
  }
}
```

## Notification Endpoints

### GET /notifications

Retrieve user notifications.

**Query Parameters:**
- `read` (boolean): Filter by read status
- `type` (string): Filter by notification type
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "676c123456789abcdef",
        "type": "ticket_assigned",
        "title": "New Ticket Assigned",
        "message": "You have been assigned ticket TKT-2025-001",
        "data": {
          "ticketId": "676c123456789abcdef",
          "ticketNumber": "TKT-2025-001"
        },
        "read": false,
        "createdAt": "2025-01-15T15:30:00.000Z"
      }
    ],
    "unreadCount": 5
  }
}
```

### PATCH /notifications/:id/read

Mark notification as read.

**Response:**
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "676c123456789abcdef",
      "read": true,
      "readAt": "2025-01-15T16:00:00.000Z"
    }
  }
}
```

## Reports and Analytics Endpoints

### GET /reports/tickets

Generate ticket reports.

**Query Parameters:**
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `groupBy` (string): Group by field (day, week, month, agent, category)
- `status` (string): Filter by status
- `priority` (string): Filter by priority

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTickets": 150,
      "openTickets": 25,
      "resolvedTickets": 115,
      "averageResponseTime": 4.2,
      "averageResolutionTime": 24.5
    },
    "breakdown": [
      {
        "period": "2025-01-01",
        "created": 12,
        "resolved": 8,
        "avgResponseTime": 3.5
      },
      {
        "period": "2025-01-02",
        "created": 15,
        "resolved": 12,
        "avgResponseTime": 4.1
      }
    ]
  }
}
```

### GET /reports/agents

Generate agent performance reports.

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "agent": {
          "id": "676c123456789abcdef",
          "firstName": "Jane",
          "lastName": "Agent"
        },
        "stats": {
          "ticketsAssigned": 45,
          "ticketsResolved": 38,
          "averageResponseTime": 2.5,
          "customerSatisfaction": 4.7,
          "resolutionRate": 84.4
        }
      }
    ]
  }
}
```

## WebSocket Events

The API supports real-time communication via WebSocket for live updates.

### Connection

```javascript
const socket = io('http://localhost:5501', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Ticket Events

- `ticket:created` - New ticket created
- `ticket:updated` - Ticket status/details changed
- `ticket:assigned` - Ticket assigned to agent
- `ticket:message` - New message added to ticket

#### Chat Events

- `chat:message` - New chat message
- `chat:typing` - User typing indicator
- `chat:agent_joined` - Agent joined chat
- `chat:ended` - Chat session ended

#### Notification Events

- `notification:new` - New notification received
- `notification:read` - Notification marked as read

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Human readable error message",
    "code": "ERROR_CODE",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### Common Error Codes

- `INVALID_CREDENTIALS` - Authentication failed
- `TOKEN_EXPIRED` - JWT token expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `VALIDATION_ERROR` - Request validation failed
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication**: 5 requests per minute per IP
- **General API**: 100 requests per minute per user
- **File Upload**: 10 uploads per minute per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642684800
```

## File Upload

### POST /upload

Upload files for tickets or messages.

**Request:** Multipart form data

```http
POST /api/v1/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

[binary file data]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "676c123456789abcdef",
      "filename": "document.pdf",
      "originalName": "document.pdf",
      "size": 1024000,
      "mimeType": "application/pdf",
      "url": "https://storage.example.com/files/document.pdf",
      "uploadedAt": "2025-01-15T16:30:00.000Z"
    }
  }
}
```

---

*This API documentation is automatically generated and updated. For the latest version, refer to the interactive API documentation at `/api/docs`.*

*Last updated: [Current Date]*
*Version: 1.0* 