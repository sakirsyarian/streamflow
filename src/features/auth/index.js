/**
 * Auth Feature Module
 */

const authRoutes = require('./auth.routes');
const AuthService = require('./auth.service');
const AuthController = require('./auth.controller');

module.exports = {
  routes: authRoutes,
  service: AuthService,
  controller: AuthController
};
