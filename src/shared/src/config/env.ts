import Joi from 'joi';

// Environment variable validation schema
const envSchema = Joi.object({
  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Server Configuration
  PORT: Joi.number().port().default(3001),
  HOST: Joi.string().default('localhost'),

  // Database Configuration
  DATABASE_URL: Joi.string().uri().required(),
  DB_HOST: Joi.string().hostname().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_SSL: Joi.boolean().default(false),
  DB_POOL_MIN: Joi.number().integer().min(0).default(2),
  DB_POOL_MAX: Joi.number().integer().min(1).default(10),

  // Redis Configuration
  REDIS_URL: Joi.string().uri().required(),
  REDIS_HOST: Joi.string().hostname().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().min(0).default(0),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // Client Configuration
  CLIENT_URL: Joi.string().uri().required(),
  CLIENT_PORT: Joi.number().port().default(3000),

  // Email Configuration
  SMTP_HOST: Joi.string().hostname().required(),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().email().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_SECURE: Joi.boolean().default(false),
  FROM_EMAIL: Joi.string().email().required(),
  FROM_NAME: Joi.string().default('DivvyUp'),

  // Payment Provider Configuration
  PAYMENT_PROVIDER: Joi.string()
    .valid('venmo', 'paypal', 'stripe', 'none')
    .default('none'),
  VENMO_CLIENT_ID: Joi.string().when('PAYMENT_PROVIDER', {
    is: 'venmo',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  VENMO_CLIENT_SECRET: Joi.string().when('PAYMENT_PROVIDER', {
    is: 'venmo',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  VENMO_REDIRECT_URI: Joi.string().uri().when('PAYMENT_PROVIDER', {
    is: 'venmo',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  PAYPAL_CLIENT_ID: Joi.string().when('PAYMENT_PROVIDER', {
    is: 'paypal',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  PAYPAL_CLIENT_SECRET: Joi.string().when('PAYMENT_PROVIDER', {
    is: 'paypal',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  STRIPE_PUBLISHABLE_KEY: Joi.string().when('PAYMENT_PROVIDER', {
    is: 'stripe',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  STRIPE_SECRET_KEY: Joi.string().when('PAYMENT_PROVIDER', {
    is: 'stripe',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  PAYMENT_WEBHOOK_SECRET: Joi.string().optional(),

  // Security Configuration
  BCRYPT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).default(100),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  // Logging Configuration
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_FORMAT: Joi.string()
    .valid('json', 'combined', 'common', 'dev')
    .default('combined'),

  // File Upload Configuration
  MAX_FILE_SIZE: Joi.number().integer().min(1024).default(5242880), // 5MB
  ALLOWED_FILE_TYPES: Joi.string().default(
    'image/jpeg,image/png,image/gif,application/pdf'
  ),
  UPLOAD_DIR: Joi.string().default('./uploads'),

  // Notification Configuration
  ENABLE_EMAIL_NOTIFICATIONS: Joi.boolean().default(true),
  ENABLE_PUSH_NOTIFICATIONS: Joi.boolean().default(false),
  PUSH_VAPID_PUBLIC_KEY: Joi.string().when('ENABLE_PUSH_NOTIFICATIONS', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  PUSH_VAPID_PRIVATE_KEY: Joi.string().when('ENABLE_PUSH_NOTIFICATIONS', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // Development Configuration
  ENABLE_DEBUG: Joi.boolean().default(false),
  ENABLE_SWAGGER: Joi.boolean().default(false),
  MOCK_PAYMENTS: Joi.boolean().default(false),

  // Docker Configuration
  DOCKER_COMPOSE_FILE: Joi.string().default('docker-compose.yml'),
}).unknown(true); // Allow additional environment variables

// Validate and export environment variables
const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: true,
});

if (error) {
  throw new Error(
    `Environment validation error: ${error.details.map(detail => detail.message).join(', ')}`
  );
}

// Export validated environment variables
export const env = {
  // Node Environment
  NODE_ENV: envVars.NODE_ENV,
  IS_DEVELOPMENT: envVars.NODE_ENV === 'development',
  IS_PRODUCTION: envVars.NODE_ENV === 'production',
  IS_TEST: envVars.NODE_ENV === 'test',

  // Server Configuration
  PORT: envVars.PORT,
  HOST: envVars.HOST,

  // Database Configuration
  DATABASE_URL: envVars.DATABASE_URL,
  DB: {
    HOST: envVars.DB_HOST,
    PORT: envVars.DB_PORT,
    NAME: envVars.DB_NAME,
    USER: envVars.DB_USER,
    PASSWORD: envVars.DB_PASSWORD,
    SSL: envVars.DB_SSL,
    POOL: {
      MIN: envVars.DB_POOL_MIN,
      MAX: envVars.DB_POOL_MAX,
    },
  },

  // Redis Configuration
  REDIS_URL: envVars.REDIS_URL,
  REDIS: {
    HOST: envVars.REDIS_HOST,
    PORT: envVars.REDIS_PORT,
    PASSWORD: envVars.REDIS_PASSWORD,
    DB: envVars.REDIS_DB,
  },

  // JWT Configuration
  JWT: {
    SECRET: envVars.JWT_SECRET,
    EXPIRES_IN: envVars.JWT_EXPIRES_IN,
    REFRESH_SECRET: envVars.JWT_REFRESH_SECRET,
    REFRESH_EXPIRES_IN: envVars.JWT_REFRESH_EXPIRES_IN,
  },

  // Client Configuration
  CLIENT: {
    URL: envVars.CLIENT_URL,
    PORT: envVars.CLIENT_PORT,
  },

  // Email Configuration
  EMAIL: {
    SMTP: {
      HOST: envVars.SMTP_HOST,
      PORT: envVars.SMTP_PORT,
      USER: envVars.SMTP_USER,
      PASS: envVars.SMTP_PASS,
      SECURE: envVars.SMTP_SECURE,
    },
    FROM: {
      EMAIL: envVars.FROM_EMAIL,
      NAME: envVars.FROM_NAME,
    },
  },

  // Payment Configuration
  PAYMENT: {
    PROVIDER: envVars.PAYMENT_PROVIDER,
    VENMO: {
      CLIENT_ID: envVars.VENMO_CLIENT_ID,
      CLIENT_SECRET: envVars.VENMO_CLIENT_SECRET,
      REDIRECT_URI: envVars.VENMO_REDIRECT_URI,
    },
    PAYPAL: {
      CLIENT_ID: envVars.PAYPAL_CLIENT_ID,
      CLIENT_SECRET: envVars.PAYPAL_CLIENT_SECRET,
    },
    STRIPE: {
      PUBLISHABLE_KEY: envVars.STRIPE_PUBLISHABLE_KEY,
      SECRET_KEY: envVars.STRIPE_SECRET_KEY,
    },
    WEBHOOK_SECRET: envVars.PAYMENT_WEBHOOK_SECRET,
  },

  // Security Configuration
  SECURITY: {
    BCRYPT_ROUNDS: envVars.BCRYPT_ROUNDS,
    RATE_LIMIT: {
      WINDOW_MS: envVars.RATE_LIMIT_WINDOW_MS,
      MAX_REQUESTS: envVars.RATE_LIMIT_MAX_REQUESTS,
    },
    CORS_ORIGIN: envVars.CORS_ORIGIN,
  },

  // Logging Configuration
  LOG: {
    LEVEL: envVars.LOG_LEVEL,
    FORMAT: envVars.LOG_FORMAT,
  },

  // File Upload Configuration
  UPLOAD: {
    MAX_FILE_SIZE: envVars.MAX_FILE_SIZE,
    ALLOWED_FILE_TYPES: envVars.ALLOWED_FILE_TYPES.split(','),
    DIR: envVars.UPLOAD_DIR,
  },

  // Notification Configuration
  NOTIFICATIONS: {
    EMAIL: envVars.ENABLE_EMAIL_NOTIFICATIONS,
    PUSH: envVars.ENABLE_PUSH_NOTIFICATIONS,
    PUSH_VAPID: {
      PUBLIC_KEY: envVars.PUSH_VAPID_PUBLIC_KEY,
      PRIVATE_KEY: envVars.PUSH_VAPID_PRIVATE_KEY,
    },
  },

  // Development Configuration
  DEV: {
    DEBUG: envVars.ENABLE_DEBUG,
    SWAGGER: envVars.ENABLE_SWAGGER,
    MOCK_PAYMENTS: envVars.MOCK_PAYMENTS,
  },

  // Docker Configuration
  DOCKER: {
    COMPOSE_FILE: envVars.DOCKER_COMPOSE_FILE,
  },
} as const;

// Type definitions for environment variables
export type Environment = typeof env;
export type NodeEnvironment = 'development' | 'production' | 'test';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type LogFormat = 'json' | 'combined' | 'common' | 'dev';
export type PaymentProvider = 'venmo' | 'paypal' | 'stripe' | 'none';
