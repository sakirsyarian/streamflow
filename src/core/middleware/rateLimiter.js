/**
 * Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');
const config = require('../../config');

/**
 * Login rate limiter
 */
const loginLimiter = rateLimit({
  windowMs: config.rateLimit.login.windowMs,
  max: config.rateLimit.login.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('login', {
      title: 'Login',
      error: 'Too many login attempts. Please try again in 15 minutes.'
    });
  },
  requestWasSuccessful: (request, response) => {
    return response.statusCode < 400;
  }
});

/**
 * Upload rate limiter
 */
const uploadRateLimiter = rateLimit({
  windowMs: config.rateLimit.upload.windowMs,
  max: config.rateLimit.upload.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many upload requests from this IP. Maximum 10 uploads per hour.',
    retryAfter: '1 hour'
  },
  skip: (req) => {
    // Skip for localhost in development
    if (config.app.env === 'development') {
      const localIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
      return localIPs.includes(req.ip);
    }
    return false;
  },
  handler: (req, res) => {
    console.warn(`[Rate Limit] Upload limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many upload requests. Maximum 10 uploads per hour.',
      retryAfter: '1 hour',
      details: 'Please wait before uploading more videos.'
    });
  }
});

/**
 * Concurrent upload limiter
 */
const activeUploads = new Map();

const concurrentUploadLimiter = (req, res, next) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const currentCount = activeUploads.get(userId) || 0;
  const MAX_CONCURRENT = config.upload.maxConcurrentUploads;

  if (currentCount >= MAX_CONCURRENT) {
    console.warn(`[Rate Limit] Concurrent upload limit exceeded for user: ${userId}`);
    return res.status(429).json({
      success: false,
      error: `Maximum concurrent uploads (${MAX_CONCURRENT}) reached.`,
      details: 'Please wait for current uploads to complete before starting new ones.',
      currentUploads: currentCount
    });
  }

  activeUploads.set(userId, currentCount + 1);
  console.log(`[Rate Limit] User ${userId} active uploads: ${currentCount + 1}/${MAX_CONCURRENT}`);

  const cleanup = () => {
    const count = activeUploads.get(userId) || 0;
    if (count > 0) {
      activeUploads.set(userId, count - 1);
      console.log(`[Rate Limit] User ${userId} active uploads: ${count - 1}/${MAX_CONCURRENT}`);
    }
  };

  res.on('finish', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);

  next();
};

/**
 * Login delay middleware (prevent timing attacks)
 */
const loginDelayMiddleware = async (req, res, next) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  next();
};

module.exports = {
  loginLimiter,
  uploadRateLimiter,
  concurrentUploadLimiter,
  loginDelayMiddleware
};
