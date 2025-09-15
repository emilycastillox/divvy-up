import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { User } from '@divvy-up/shared';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthRequest extends Request {
  user: User;
}

// JWT Authentication Middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const user = await AuthService.getUserFromToken(token);
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
    return;
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const user = await AuthService.getUserFromToken(token);
      req.user = user;
    } catch (error) {
      // Silently fail for optional auth
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Email verification required middleware
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  if (!req.user.email_verified) {
    res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
    return;
  }

  next();
};

// Admin role required middleware
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  // For now, we'll check if the user is the first user (admin)
  // In a real app, you'd have a proper role system
  if (req.user.id !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
    return;
  }

  next();
};

// Rate limiting for auth endpoints
export const authRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  // Simple in-memory rate limiting (in production, use Redis)
  const clientId = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!global.authAttempts) {
    global.authAttempts = new Map();
  }

  const attempts = global.authAttempts.get(clientId) || [];
  const recentAttempts = attempts.filter((time: number) => now - time < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(windowMs / 1000)
    });
    return;
  }

  // Add current attempt
  recentAttempts.push(now);
  global.authAttempts.set(clientId, recentAttempts);

  next();
};

// Clear rate limit on successful auth
export const clearAuthRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const clientId = req.ip || req.connection.remoteAddress;
  
  if (global.authAttempts) {
    global.authAttempts.delete(clientId);
  }
  
  next();
};

// Validate user ownership middleware
export const validateUserOwnership = (paramName: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const targetUserId = req.params[paramName];
    
    if (req.user.id !== targetUserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own resources.',
        code: 'ACCESS_DENIED'
      });
      return;
    }

    next();
  };
};

// Error handling middleware for auth errors
export const authErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
    return;
  }

  if (error.message === 'Invalid email or password') {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS'
    });
    return;
  }

  if (error.message === 'User with this email already exists') {
    res.status(409).json({
      success: false,
      error: 'User with this email already exists',
      code: 'EMAIL_EXISTS'
    });
    return;
  }

  if (error.message === 'Username already taken') {
    res.status(409).json({
      success: false,
      error: 'Username already taken',
      code: 'USERNAME_EXISTS'
    });
    return;
  }

  if (error.message === 'Account is deactivated') {
    res.status(403).json({
      success: false,
      error: 'Account is deactivated',
      code: 'ACCOUNT_DEACTIVATED'
    });
    return;
  }

  if (error.message === 'Email verification required') {
    res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
    return;
  }

  // Pass other errors to the general error handler
  next(error);
};

// Global type declaration for auth attempts
declare global {
  var authAttempts: Map<string, number[]> | undefined;
}
