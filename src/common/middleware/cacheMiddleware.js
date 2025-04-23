const Redis = require('ioredis');
const config = require('../config');

// Define the no-op middleware for non-production environments
const noOpMiddleware = (req, res, next) => next();

// Define the actual caching middleware
const cacheMiddleware = async (req, res, next) => {
  // Create Redis client inside the middleware if needed, or ensure it's properly initialized
  // For simplicity, assuming redis instance is available here if env is production
  // Note: Redis client initialization might need adjustment based on application structure
  let redis;
  try {
    redis = new Redis(config.server.redis.url, {
      enableOfflineQueue: false,
      retryStrategy: () => null, // Don't retry on connection error
      connectTimeout: 1000, // Timeout quickly if Redis is down
    });
    redis.on('error', (err) => {
      console.warn('Redis Cache Middleware Error:', err.message); // Log warning, don't crash
    });
    // Wait briefly for connection, but don't block indefinitely
    await redis.ping().catch(() => {}); // Ignore ping error, proceed without cache if needed
  } catch (initErr) {
    console.warn('Redis client initialization failed:', initErr.message);
    return next(); // Proceed without caching if Redis init fails
  }

  // Only cache GET requests and only if Redis is ready
  if (req.method !== 'GET' || !redis || redis.status !== 'ready') {
    if (redis && redis.status !== 'ready') {
      console.warn('Redis not ready, skipping cache.');
      redis
        .quit()
        .catch((e) =>
          console.error(
            'Error quitting potentially disconnected Redis client:',
            e
          )
        ); // Attempt to clean up
    }
    return next();
  }

  const key = req.originalUrl;

  try {
    const cached = await redis.get(key);
    if (cached) {
      console.log(`Cache hit for: ${key}`);
      redis
        .quit()
        .catch((e) =>
          console.error('Error quitting Redis client after cache hit:', e)
        );
      return res.status(200).json(JSON.parse(cached));
    }

    console.log(`Cache miss for: ${key}`);
    // Hook into res.json to capture body
    const originalJson = res.json;
    res.json = (body) => {
      // Only cache successful responses (e.g., 2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Use stringify carefully, handle potential circular references if necessary
          const bodyString = JSON.stringify(body);
          redis
            .setex(key, config.server.redis.cacheTTL, bodyString)
            .then(() => console.log(`Cached response for: ${key}`))
            .catch((cacheErr) => console.error('Redis setex error:', cacheErr))
            .finally(() =>
              redis
                .quit()
                .catch((e) =>
                  console.error('Error quitting Redis client after setex:', e)
                )
            );
        } catch (stringifyErr) {
          console.error('Error stringifying JSON for cache:', stringifyErr);
          redis
            .quit()
            .catch((e) =>
              console.error(
                'Error quitting Redis client after stringify error:',
                e
              )
            );
        }
      } else {
        redis
          .quit()
          .catch((e) =>
            console.error(
              'Error quitting Redis client for non-cacheable response:',
              e
            )
          );
      }
      // Call the original res.json
      res.json = originalJson; // Restore original function
      return originalJson.call(res, body);
    };

    return next(); // Added return
  } catch (err) {
    console.error('Redis get error:', err);
    redis
      .quit()
      .catch((e) =>
        console.error('Error quitting Redis client after get error:', e)
      );
    return next(); // Proceed without caching on error // Added return
  }
};

// Conditionally export the correct middleware
module.exports =
  config.server.env === 'production' ? cacheMiddleware : noOpMiddleware;
