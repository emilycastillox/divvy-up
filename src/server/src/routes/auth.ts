import { Router, Request, Response } from 'express';
import { config } from 'dotenv';

// Load environment variables first
config();

import { AuthService, RegisterData, LoginCredentials, PasswordResetData } from '../services/auth';
import { authenticate, authRateLimit, clearAuthRateLimit, authErrorHandler } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// Input validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
  body('first_name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('First name is required'),
  body('last_name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Last name is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Valid timezone is required'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const passwordResetValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
    return true;
  }
  return false;
};

// POST /api/auth/register
router.post('/register', authRateLimit, registerValidation, async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const registerData: RegisterData = {
      email: req.body.email,
      username: req.body.username,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      avatar_url: req.body.avatar_url,
      phone: req.body.phone,
      timezone: req.body.timezone || 'UTC',
    };

    const result = await AuthService.register(registerData);
    
    // Clear rate limit on successful registration
    clearAuthRateLimit(req, res, () => {});

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          first_name: result.user.first_name,
          last_name: result.user.last_name,
          avatar_url: result.user.avatar_url,
          phone: result.user.phone,
          timezone: result.user.timezone,
          email_verified: result.user.email_verified,
          created_at: result.user.created_at,
        },
        tokens: result.tokens,
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
      code: 'REGISTRATION_FAILED'
    });
  }
});

// POST /api/auth/login
router.post('/login', authRateLimit, loginValidation, async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const credentials: LoginCredentials = {
      email: req.body.email,
      password: req.body.password,
    };

    const result = await AuthService.login(credentials);
    
    // Clear rate limit on successful login
    clearAuthRateLimit(req, res, () => {});

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          first_name: result.user.first_name,
          last_name: result.user.last_name,
          avatar_url: result.user.avatar_url,
          phone: result.user.phone,
          timezone: result.user.timezone,
          email_verified: result.user.email_verified,
          last_login: result.user.last_login,
        },
        tokens: result.tokens,
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
      code: 'LOGIN_FAILED'
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN'
      });
      return;
    }

    const tokens = await AuthService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    await AuthService.logout(req.user!.id);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'LOGOUT_FAILED'
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authRateLimit, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
      return;
    }

    const resetToken = await AuthService.generatePasswordResetToken(email);

    // In a real app, you would send an email here
    // For now, we'll just return the token for testing
    res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
      data: {
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request',
      code: 'RESET_REQUEST_FAILED'
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authRateLimit, passwordResetValidation, async (req: Request, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const resetData: PasswordResetData = {
      token: req.body.token,
      newPassword: req.body.newPassword,
      confirmPassword: req.body.confirmPassword,
    };

    await AuthService.resetPassword(resetData);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Password reset failed',
      code: 'PASSWORD_RESET_FAILED'
    });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Verification token is required',
        code: 'TOKEN_REQUIRED'
      });
      return;
    }

    await AuthService.verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Email verification failed',
      code: 'VERIFICATION_FAILED'
    });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (user.email_verified) {
      res.status(400).json({
        success: false,
        error: 'Email is already verified',
        code: 'ALREADY_VERIFIED'
      });
      return;
    }

    const token = await AuthService.generateEmailVerificationToken(user.id);

    // In a real app, you would send an email here
    // For now, we'll just return the token for testing
    res.json({
      success: true,
      message: 'Verification email sent',
      data: {
        verificationToken: process.env.NODE_ENV === 'development' ? token : undefined
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send verification email',
      code: 'VERIFICATION_SEND_FAILED'
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url,
          phone: user.phone,
          timezone: user.timezone,
          email_verified: user.email_verified,
          last_login: user.last_login,
          created_at: user.created_at,
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get user information',
      code: 'USER_INFO_FAILED'
    });
  }
});

// Error handling middleware
router.use(authErrorHandler);

export default router;
