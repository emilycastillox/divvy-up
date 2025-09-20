import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ResponseFormatter } from './utils/response';

// Import routes
import groupsRoutes from './routes/groups';
import expensesRoutes from './routes/expenses';
import invitationRoutes from './routes/invitations';
import balanceRoutes from './routes/balances';

// Mock authentication middleware
const mockAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      code: 'MISSING_TOKEN'
    });
  }

  const token = authHeader.substring(7);
  
  // Accept any mock token or real JWT-like token
  if (token.startsWith('mock_access_token_') || token.length > 20) {
    req.user = {
      id: '123e4567-e89b-12d3-a456-426614174010',
      email: 'test@example.com',
      username: 'johndoe'
    };
    next();
  } else {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // TODO: Add actual database and Redis health checks
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'healthy', // TODO: Implement actual DB health check
        redis: 'healthy',    // TODO: Implement actual Redis health check
        auth: 'healthy'
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      }
    };

    ResponseFormatter.success(res, healthStatus, 'Service is healthy');
  } catch (error) {
    ResponseFormatter.error(res, 'Service unavailable', 503, 'SERVICE_UNAVAILABLE');
  }
});

// API info endpoint
app.get('/api', (req, res) => {
  const apiInfo = {
    name: 'DivvyUp API',
    version: '1.0.0',
    description: 'Expense splitting application API',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: {
        base: '/api/auth',
        description: 'Authentication endpoints',
        routes: [
          'POST /api/auth/register',
          'POST /api/auth/login',
          'POST /api/auth/refresh',
          'POST /api/auth/logout',
          'GET /api/auth/me'
        ]
      },
      groups: {
        base: '/api/groups',
        description: 'Group management endpoints',
        routes: [
          'GET /api/groups',
          'POST /api/groups',
          'GET /api/groups/:id',
          'PUT /api/groups/:id',
          'DELETE /api/groups/:id',
          'POST /api/groups/:id/members',
          'DELETE /api/groups/:id/members/:userId',
          'GET /api/groups/:id/balances'
        ]
      },
      expenses: {
        base: '/api/expenses',
        description: 'Expense management endpoints',
        routes: [
          'GET /api/expenses',
          'POST /api/expenses',
          'GET /api/expenses/:id',
          'PUT /api/expenses/:id',
          'DELETE /api/expenses/:id',
          'POST /api/expenses/:id/settle',
          'POST /api/expenses/:id/splits/:splitId/pay',
          'GET /api/expenses/categories'
        ]
      },
      balances: {
        base: '/api/balances',
        description: 'Balance calculation and settlement endpoints',
        routes: [
          'GET /api/balances/group/:groupId',
          'GET /api/balances/group/:groupId/settlements',
          'GET /api/balances/group/:groupId/user/:userId',
          'GET /api/balances/group/:groupId/history',
          'POST /api/balances/group/:groupId/validate'
        ]
      },
      health: {
        base: '/health',
        description: 'Service health check'
      }
    },
    documentation: {
      swagger: '/api/docs', // TODO: Implement Swagger documentation
      postman: '/api/postman.json' // TODO: Generate Postman collection
    }
  };

  ResponseFormatter.success(res, apiInfo, 'API information retrieved successfully');
});

// In-memory storage for mock data
const mockData = {
  groups: new Map(),
  invitations: new Map(),
  activities: new Map(),
  expenses: new Map()
};

// Mock API Routes for testing
app.get('/api/groups', mockAuth, (req, res) => {
  const groups = Array.from(mockData.groups.values());
  ResponseFormatter.success(res, { groups }, 'Groups retrieved successfully');
});

app.post('/api/groups', mockAuth, (req, res) => {
  const { name, description, currency, settings } = req.body;
  
  const mockGroup = {
    id: 'group_' + Date.now(),
    name: name || 'New Group',
    description: description || '',
    currency: currency || 'USD',
    settings: settings || {
      splitMethod: 'equal',
      allowPartialPayments: true,
      requireApproval: false
    },
    members: [{
      id: 'member_' + Date.now(),
      role: 'admin',
      joined_at: new Date().toISOString(),
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: null
      }
    }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Store the group in memory
  mockData.groups.set(mockGroup.id, mockGroup);
  
  ResponseFormatter.success(res, { group: mockGroup }, 'Group created successfully');
});

app.get('/api/groups/:id', mockAuth, (req, res) => {
  const { id } = req.params;
  
  // Get the group from memory
  const group = mockData.groups.get(id);
  
  if (!group) {
    return ResponseFormatter.notFound(res, 'Group not found');
  }
  
  ResponseFormatter.success(res, { group }, 'Group retrieved successfully');
});

app.put('/api/groups/:id', mockAuth, (req, res) => {
  const { id } = req.params;
  const { name, description, currency, settings } = req.body;
  
  // Get the group from memory
  const group = mockData.groups.get(id);
  
  if (!group) {
    return ResponseFormatter.notFound(res, 'Group not found');
  }
  
  // Update the group
  if (name) group.name = name;
  if (description !== undefined) group.description = description;
  if (currency) group.currency = currency;
  if (settings) group.settings = { ...group.settings, ...settings };
  group.updated_at = new Date().toISOString();
  
  // Store the updated group
  mockData.groups.set(id, group);
  
  ResponseFormatter.success(res, { group }, 'Group updated successfully');
});

app.get('/api/expenses', mockAuth, (req, res) => {
  const { group_id } = req.query;
  
  // Get expenses from memory, filter by group if specified
  let expenses = Array.from(mockData.expenses?.values() || []);
  if (group_id) {
    expenses = expenses.filter(expense => expense.group_id === group_id);
  }
  
  ResponseFormatter.success(res, { expenses }, 'Expenses retrieved successfully');
});

app.post('/api/expenses', mockAuth, (req, res) => {
  const { group_id, amount, description, category, expense_date, splits } = req.body;
  
  const expense = {
    id: 'expense_' + Date.now(),
    group_id,
    amount: parseFloat(amount),
    description,
    category: category || 'other',
    expense_date: expense_date || new Date().toISOString().split('T')[0],
    splits: splits || [],
    created_by: req.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'pending'
  };
  
  // Store the expense in memory
  if (!mockData.expenses) {
    mockData.expenses = new Map();
  }
  mockData.expenses.set(expense.id, expense);
  
  ResponseFormatter.success(res, { expense }, 'Expense created successfully');
});

app.get('/api/balances/group/:groupId', mockAuth, (req, res) => {
  const { groupId } = req.params;
  
  // Get expenses for this group
  const groupExpenses = Array.from(mockData.expenses?.values() || [])
    .filter(expense => expense.group_id === groupId);
  
  // Calculate totals
  const totalExpenses = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalSettled = 0; // Mock: no settlements yet
  const totalOutstanding = totalExpenses - totalSettled;
  
  // Get group members
  const group = mockData.groups.get(groupId);
  const memberCount = group?.members?.length || 0;
  
  // Calculate balances for each member
  const balances = group?.members?.map(member => {
    const memberExpenses = groupExpenses.filter(expense => 
      expense.splits.some(split => split.user_id === member.user.id)
    );
    const memberTotal = memberExpenses.reduce((sum, expense) => {
      const memberSplit = expense.splits.find(split => split.user_id === member.user.id);
      return sum + (memberSplit?.amount || 0);
    }, 0);
    
    return {
      user: {
        id: member.user.id,
        username: member.user.username,
        first_name: member.user.firstName,
        last_name: member.user.lastName,
        avatarUrl: member.user.avatarUrl || null
      },
      total_owed: memberTotal,
      total_paid: 0, // Mock: no payments yet
      net_balance: memberTotal
    };
  }) || [];
  
  ResponseFormatter.success(res, { 
    totalExpenses,
    totalSettled,
    totalOutstanding,
    memberCount,
    balances
  }, 'Balances retrieved successfully');
});

app.get('/api/balances/group/:groupId/settlements', mockAuth, (req, res) => {
  const { groupId } = req.params;
  
  // Mock settlement data
  const settlements = [];
  
  ResponseFormatter.success(res, { 
    settlements,
    totalSettlements: 0,
    totalAmount: 0
  }, 'Settlements retrieved successfully');
});

app.get('/api/balances/group/:groupId/history', mockAuth, (req, res) => {
  const { groupId } = req.params;
  const { limit = 50 } = req.query;
  
  // Mock balance history
  const history = [];
  
  ResponseFormatter.success(res, { 
    history,
    totalRecords: 0
  }, 'Balance history retrieved successfully');
});

// Invitation routes
app.post('/api/groups/:groupId/invitations', mockAuth, (req, res) => {
  const { groupId } = req.params;
  const { email, role = 'member' } = req.body;
  
  const invitation = {
    id: 'invitation_' + Date.now(),
    groupId,
    email,
    role,
    status: 'pending',
    token: 'invite_token_' + Date.now(),
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  };
  
  mockData.invitations.set(invitation.id, invitation);
  
  ResponseFormatter.success(res, { invitation }, 'Invitation sent successfully');
});

app.get('/api/groups/:groupId/invitations', mockAuth, (req, res) => {
  const { groupId } = req.params;
  const invitations = Array.from(mockData.invitations.values())
    .filter(inv => inv.groupId === groupId);
  
  ResponseFormatter.success(res, { invitations }, 'Invitations retrieved successfully');
});

// Activity routes
app.get('/api/groups/:groupId/activities', mockAuth, (req, res) => {
  const { groupId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const activities = Array.from(mockData.activities.values())
    .filter(activity => activity.groupId === groupId)
    .slice((page - 1) * limit, page * limit);
  
  ResponseFormatter.success(res, { activities }, 'Activities retrieved successfully');
});

// Simple auth routes for now (TODO: Replace with full auth implementation)
app.post('/api/auth/register', (req, res) => {
  const { email, username, first_name, last_name } = req.body;
  
  if (!email || !username || !first_name || !last_name) {
    return ResponseFormatter.badRequest(res, 'Missing required fields');
  }

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174010',
    email,
    username,
    first_name,
    last_name,
    created_at: new Date()
  };

  const mockTokens = {
    accessToken: 'mock_access_token_12345',
    refreshToken: 'mock_refresh_token_12345',
    expiresIn: 3600
  };

  ResponseFormatter.created(res, { user: mockUser, tokens: mockTokens }, 'User registered successfully');
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return ResponseFormatter.badRequest(res, 'Email and password are required');
  }

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174010',
    email,
    username: 'johndoe',
    first_name: 'John',
    last_name: 'Doe',
    last_login: new Date()
  };

  const mockTokens = {
    accessToken: 'mock_access_token_12345',
    refreshToken: 'mock_refresh_token_12345',
    expiresIn: 3600
  };

  ResponseFormatter.success(res, { user: mockUser, tokens: mockTokens }, 'Login successful');
});

app.get('/api/auth/me', (req, res) => {
  // TODO: Implement proper authentication middleware
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174010',
    email: 'john.doe@example.com',
    username: 'johndoe',
    first_name: 'John',
    last_name: 'Doe',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    email_verified: true,
    created_at: new Date('2024-01-01')
  };

  ResponseFormatter.success(res, { user: mockUser }, 'User information retrieved successfully');
});

// API versioning middleware (for future versions)
app.use('/api/v1', (req, res, next) => {
  res.setHeader('API-Version', 'v1');
  next();
});

// Request logging for debugging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      headers: {
        'content-type': req.get('Content-Type'),
        'user-agent': req.get('User-Agent'),
        authorization: req.get('Authorization') ? '[REDACTED]' : undefined
      }
    });
    next();
  });
}

// 404 handler for undefined routes
app.use('*', notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

// Graceful shutdown handling
const server = app.listen(PORT, () => {
  console.log(`🚀 DivvyUp API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API info: http://localhost:${PORT}/api`);
  console.log(`🏠 Groups API: http://localhost:${PORT}/api/groups`);
  console.log(`💰 Expenses API: http://localhost:${PORT}/api/expenses`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connections, etc.
    // TODO: Add database cleanup
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.log('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in development, but log the error
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
