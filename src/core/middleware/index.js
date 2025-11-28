/**
 * Middleware Index
 * Export all middleware from single entry point
 */

const { isAuthenticated, isAdmin, loadUser } = require('./auth');
const { initCsrf, validateCsrf } = require('./csrf');
const { 
  loginLimiter, 
  uploadRateLimiter, 
  concurrentUploadLimiter,
  loginDelayMiddleware 
} = require('./rateLimiter');

module.exports = {
  // Auth
  isAuthenticated,
  isAdmin,
  loadUser,
  
  // CSRF
  initCsrf,
  validateCsrf,
  
  // Rate Limiting
  loginLimiter,
  uploadRateLimiter,
  concurrentUploadLimiter,
  loginDelayMiddleware
};
