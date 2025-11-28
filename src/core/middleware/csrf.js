/**
 * CSRF Protection Middleware
 */

const csrf = require('csrf');
const { v4: uuidv4 } = require('uuid');

const tokens = new csrf();

/**
 * Initialize CSRF token in session
 */
const initCsrf = (req, res, next) => {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = uuidv4();
  }
  res.locals.csrfToken = tokens.create(req.session.csrfSecret);
  next();
};

/**
 * Validate CSRF token
 */
const validateCsrf = (req, res, next) => {
  // Skip CSRF for specific routes
  const skipRoutes = [
    { path: '/login', method: 'POST' },
    { path: '/setup-account', method: 'POST' }
  ];
  
  const shouldSkip = skipRoutes.some(
    route => req.path === route.path && req.method === route.method
  );
  
  if (shouldSkip) {
    return next();
  }
  
  const token = req.body._csrf || req.query._csrf || req.headers['x-csrf-token'];
  
  if (!token || !tokens.verify(req.session.csrfSecret, token)) {
    return res.status(403).render('error', {
      title: 'Error',
      error: 'CSRF validation failed. Please try again.'
    });
  }
  
  next();
};

module.exports = {
  initCsrf,
  validateCsrf
};
