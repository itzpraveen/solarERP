'use strict';

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston about the colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Ensure log directory exists
const logDir = path.join('logs');
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Could not create logs directory:', e.message);
}

// Define which transports to use based on environment
const transports = [];

// Always log to files
transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format
  })
);

// In development, also log to console
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
} else {
  // In production, log to console with less verbose output
  transports.push(
    new winston.transports.Console({
      format,
      level: 'info'
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
  exitOnError: false
});

// Create a stream object for Morgan middleware
logger.stream = {
  write: (message) => logger.http(message.trim())
};

// Helper functions for common logging patterns
logger.logRequest = (req, message, data = {}) => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    ...data
  });
};

logger.logError = (error, req = null) => {
  const redact = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const SENSITIVE = new Set([
      'password', 'currentPassword', 'newPassword', 'passwordConfirm', 'password_confirmation',
      'passwordResetToken', 'emailVerificationToken', 'token', 'jwt', 'secret', 'apiKey',
      'authorization', 'Authorization', 'x-demo-key', 'X-Demo-Key'
    ]);
    const clone = Array.isArray(obj) ? [] : {};
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      clone[k] = SENSITIVE.has(k) ? '***REDACTED***' : (typeof v === 'object' ? redact(v) : v);
    }
    return clone;
  };

  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code || error.statusCode || 500
  };

  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id,
      body: redact(req.body),
      params: redact(req.params),
      query: redact(req.query),
      headers: redact({
        authorization: req.headers?.authorization,
        'x-demo-key': req.headers?.['x-demo-key']
      })
    };
  }

  logger.error('Application error', errorInfo);
};

logger.logDatabase = (operation, model, data = {}) => {
  logger.debug(`Database ${operation}`, {
    model,
    ...data
  });
};

logger.logPerformance = (operation, duration, metadata = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger[level](`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...metadata
  });
};

logger.logSecurity = (event, severity = 'warn', data = {}) => {
  logger[severity](`Security: ${event}`, data);
};

// Export the logger
module.exports = logger;
