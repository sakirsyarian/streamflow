/**
 * Authentication Middleware
 * Handles user authentication and authorization
 */

const UserService = require('../../features/user/user.service');

/**
 * Check if user is authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

/**
 * Check if user is admin
 */
const isAdmin = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    
    const user = await UserService.findById(req.session.userId);
    if (!user || user.user_role !== 'admin') {
      return res.redirect('/dashboard');
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.redirect('/dashboard');
  }
};

/**
 * Load user data into request and response locals
 */
const loadUser = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await UserService.findById(req.session.userId);
      if (user) {
        req.session.username = user.username;
        req.session.avatar_path = user.avatar_path;
        if (user.email) req.session.email = user.email;
        res.locals.user = {
          id: user.id,
          username: user.username,
          avatar_path: user.avatar_path,
          email: user.email
        };
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }
  res.locals.req = req;
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  loadUser
};
