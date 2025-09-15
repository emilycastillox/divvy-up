// Mock environment variables before importing env
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.HOST = 'localhost';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/divvyup_test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'divvyup_test';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_SSL = 'false';
process.env.DB_POOL_MIN = '2';
process.env.DB_POOL_MAX = '10';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_PASSWORD = '';
process.env.REDIS_DB = '0';
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.JWT_REFRESH_SECRET =
  'test-refresh-jwt-secret-key-minimum-32-characters-long';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.CLIENT_PORT = '3000';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';
process.env.SMTP_SECURE = 'false';
process.env.FROM_EMAIL = 'test@divvyup.com';
process.env.FROM_NAME = 'DivvyUp Test';
process.env.PAYMENT_PROVIDER = 'none';
process.env.PAYMENT_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.BCRYPT_ROUNDS = '12';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.LOG_LEVEL = 'error';
process.env.LOG_FORMAT = 'json';
process.env.MAX_FILE_SIZE = '5242880';
process.env.ALLOWED_FILE_TYPES =
  'image/jpeg,image/png,image/gif,application/pdf';
process.env.UPLOAD_DIR = './uploads';
process.env.ENABLE_EMAIL_NOTIFICATIONS = 'false';
process.env.ENABLE_PUSH_NOTIFICATIONS = 'false';
process.env.ENABLE_DEBUG = 'false';
process.env.ENABLE_SWAGGER = 'false';
process.env.MOCK_PAYMENTS = 'true';
process.env.DOCKER_COMPOSE_FILE = 'docker-compose.yml';

import { env } from './env';

describe('Environment Configuration', () => {
  it('should have required environment variables', () => {
    expect(env.NODE_ENV).toBeDefined();
    expect(env.PORT).toBeDefined();
    expect(env.DATABASE_URL).toBeDefined();
    expect(env.REDIS_URL).toBeDefined();
    expect(env.JWT.SECRET).toBeDefined();
    expect(env.CLIENT.URL).toBeDefined();
  });

  it('should have correct test values', () => {
    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(3001);
    expect(env.CLIENT.PORT).toBe(3000);
    expect(env.SECURITY.BCRYPT_ROUNDS).toBe(12);
    expect(env.LOG.LEVEL).toBe('error');
  });

  it('should have correct environment flags', () => {
    expect(env.IS_DEVELOPMENT).toBe(false);
    expect(env.IS_PRODUCTION).toBe(false);
    expect(env.IS_TEST).toBe(true);
  });

  it('should have database configuration', () => {
    expect(env.DB.HOST).toBeDefined();
    expect(env.DB.PORT).toBe(5432);
    expect(env.DB.NAME).toBeDefined();
    expect(env.DB.USER).toBeDefined();
    expect(env.DB.PASSWORD).toBeDefined();
  });

  it('should have Redis configuration', () => {
    expect(env.REDIS.HOST).toBeDefined();
    expect(env.REDIS.PORT).toBe(6379);
    expect(env.REDIS.DB).toBe(0);
  });

  it('should have JWT configuration', () => {
    expect(env.JWT.SECRET).toBeDefined();
    expect(env.JWT.EXPIRES_IN).toBe('7d');
    expect(env.JWT.REFRESH_SECRET).toBeDefined();
    expect(env.JWT.REFRESH_EXPIRES_IN).toBe('30d');
  });

  it('should have email configuration', () => {
    expect(env.EMAIL.SMTP.HOST).toBeDefined();
    expect(env.EMAIL.SMTP.PORT).toBe(587);
    expect(env.EMAIL.SMTP.USER).toBeDefined();
    expect(env.EMAIL.SMTP.PASS).toBeDefined();
    expect(env.EMAIL.FROM.EMAIL).toBeDefined();
    expect(env.EMAIL.FROM.NAME).toBeDefined();
  });

  it('should have payment configuration', () => {
    expect(env.PAYMENT.PROVIDER).toBe('none');
    expect(env.PAYMENT.WEBHOOK_SECRET).toBeDefined();
  });

  it('should have security configuration', () => {
    expect(env.SECURITY.BCRYPT_ROUNDS).toBe(12);
    expect(env.SECURITY.RATE_LIMIT.WINDOW_MS).toBe(900000);
    expect(env.SECURITY.RATE_LIMIT.MAX_REQUESTS).toBe(100);
    expect(env.SECURITY.CORS_ORIGIN).toBeDefined();
  });

  it('should have logging configuration', () => {
    expect(env.LOG.LEVEL).toBe('error');
    expect(env.LOG.FORMAT).toBe('json');
  });

  it('should have file upload configuration', () => {
    expect(env.UPLOAD.MAX_FILE_SIZE).toBe(5242880);
    expect(env.UPLOAD.ALLOWED_FILE_TYPES).toContain('image/jpeg');
    expect(env.UPLOAD.ALLOWED_FILE_TYPES).toContain('image/png');
    expect(env.UPLOAD.DIR).toBe('./uploads');
  });

  it('should have notification configuration', () => {
    expect(env.NOTIFICATIONS.EMAIL).toBe(false);
    expect(env.NOTIFICATIONS.PUSH).toBe(false);
  });

  it('should have development configuration', () => {
    expect(env.DEV.DEBUG).toBe(false);
    expect(env.DEV.SWAGGER).toBe(false);
    expect(env.DEV.MOCK_PAYMENTS).toBe(true);
  });
});
