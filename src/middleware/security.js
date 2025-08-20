const crypto = require('crypto');
const xss = require('xss');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

// CSRF Protection Implementation
class CSRFProtection {
  constructor() {
    this.tokens = new Map();
    this.tokenExpiry = 3600000; // 1 hour
  }

  generateToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    this.tokens.set(sessionId, {
      token,
      expires: Date.now() + this.tokenExpiry
    });
    return token;
  }

  validateToken(sessionId, token) {
    const stored = this.tokens.get(sessionId);
    if (!stored) return false;
    
    // Clean up expired tokens
    if (stored.expires < Date.now()) {
      this.tokens.delete(sessionId);
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(stored.token),
      Buffer.from(token)
    );
  }

  middleware() {
    return (req, res, next) => {
      // Skip CSRF for GET requests and API calls with valid JWT
      if (req.method === 'GET' || req.path.startsWith('/api/auth/login')) {
        return next();
      }

      const sessionId = req.ip + req.get('user-agent');
      
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') {
        const token = req.headers['x-csrf-token'] || req.body._csrf;
        
        if (!token || !this.validateToken(sessionId, token)) {
          return res.status(403).json({
            status: 'error',
            message: 'Invalid CSRF token'
          });
        }
      }

      // Generate new token for response
      const newToken = this.generateToken(sessionId);
      res.setHeader('X-CSRF-Token', newToken);
      
      next();
    };
  }
}

// XSS Protection for user input
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return xss(data, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(data[key]);
      }
    }
    return sanitized;
  }
  return data;
};

// Advanced security headers
const securityHeaders = (req, res, next) => {
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS Protection (for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// SQL Injection Prevention for Sequelize
const preventSQLInjection = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        // Remove SQL keywords and special characters
        req.query[key] = req.query[key].replace(/(['";\\])|(-{2})|(\/\*)|(\*\/)|(\bOR\b)|(\bAND\b)|(\bUNION\b)|(\bSELECT\b)|(\bDROP\b)|(\bINSERT\b)|(\bUPDATE\b)|(\bDELETE\b)/gi, '');
      }
    }
  }
  next();
};

// Request validation and sanitization
const validateAndSanitize = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  
  // Sanitize params
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  
  // Validate content type
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    const contentType = req.get('content-type');
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid content type'
      });
    }
  }
  
  next();
};

// IP-based rate limiting with progressive delays
class AdvancedRateLimiter {
  constructor(options = {}) {
    this.attempts = new Map();
    this.maxAttempts = options.maxAttempts || 5;
    this.windowMs = options.windowMs || 900000; // 15 minutes
    this.progressiveDelay = options.progressiveDelay || true;
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip;
      const now = Date.now();
      
      if (!this.attempts.has(ip)) {
        this.attempts.set(ip, { count: 1, firstAttempt: now });
        return next();
      }
      
      const record = this.attempts.get(ip);
      
      // Reset if window expired
      if (now - record.firstAttempt > this.windowMs) {
        this.attempts.set(ip, { count: 1, firstAttempt: now });
        return next();
      }
      
      record.count++;
      
      if (record.count > this.maxAttempts) {
        // Progressive delay
        const delay = this.progressiveDelay ? 
          Math.min(1000 * Math.pow(2, record.count - this.maxAttempts), 60000) : 0;
        
        if (delay > 0) {
          return setTimeout(() => {
            res.status(429).json({
              status: 'error',
              message: 'Too many requests. Please try again later.',
              retryAfter: Math.ceil(delay / 1000)
            });
          }, delay);
        }
        
        return res.status(429).json({
          status: 'error',
          message: 'Rate limit exceeded'
        });
      }
      
      next();
    };
  }
}

// Security event logger
const securityLogger = (eventType, details, req) => {
  const winston = require('winston');
  const logger = winston.createLogger({
    level: 'warn',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'logs/security.log' })
    ]
  });

  logger.warn({
    timestamp: new Date().toISOString(),
    eventType,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    path: req.path,
    method: req.method,
    ...details
  });
};

// Export security middleware
module.exports = {
  CSRFProtection,
  sanitizeInput,
  securityHeaders,
  preventSQLInjection,
  validateAndSanitize,
  AdvancedRateLimiter,
  mongoSanitize,
  hpp,
  securityLogger
};