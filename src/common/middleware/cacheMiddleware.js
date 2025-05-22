const Redis = require('ioredis');
const config = require('../config');

// Define the no-op middleware for non-production environments
const noOpMiddleware = (req, res, next) => next();

// Define the actual caching middleware
// Create a Redis connection pool for better performance
let redisPool = null;
const MAX_POOL_SIZE = 10;

// Initialize the connection pool if in production
if (config.server.env === 'production') {
  try {
    redisPool = [];
    for (let i = 0; i < MAX_POOL_SIZE; i += 1) {
      const client = new Redis(config.server.redis.url, {
        enableOfflineQueue: false,
        retryStrategy: () => null, // Don't retry on connection error
        connectTimeout: 1000, // Timeout quickly if Redis is down
      });
      client.on('error', (err) => {
        console.warn(
          `Redis Cache Middleware Error (client ${i}):`,
          err.message
        );
      });
      redisPool.push(client);
    }
    console.log(
      `Redis connection pool initialized with ${MAX_POOL_SIZE} connections`
    );
  } catch (initErr) {
    console.warn('Redis pool initialization failed:', initErr.message);
  }
}

const cacheMiddleware = async (req, res, next) => {
  // Skip caching for non-GET requests or if pool is not available
  if (req.method !== 'GET' || !redisPool || redisPool.length === 0) {
    return next();
  }

  // Get a client from the pool
  const poolIndex = Math.floor(Math.random() * redisPool.length);
  const redis = redisPool[poolIndex];

  // Check if the client is ready
  if (!redis || redis.status !== 'ready') {
    return next();
  }

  // Generate cache key with path and query parameters for better specificity
  const key = `cache:${req.originalUrl}`;

  // Skip caching for specific endpoints that shouldn't be cached
  if (
    req.originalUrl.includes('/api/reports') ||
    req.originalUrl.includes('/api/auth') ||
    req.originalUrl.includes('no-cache=true')
  ) {
    return next();
  }

  // Log start time for performance tracking
  const startTime = Date.now();

  try {
    const cached = await redis.get(key);
    if (cached) {
      const endTime = Date.now();
      console.log(`Cache hit for: ${key} (${endTime - startTime}ms)`);
      return res.status(200).json(JSON.parse(cached));
    }

    console.log(`Cache miss for: ${key}`);
    // Hook into res.json to capture body
    const originalJson = res.json;
    res.json = (body) => {
      // Only cache successful responses (e.g., 2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Calculate response size for logging
        const bodyString = JSON.stringify(body);
        const bodySizeKB = (bodyString.length / 1024).toFixed(2);

        // Only cache responses under 1MB to prevent memory issues
        if (bodyString.length < 1024 * 1024) {
          // Set appropriate TTL based on endpoint type
          let { cacheTTL } = config.server.redis;

          // Vary cache TTL based on endpoint type
          if (req.originalUrl.includes('/api/inventory')) {
            cacheTTL = 60 * 60; // 1 hour for inventory
          } else if (req.originalUrl.includes('/api/customers')) {
            cacheTTL = 30 * 60; // 30 minutes for customers
          } else if (req.originalUrl.includes('/api/projects')) {
            cacheTTL = 15 * 60; // 15 minutes for projects
          }

          redis
            .setex(key, cacheTTL, bodyString)
            .then(() => {
              const endTime = Date.now();
              console.log(
                `Cached response for: ${key} (${endTime - startTime}ms, ${bodySizeKB}KB, TTL: ${cacheTTL}s)`
              );
            })
            .catch((cacheErr) => console.error('Redis setex error:', cacheErr));
        } else {
          console.log(`Response too large to cache: ${key} (${bodySizeKB}KB)`);
        }
      }
      // Call the original res.json
      res.json = originalJson; // Restore original function
      return originalJson.call(res, body);
    };

    return next(); // Added return
  } catch (err) {
    console.error('Redis get error:', err);
    return next(); // Proceed without caching on error
  }
};

// Function to close Redis connections on app shutdown
const closeRedisConnections = () => {
  if (redisPool && redisPool.length > 0) {
    console.log('Closing Redis connection pool...');
    Promise.all(redisPool.map((client) => client.quit()))
      .then(() => console.log('All Redis connections closed successfully'))
      .catch((err) => console.error('Error closing Redis connections:', err));
  }
};

// Conditionally export the correct middleware
module.exports = {
  middleware:
    config.server.env === 'production' ? cacheMiddleware : noOpMiddleware,
  closeRedisConnections,
};
