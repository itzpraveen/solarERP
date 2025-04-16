const Redis = require('ioredis');
const config = require('../config');

// Only enable caching in production
if (config.server.env !== 'production') {
  module.exports = (req, res, next) => next();
  return;
}

// Create Redis client without offline queue to avoid hanging
const redis = new Redis(config.server.redis.url, {
  enableOfflineQueue: false,
  retryStrategy: () => null
});
redis.on('error', err => {
  console.error('Redis connection error:', err);
});

/**
 * Cache middleware:
 * - If Redis is available, serve cached JSON responses for GET requests.
 * - On miss, capture and cache successful JSON responses.
 */
module.exports = async (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET' || !redis.status || redis.status !== 'ready') {
    return next();
  }

  const key = req.originalUrl;

  try {
    const cached = await redis.get(key);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // Hook into res.json to capture body
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Cache the body with TTL
      try {
        redis.setex(key, config.server.redis.cacheTTL, JSON.stringify(body));
      } catch (cacheErr) {
        console.error('Redis setex error:', cacheErr);
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    console.error('Redis get error:', err);
    next();
  }
};