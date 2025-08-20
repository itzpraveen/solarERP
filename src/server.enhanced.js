const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const logger = require('./utils/logger');
const swaggerSpec = require('./config/swagger');
const cacheService = require('./services/cache.service');
const {
  CSRFProtection,
  securityHeaders,
  preventSQLInjection,
  validateAndSanitize,
  AdvancedRateLimiter,
  mongoSanitize,
  hpp
} = require('./middleware/security');

require('dotenv').config();

// Initialize Sentry for error tracking (production only)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  const { ProfilingIntegration } = require('@sentry/profiling-node');
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration()
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV
  });
}

logger.info('Loading enhanced server module...');

// Import routes
const authRoutes = require('./api/routes/auth.routes');
const leadRoutes = require('./api/routes/lead.routes');
const customerRoutes = require('./api/routes/customer.routes');
const enableFeatureRoutes = (process.env.ENABLE_NONAUTH_ROUTES || 'false').toLowerCase() === 'true';
let proposalRoutes, projectRoutes, equipmentRoutes, documentRoutes, reportRoutes, serviceRequestRoutes;
if (enableFeatureRoutes) {
  proposalRoutes = require('./api/routes/proposal.routes');
  projectRoutes = require('./api/routes/project.routes');
  equipmentRoutes = require('./api/routes/equipment.routes');
  documentRoutes = require('./api/routes/document.routes');
  reportRoutes = require('./api/routes/report.routes');
  serviceRequestRoutes = require('./api/routes/service-request.routes');
}

// Create Express app
const app = express();
logger.info('Express app created');

// Sentry request handler (must be first)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Trust reverse proxy
app.set('trust proxy', 1);

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional security headers
app.use(securityHeaders);

// Logger middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: logger.stream }));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Advanced rate limiting
const advancedLimiter = new AdvancedRateLimiter({
  maxAttempts: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  progressiveDelay: true
});

// Standard rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.'
    });
  }
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.'
});

// Apply rate limiting
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgotPassword', authLimiter);
app.use('/api/auth/resetPassword', authLimiter);

// Body parser with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(mongoSanitize());
app.use(hpp());
app.use(preventSQLInjection);
app.use(validateAndSanitize);

// CSRF Protection
const csrfProtection = new CSRFProtection();
if (process.env.NODE_ENV === 'production') {
  app.use(csrfProtection.middleware());
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // Strict origin checking in production
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // More permissive in development
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// API Documentation (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SolarERP API Documentation'
}));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

app.get('/health/detailed', async (req, res) => {
  try {
    // Check database connection
    const db = require('./models');
    await db.sequelize.authenticate();
    
    // Check Redis connection
    const redisConnected = cacheService.isConnected;
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      services: {
        database: 'connected',
        redis: redisConnected ? 'connected' : 'disconnected'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// API routes with caching
app.use('/api/auth', authRoutes);

// Cache middleware for GET requests
const cacheMiddleware = (keyPrefix, ttl = 300) => {
  return cacheService.cacheMiddleware(
    (req) => `${keyPrefix}:${req.originalUrl}`,
    ttl
  );
};

// Apply caching to read endpoints
app.use('/api/leads', 
  (req, res, next) => {
    if (req.method === 'GET') {
      return cacheMiddleware('leads', 300)(req, res, next);
    }
    next();
  },
  leadRoutes
);

app.use('/api/customers',
  (req, res, next) => {
    if (req.method === 'GET') {
      return cacheMiddleware('customers', 300)(req, res, next);
    }
    next();
  },
  customerRoutes
);

// Optional feature routes
if (enableFeatureRoutes) {
  app.use('/api/proposals', proposalRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/service-requests', serviceRequestRoutes);
}

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const clientBuildDir = path.join(__dirname, '../client-new/build');
  const indexHtml = path.join(clientBuildDir, 'index.html');
  const clientBuilt = fs.existsSync(indexHtml);

  if (clientBuilt) {
    logger.info('Serving static files from:', clientBuildDir);
    
    // Serve static files with caching headers
    app.use(express.static(clientBuildDir, {
      maxAge: '1d',
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (path.match(/\.(js|css)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
      }
    }));
    
    app.get('*', (req, res, next) => {
      if (req.url.startsWith('/api')) return next();
      res.sendFile(indexHtml);
    });
  }
}

// Import error handler
const errorHandler = require('./middleware/errorHandler');

// 404 handler
app.use(errorHandler.handle404);

// Sentry error handler (must be before other error handlers)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  app.use(Sentry.Handlers.errorHandler());
}

// Global error handling middleware
app.use(errorHandler);

// Database connection
const db = require('./models');

// Initialize database with retry logic
const initDatabase = async (retries = 5) => {
  try {
    await db.sequelize.authenticate();
    logger.info('PostgreSQL connection established.');
    
    // Run pending migrations in production
    if (process.env.NODE_ENV === 'production') {
      const { exec } = require('child_process');
      exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
        if (error) {
          logger.error('Migration error:', error);
        } else {
          logger.info('Migrations completed:', stdout);
        }
      });
    }
    
    return true;
  } catch (err) {
    logger.error(`Database connection attempt failed: ${err.message}`);
    if (retries > 0) {
      logger.info(`Retrying database connection... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return initDatabase(retries - 1);
    }
    throw err;
  }
};

// Initialize database
initDatabase().catch(err => {
  logger.error('Unable to connect to the database after all retries:', err);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Close cache connection
  await cacheService.close();
  
  // Close database connection
  await db.sequelize.close();
  
  logger.info('Graceful shutdown completed.');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION!', { name: err.name, message: err.message, stack: err.stack });
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('unhandledRejection').then(() => process.exit(1));
  }
});

module.exports = app;