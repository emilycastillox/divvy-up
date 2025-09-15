# Environment Configuration Guide

This document explains how to configure environment variables for the DivvyUp application across different environments.

## Overview

The DivvyUp application uses environment variables for configuration across three main workspaces:
- **Root**: Global configuration and Docker setup
- **Client**: Frontend React application configuration
- **Server**: Backend Node.js/Express application configuration
- **Shared**: Common environment validation and types

## Environment Files

### Root Environment (.env.example)
Located at the project root, contains all environment variables for the entire application.

### Workspace-Specific Environment Files
- `src/client/.env.example` - Client-specific environment variables (VITE_ prefixed)
- `src/server/.env.example` - Server-specific environment variables

## Environment Variable Categories

### 1. Node Environment
```bash
NODE_ENV=development|production|test
```

### 2. Server Configuration
```bash
PORT=3001                    # Server port
HOST=localhost              # Server host
```

### 3. Database Configuration
```bash
# PostgreSQL Configuration
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=divvyup
DB_USER=username
DB_PASSWORD=password
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### 4. Redis Configuration
```bash
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 5. JWT Configuration
```bash
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-minimum-32-characters
JWT_REFRESH_EXPIRES_IN=30d
```

### 6. Client Configuration
```bash
CLIENT_URL=http://localhost:3000
CLIENT_PORT=3000
```

### 7. Email Configuration
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
FROM_EMAIL=noreply@divvyup.com
FROM_NAME=DivvyUp
```

### 8. Payment Provider Configuration
```bash
PAYMENT_PROVIDER=none|venmo|paypal|stripe

# Venmo (if using Venmo)
VENMO_CLIENT_ID=your-venmo-client-id
VENMO_CLIENT_SECRET=your-venmo-client-secret
VENMO_REDIRECT_URI=http://localhost:3000/auth/venmo/callback

# PayPal (if using PayPal)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Stripe (if using Stripe)
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key

# Payment Webhook Secret
PAYMENT_WEBHOOK_SECRET=your-webhook-secret-key
```

### 9. Security Configuration
```bash
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000
```

### 10. Logging Configuration
```bash
LOG_LEVEL=error|warn|info|debug
LOG_FORMAT=json|combined|common|dev
```

### 11. File Upload Configuration
```bash
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
UPLOAD_DIR=./uploads
```

### 12. Notification Configuration
```bash
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_PUSH_NOTIFICATIONS=false
PUSH_VAPID_PUBLIC_KEY=your-vapid-public-key
PUSH_VAPID_PRIVATE_KEY=your-vapid-private-key
```

### 13. Development Configuration
```bash
ENABLE_DEBUG=false
ENABLE_SWAGGER=false
MOCK_PAYMENTS=false
```

## Client-Side Environment Variables

Client-side environment variables must be prefixed with `VITE_` to be accessible in the browser:

```bash
# Client Environment Variables (VITE_ prefixed)
VITE_NODE_ENV=development
VITE_API_URL=http://localhost:3001/api
VITE_CLIENT_URL=http://localhost:3000
VITE_APP_NAME=DivvyUp
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=false
VITE_PAYMENT_PROVIDER=none
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
VITE_VENMO_CLIENT_ID=your-venmo-client-id
VITE_PAYPAL_CLIENT_ID=your-paypal-client-id
```

## Environment Setup

### 1. Copy Environment Files
```bash
# Copy root environment file
cp .env.example .env

# Copy client environment file
cp src/client/.env.example src/client/.env

# Copy server environment file
cp src/server/.env.example src/server/.env
```

### 2. Update Configuration
Edit the `.env` files with your specific configuration values.

### 3. Validate Configuration
```bash
# Build shared package to validate environment variables
npm run build:shared

# Run type checking
npm run type-check
```

## Environment Validation

The application includes comprehensive environment variable validation using Joi:

### Server-Side Validation
- Validates all environment variables on server startup
- Throws errors for missing required variables
- Provides type-safe access to configuration

### Client-Side Validation
- Validates required client environment variables
- Provides fallback values for optional variables
- Type-safe configuration access

## Environment-Specific Configurations

### Development
```bash
NODE_ENV=development
ENABLE_DEBUG=true
ENABLE_SWAGGER=true
LOG_LEVEL=debug
```

### Production
```bash
NODE_ENV=production
ENABLE_DEBUG=false
ENABLE_SWAGGER=false
LOG_LEVEL=info
DB_SSL=true
```

### Test
```bash
NODE_ENV=test
MOCK_PAYMENTS=true
LOG_LEVEL=error
```

## Docker Environment

When using Docker, environment variables are automatically configured:

```bash
# Start with Docker environment
npm run docker:dev

# Or start full-stack with Docker
npm run docker:fullstack
```

Docker Compose automatically sets:
- `DATABASE_URL=postgresql://divvyup_user:divvyup_password@postgres:5432/divvyup`
- `REDIS_URL=redis://redis:6379`
- `CLIENT_URL=http://localhost:3000`

## Security Considerations

### 1. Never Commit .env Files
- Add `.env` files to `.gitignore`
- Use `.env.example` files for documentation
- Use environment-specific secret management in production

### 2. Use Strong Secrets
- Generate strong JWT secrets (minimum 32 characters)
- Use different secrets for different environments
- Rotate secrets regularly

### 3. Client-Side Variables
- Only expose safe variables to the client (VITE_ prefixed)
- Never expose secrets or API keys to the client
- Use server-side proxies for sensitive operations

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Check file paths and naming
   - Ensure proper prefixes (VITE_ for client)
   - Restart development servers

2. **Validation errors**
   - Check required variables are set
   - Verify variable types and formats
   - Check for typos in variable names

3. **Client variables not accessible**
   - Ensure VITE_ prefix is used
   - Check Vite configuration
   - Restart Vite development server

### Debug Environment Variables

```bash
# Check server environment
npm run dev:server

# Check client environment
npm run dev:client

# Validate all environments
npm run type-check
```

## Best Practices

1. **Use environment-specific files**
   - `.env.development`
   - `.env.production`
   - `.env.test`

2. **Document all variables**
   - Include descriptions in .env.example
   - Update documentation when adding variables

3. **Validate early**
   - Validate environment variables on startup
   - Provide clear error messages

4. **Use type safety**
   - Leverage TypeScript for configuration types
   - Use validation schemas for runtime safety

5. **Secure sensitive data**
   - Use proper secret management
   - Never log sensitive variables
   - Use environment-specific configurations
