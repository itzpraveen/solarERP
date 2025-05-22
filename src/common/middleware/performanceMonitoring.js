/**
 * Performance monitoring middleware
 * Tracks response times and logs performance metrics
 */

// Initialize request tracking storage
const requestStats = {
  totalRequests: 0,
  slowRequests: 0,
  pathStats: {},
};

// Performance threshold in milliseconds
const SLOW_THRESHOLD = 500;

// Reset interval in milliseconds (10 minutes)
const RESET_INTERVAL = 10 * 60 * 1000;

// Maximum request tracking history
const MAX_PATH_HISTORY = 100;

// Record request time and other metrics
const recordRequestMetrics = (req, res, startTime) => {
  const duration = Date.now() - startTime;
  const path = req.originalUrl.split('?')[0]; // Remove query params

  // Update total stats
  requestStats.totalRequests += 1;
  if (duration > SLOW_THRESHOLD) {
    requestStats.slowRequests += 1;
  }

  // Initialize or update path-specific stats
  if (!requestStats.pathStats[path]) {
    requestStats.pathStats[path] = {
      count: 0,
      totalDuration: 0,
      min: Number.MAX_SAFE_INTEGER,
      max: 0,
      slow: 0,
      recent: [],
    };
  }

  const pathStat = requestStats.pathStats[path];
  pathStat.count += 1;
  pathStat.totalDuration += duration;
  pathStat.min = Math.min(pathStat.min, duration);
  pathStat.max = Math.max(pathStat.max, duration);

  if (duration > SLOW_THRESHOLD) {
    pathStat.slow += 1;
  }

  // Add to recent history with timestamp
  pathStat.recent.push({
    timestamp: new Date().toISOString(),
    duration,
    method: req.method,
    status: res.statusCode,
    userAgent: req.get('user-agent') || 'unknown',
  });

  // Limit history size
  if (pathStat.recent.length > MAX_PATH_HISTORY) {
    pathStat.recent.shift();
  }

  // Log slow requests in development
  if (duration > SLOW_THRESHOLD) {
    console.warn(`SLOW REQUEST [${duration}ms]: ${req.method} ${path}`);
  }
};

// Middleware function to track request performance
const performanceMonitoring = (req, res, next) => {
  // Skip static files and health checks
  if (
    req.path.startsWith('/static') ||
    req.path.startsWith('/favicon') ||
    req.path === '/health'
  ) {
    return next();
  }

  const startTime = Date.now();

  // Track response time
  res.on('finish', () => {
    recordRequestMetrics(req, res, startTime);
  });

  return next();
};

// API endpoint to get performance stats
const getPerformanceStats = (req, res) => {
  // Calculate average times and percentages
  const stats = {
    overview: {
      totalRequests: requestStats.totalRequests,
      slowRequests: requestStats.slowRequests,
      slowPercentage:
        requestStats.totalRequests > 0
          ? (
              (requestStats.slowRequests / requestStats.totalRequests) *
              100
            ).toFixed(2)
          : 0,
    },
    endpoints: {},
  };

  // Process endpoint stats
  Object.keys(requestStats.pathStats).forEach((path) => {
    const pathStat = requestStats.pathStats[path];
    if (pathStat.count > 0) {
      stats.endpoints[path] = {
        requests: pathStat.count,
        avgResponseTime: (pathStat.totalDuration / pathStat.count).toFixed(2),
        minResponseTime:
          pathStat.min === Number.MAX_SAFE_INTEGER ? 0 : pathStat.min,
        maxResponseTime: pathStat.max,
        slowRequests: pathStat.slow,
        slowPercentage: ((pathStat.slow / pathStat.count) * 100).toFixed(2),
      };
    }
  });

  res.status(200).json({
    status: 'success',
    data: stats,
    slowThreshold: SLOW_THRESHOLD,
  });
};

// Reset stats periodically to prevent memory growth
setInterval(() => {
  Object.keys(requestStats.pathStats).forEach((path) => {
    // Keep the path in the stats but reset counters
    requestStats.pathStats[path] = {
      count: 0,
      totalDuration: 0,
      min: Number.MAX_SAFE_INTEGER,
      max: 0,
      slow: 0,
      recent: [],
    };
  });

  requestStats.totalRequests = 0;
  requestStats.slowRequests = 0;

  console.log('Performance statistics reset');
}, RESET_INTERVAL);

module.exports = {
  performanceMonitoring,
  getPerformanceStats,
};
