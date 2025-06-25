# Helpdesk Frontend Technical Architecture

## Overview

The Helpdesk Frontend is a comprehensive Next.js 15 application that provides a modern, responsive interface for campus support ticket management. It integrates with a Node.js backend API, supports real-time communication via WebSocket, and implements role-based access control for different user types.

## Technology Stack

### Core Framework

- **Next.js 15.3.3**: React framework with App Router
- **React 19.0.0**: Frontend UI library
- **TypeScript**: Type-safe development (via JSX syntax)

### UI and Styling

- **Tailwind CSS 3.4.15**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React 0.468.0**: Icon library
- **Custom Components**: Reusable UI component library

### State Management and Data

- **React Context**: Global state management
- **Socket.IO Client 4.8.1**: Real-time communication
- **Next.js API Routes**: Server-side API integration
- **Fetch API**: HTTP client for backend communication

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │    │ Helpdesk Frontend│   │ Helpdesk Backend│
│                 │◄──►│   (Next.js)     │◄──►│   (Node.js)     │
│                 │    │     (3001)      │    │     (5500)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Chatbot Server  │    │    MongoDB      │
                       │   (WebSocket)   │    │   (Database)    │
                       │     (5501)      │    │    (27017)      │
                       └─────────────────┘    └─────────────────┘
```

### Application Structure

```
helpdesk-frontend/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── agents/             # Agent management
│   │   ├── chats/              # Real-time chat interface
│   │   ├── dashboard/          # Main dashboard
│   │   ├── tickets/            # Ticket management
│   │   ├── reports/            # Analytics and reporting
│   │   └── settings/           # User preferences
│   ├── login/                  # Authentication
│   ├── signup/                 # User registration
│   └── forgot-password/        # Password recovery
├── components/                  # Reusable React components
│   ├── ui/                     # Base UI components
│   ├── dashboard-layout.jsx    # Main layout component
│   ├── route-protection.jsx    # Auth wrapper
│   └── [feature-components]    # Feature-specific components
├── contexts/                    # React context providers
├── lib/                        # Utility libraries and services
│   ├── api.js                  # API configuration
│   ├── services/               # Service layer
│   └── utils/                  # Utility functions
└── hooks/                      # Custom React hooks
```

## Core Components and Features

### 1. Authentication System

#### Route Protection

```javascript
// components/route-protection.jsx
export function RouteProtection({ children, requiredRole }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && !hasRole(user, requiredRole)) {
    return <UnauthorizedPage />;
  }
  
  return children;
}
```

#### Authentication Context

```javascript
// contexts/auth-context.jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Authentication methods and state management
  const value = {
    user,
    login,
    logout,
    signup,
    loading
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 2. Dashboard Layout System

#### Main Layout Component

```javascript
// components/dashboard-layout.jsx
export function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### Responsive Navigation

- **Desktop**: Full sidebar with navigation items
- **Tablet**: Collapsible sidebar
- **Mobile**: Slide-out drawer navigation

### 3. Ticket Management System

#### Ticket Table Component

Features:
- **Data Virtualization**: Efficient rendering of large datasets
- **Sorting and Filtering**: Multi-column sorting and filtering
- **Pagination**: Server-side pagination for performance
- **Real-time Updates**: Live status updates via WebSocket

#### Ticket Detail View

```javascript
// components/ticket-chat.jsx
export function TicketChat({ ticketId }) {
  const [messages, setMessages] = useState([]);
  const socket = useSocket();
  
  useEffect(() => {
    socket.on('new_message', handleNewMessage);
    socket.on('status_update', handleStatusUpdate);
    
    return () => {
      socket.off('new_message');
      socket.off('status_update');
    };
  }, [socket]);
  
  return (
    <div className="ticket-chat">
      <MessageHistory messages={messages} />
      <MessageInput onSend={sendMessage} />
    </div>
  );
}
```

### 4. Real-time Communication

#### WebSocket Integration

```javascript
// lib/services/socket-service.js
class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }
  
  connect(token) {
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    this.setupEventHandlers();
  }
  
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }
  
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}
```

#### Real-time Features

1. **Live Chat**: Agent-user communication
2. **Status Updates**: Ticket status changes
3. **Notifications**: System alerts and messages
4. **Presence Indicators**: Online/offline status

### 5. Component Library (UI System)

#### Base Components

```javascript
// components/ui/button.jsx
export const Button = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  ...props 
}, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
```

#### Compound Components

- **Data Tables**: Sortable, filterable tables
- **Form Controls**: Input, select, textarea with validation
- **Modals and Dialogs**: Accessible overlay components
- **Navigation**: Tabs, breadcrumbs, pagination

## Data Flow and State Management

### API Integration Layer

```javascript
// lib/api.js
class ApiClient {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL;
    this.token = null;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      },
      ...options
    };
    
    const response = await fetch(url, config);
    return this.handleResponse(response);
  }
}
```

### Service Layer Architecture

```javascript
// lib/services/ticket-service.js
export class TicketService {
  static async getTickets(filters = {}) {
    return api.get('/tickets', { params: filters });
  }
  
  static async createTicket(ticketData) {
    return api.post('/tickets', ticketData);
  }
  
  static async updateTicketStatus(ticketId, status) {
    return api.patch(`/tickets/${ticketId}/status`, { status });
  }
}
```

### State Management Strategy

1. **Local Component State**: React useState for component-specific data
2. **Global Context**: Auth state, user preferences, app settings
3. **Server State**: API data with caching and synchronization
4. **Real-time State**: WebSocket events for live updates

## Routing and Navigation

### App Router Structure

```javascript
// app/layout.js
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Protected Routes

```javascript
// app/(dashboard)/layout.jsx
export default function DashboardLayout({ children }) {
  return (
    <RouteProtection requiredRole="user">
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RouteProtection>
  );
}
```

### Dynamic Routing

- `/tickets/[id]` - Individual ticket view
- `/agents/[id]` - Agent profile management
- `/agents/[id]/edit` - Agent editing
- `/reports/[type]` - Dynamic report views

## Performance Optimization

### Code Splitting and Lazy Loading

```javascript
// Dynamic imports for large components
const ReportsPage = dynamic(() => import('./reports/page'), {
  loading: () => <ReportLoadingSkeleton />
});

const TicketChart = lazy(() => import('../components/ticket-volume-chart'));
```

### Data Fetching Strategies

1. **Server-Side Rendering (SSR)**: Initial page loads
2. **Static Generation**: Dashboard summaries
3. **Client-Side Fetching**: Dynamic user interactions
4. **Incremental Static Regeneration**: Reports and analytics

### Caching Strategy

```javascript
// lib/utils/cache.js
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
  }
  
  set(key, value, ttlMs = 300000) { // 5 minutes default
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }
  
  get(key) {
    if (this.isExpired(key)) {
      this.delete(key);
      return null;
    }
    return this.cache.get(key);
  }
}
```

## Security Implementation

### Authentication Flow

1. **Login**: User credentials sent to backend
2. **Token Generation**: JWT token returned
3. **Token Storage**: Secure storage in httpOnly cookies
4. **Token Validation**: Middleware validates on each request
5. **Refresh Mechanism**: Automatic token refresh

### RBAC (Role-Based Access Control)

```javascript
// lib/utils/permissions.js
export const ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent',
  USER: 'user'
};

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  VIEW_REPORTS: 'view_reports',
  ASSIGN_TICKETS: 'assign_tickets'
};

export function hasPermission(user, permission) {
  return user.role?.permissions?.includes(permission);
}
```

### Content Security Policy

```javascript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} ${process.env.NEXT_PUBLIC_SOCKET_SERVER_URL};
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  }
};
```

## Error Handling and Monitoring

### Error Boundary Implementation

```javascript
// components/error-boundary.jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to monitoring service
    if (typeof window !== 'undefined') {
      window.Sentry?.captureException(error);
    }
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

### API Error Handling

```javascript
// lib/utils/error-handler.js
export function handleApiError(error) {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Redirect to login
        window.location.href = '/login';
        break;
      case 403:
        // Show unauthorized message
        toast.error('You do not have permission to perform this action');
        break;
      case 500:
        // Show server error
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(data.message || 'An error occurred');
    }
  } else if (error.request) {
    // Network error
    toast.error('Network error. Please check your connection.');
  } else {
    // Other error
    toast.error('An unexpected error occurred');
  }
}
```

## Testing Architecture

### Component Testing

```javascript
// __tests__/components/ticket-table.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TicketTable } from '../components/ticket-table';

describe('TicketTable', () => {
  it('renders tickets correctly', () => {
    const mockTickets = [
      { id: 1, subject: 'Test Ticket', status: 'open' }
    ];
    
    render(<TicketTable tickets={mockTickets} />);
    
    expect(screen.getByText('Test Ticket')).toBeInTheDocument();
  });
  
  it('handles ticket selection', () => {
    const onSelect = jest.fn();
    render(<TicketTable tickets={[]} onSelect={onSelect} />);
    
    // Test interaction
  });
});
```

### Integration Testing

```javascript
// __tests__/integration/ticket-workflow.test.jsx
describe('Ticket Workflow', () => {
  it('creates and manages ticket lifecycle', async () => {
    // Mock API responses
    // Test complete workflow
    // Verify state changes
  });
});
```

## Deployment Considerations

### Environment Configuration

```javascript
// lib/config.js
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api/v1',
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:5501',
  environment: process.env.NODE_ENV || 'development',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
};
```

### Build Optimization

1. **Bundle Analysis**: Monitor bundle size
2. **Image Optimization**: Next.js Image component
3. **Font Optimization**: Self-hosted font optimization
4. **Code Splitting**: Automatic and manual splitting

---

*This architecture provides a scalable, maintainable, and secure foundation for the helpdesk management system with real-time capabilities and modern UX patterns.*

*Last updated: [Current Date]*
*Version: 1.0* 