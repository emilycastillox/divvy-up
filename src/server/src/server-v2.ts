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

// API Routes
app.use('/api/groups', groupsRoutes);
app.use('/api/expenses', expensesRoutes);

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
    accessToken: 'mock_access_token_' + Date.now(),
    refreshToken: 'mock_refresh_token_' + Date.now(),
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
    accessToken: 'mock_access_token_' + Date.now(),
    refreshToken: 'mock_refresh_token_' + Date.now(),
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
