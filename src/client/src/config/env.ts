// Client-side environment configuration
// Note: Only safe environment variables should be exposed to the client

interface ClientEnv {
  NODE_ENV: string;
  VITE_API_URL: string;
  VITE_CLIENT_URL: string;
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  VITE_ENABLE_DEBUG: boolean;
  VITE_PAYMENT_PROVIDER: string;
  VITE_STRIPE_PUBLISHABLE_KEY?: string;
  VITE_VENMO_CLIENT_ID?: string;
  VITE_PAYPAL_CLIENT_ID?: string;
}

// Get environment variables from Vite (prefixed with VITE_)
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = (import.meta as any).env?.[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value || defaultValue || '';
};

// Client environment configuration
export const clientEnv: ClientEnv = {
  NODE_ENV: getEnvVar('VITE_NODE_ENV', 'development'),
  VITE_API_URL: getEnvVar('VITE_API_URL', 'http://localhost:3001/api'),
  VITE_CLIENT_URL: getEnvVar('VITE_CLIENT_URL', 'http://localhost:3000'),
  VITE_APP_NAME: getEnvVar('VITE_APP_NAME', 'DivvyUp'),
  VITE_APP_VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  VITE_ENABLE_DEBUG: getEnvVar('VITE_ENABLE_DEBUG', 'false') === 'true',
  VITE_PAYMENT_PROVIDER: getEnvVar('VITE_PAYMENT_PROVIDER', 'none'),
  VITE_STRIPE_PUBLISHABLE_KEY: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY'),
  VITE_VENMO_CLIENT_ID: getEnvVar('VITE_VENMO_CLIENT_ID'),
  VITE_PAYPAL_CLIENT_ID: getEnvVar('VITE_PAYPAL_CLIENT_ID'),
};

// Environment utilities
export const isDevelopment = clientEnv.NODE_ENV === 'development';
export const isProduction = clientEnv.NODE_ENV === 'production';
export const isTest = clientEnv.NODE_ENV === 'test';

// API configuration
export const apiConfig = {
  baseURL: clientEnv.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// App configuration
export const appConfig = {
  name: clientEnv.VITE_APP_NAME,
  version: clientEnv.VITE_APP_VERSION,
  clientUrl: clientEnv.VITE_CLIENT_URL,
  debug: clientEnv.VITE_ENABLE_DEBUG,
};

// Payment configuration
export const paymentConfig = {
  provider: clientEnv.VITE_PAYMENT_PROVIDER,
  stripe: {
    publishableKey: clientEnv.VITE_STRIPE_PUBLISHABLE_KEY,
  },
  venmo: {
    clientId: clientEnv.VITE_VENMO_CLIENT_ID,
  },
  paypal: {
    clientId: clientEnv.VITE_PAYPAL_CLIENT_ID,
  },
};

// Validation function for required environment variables
export const validateClientEnv = (): void => {
  const requiredVars = ['VITE_API_URL', 'VITE_CLIENT_URL', 'VITE_APP_NAME'];

  const missingVars = requiredVars.filter(
    varName => !(import.meta as any).env?.[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};

// Initialize environment validation
if (isDevelopment) {
  validateClientEnv();
}
