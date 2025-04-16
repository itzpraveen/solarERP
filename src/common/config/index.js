/**
 * Centralized configuration management
 * This file manages all environment variables and configuration settings
 */

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5002,
    redis: {
      url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
      cacheTTL: parseInt(process.env.REDIS_CACHE_TTL, 10) || 30, // seconds
    },

    env: process.env.NODE_ENV || 'development',
    apiPrefix: '/api',
  },

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/solarERP',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // JWT configuration
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      '692cb33671b08ed48e58c5a70696b5cdc3038b8b919af6a83792541b1c507203df53c7ba89b3e3f5f13ae695a3a7ed608ea49a2cc111cef99d6120867553276d',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: '30d',
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@solarerp.com',
  },

  // Security configuration
  security: {
    bcryptRounds: 12,
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 1000, // 1000 requests per windowMs
  },

  // Admin user configuration
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@solarerp.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
    lastName: process.env.ADMIN_LAST_NAME || 'User',
  },
};

module.exports = config;
