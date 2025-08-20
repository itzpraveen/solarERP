'use strict';

const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour default
    this.init();
  }

  async init() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
      };

      // Use Redis URL if provided
      if (process.env.REDIS_URL) {
        this.client = new Redis(process.env.REDIS_URL, redisConfig);
      } else {
        this.client = new Redis(redisConfig);
      }

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        // eslint-disable-next-line no-console
        console.log('Redis: Connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Redis initialization failed:', error);
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Parsed value or null
   */
  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) return false;
    
    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async delByPattern(pattern) {
    if (!this.isConnected) return 0;
    
    try {
      let deleted = 0;
      for await (const key of this.client.scanIterator({ MATCH: pattern })) {
        await this.client.del(key);
        deleted += 1;
      }
      return deleted;
    } catch (error) {
      console.error(`Cache delete by pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Existence status
   */
  async exists(key) {
    if (!this.isConnected) return false;
    
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   * @param {string} key - Cache key
   * @returns {Promise<number>} TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  async ttl(key) {
    if (!this.isConnected) return -2;
    
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -2;
    }
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} Success status
   */
  async flush() {
    if (!this.isConnected) return false;
    
    try {
      await this.client.flushDb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Cache wrapper for async functions
   * @param {string} key - Cache key
   * @param {Function} fn - Async function to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} Cached or fresh value
   */
  async remember(key, fn, ttl = this.defaultTTL) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  /**
   * Generate cache key
   * @param {string} prefix - Key prefix
   * @param {any} params - Parameters to include in key
   * @returns {string} Cache key
   */
  static generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(':');
    
    return sortedParams ? `${prefix}:${sortedParams}` : prefix;
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Cache middleware for Express routes
const cacheMiddleware = (keyPrefix, ttl = 3600) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from request
    const key = CacheService.generateKey(keyPrefix, {
      ...req.params,
      ...req.query,
      userId: req.user?.id
    });

    // Try to get from cache
    const cached = await cacheService.get(key);
    if (cached) {
      return res.status(200).json({
        ...cached,
        cached: true
      });
    }

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache successful responses
    res.json = function(data) {
      if (res.statusCode === 200) {
        cacheService.set(key, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
};

// Cache invalidation helper
const invalidateCache = async (patterns) => {
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];
  
  for (const pattern of patternArray) {
    await cacheService.delByPattern(pattern);
  }
};

module.exports = {
  cacheService,
  cacheMiddleware,
  invalidateCache,
  CacheService
};
