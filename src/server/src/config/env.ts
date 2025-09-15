import { config } from 'dotenv';
import { env } from '@divvy-up/shared';

// Load environment variables from .env file
config();

// Re-export the validated environment configuration
export { env } from '@divvy-up/shared';

// Server-specific environment utilities
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Database connection string for server
export const getDatabaseUrl = (): string => {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  // Build connection string from individual components
  const { HOST, PORT, NAME, USER, PASSWORD, SSL } = env.DB;
  const sslParam = SSL ? '?sslmode=require' : '';
  return `postgresql://${USER}:${PASSWORD}@${HOST}:${PORT}/${NAME}${sslParam}`;
};

// Redis connection string for server
export const getRedisUrl = (): string => {
  if (env.REDIS_URL) {
    return env.REDIS_URL;
  }

  // Build connection string from individual components
  const { HOST, PORT, PASSWORD, DB } = env.REDIS;
  const auth = PASSWORD ? `:${PASSWORD}@` : '';
  return `redis://${auth}${HOST}:${PORT}/${DB}`;
};

// JWT configuration for server
export const getJwtConfig = () => ({
  secret: env.JWT.SECRET,
  expiresIn: env.JWT.EXPIRES_IN,
  refreshSecret: env.JWT.REFRESH_SECRET,
  refreshExpiresIn: env.JWT.REFRESH_EXPIRES_IN,
});

// Email configuration for server
export const getEmailConfig = () => ({
  host: env.EMAIL.SMTP.HOST,
  port: env.EMAIL.SMTP.PORT,
  secure: env.EMAIL.SMTP.SECURE,
  auth: {
    user: env.EMAIL.SMTP.USER,
    pass: env.EMAIL.SMTP.PASS,
  },
  from: {
    email: env.EMAIL.FROM.EMAIL,
    name: env.EMAIL.FROM.NAME,
  },
});

// Payment configuration for server
export const getPaymentConfig = () => {
  const config = {
    provider: env.PAYMENT.PROVIDER,
    webhookSecret: env.PAYMENT.WEBHOOK_SECRET,
  };

  switch (env.PAYMENT.PROVIDER) {
    case 'venmo':
      return {
        ...config,
        venmo: {
          clientId: env.PAYMENT.VENMO.CLIENT_ID,
          clientSecret: env.PAYMENT.VENMO.CLIENT_SECRET,
          redirectUri: env.PAYMENT.VENMO.REDIRECT_URI,
        },
      };
    case 'paypal':
      return {
        ...config,
        paypal: {
          clientId: env.PAYMENT.PAYPAL.CLIENT_ID,
          clientSecret: env.PAYMENT.PAYPAL.CLIENT_SECRET,
        },
      };
    case 'stripe':
      return {
        ...config,
        stripe: {
          publishableKey: env.PAYMENT.STRIPE.PUBLISHABLE_KEY,
          secretKey: env.PAYMENT.STRIPE.SECRET_KEY,
        },
      };
    default:
      return config;
  }
};

// Security configuration for server
export const getSecurityConfig = () => ({
  bcryptRounds: env.SECURITY.BCRYPT_ROUNDS,
  rateLimit: {
    windowMs: env.SECURITY.RATE_LIMIT.WINDOW_MS,
    max: env.SECURITY.RATE_LIMIT.MAX_REQUESTS,
  },
  corsOrigin: env.SECURITY.CORS_ORIGIN,
});

// Logging configuration for server
export const getLoggingConfig = () => ({
  level: env.LOG.LEVEL,
  format: env.LOG.FORMAT,
});

// File upload configuration for server
export const getUploadConfig = () => ({
  maxFileSize: env.UPLOAD.MAX_FILE_SIZE,
  allowedFileTypes: env.UPLOAD.ALLOWED_FILE_TYPES,
  uploadDir: env.UPLOAD.DIR,
});

// Development configuration for server
export const getDevConfig = () => ({
  debug: env.DEV.ENABLE_DEBUG,
  swagger: env.DEV.ENABLE_SWAGGER,
  mockPayments: env.DEV.MOCK_PAYMENTS,
});
