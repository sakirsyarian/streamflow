/**
 * User Feature Module
 */

const userRoutes = require('./user.routes');
const UserService = require('./user.service');
const UserController = require('./user.controller');

module.exports = {
  routes: userRoutes,
  service: UserService,
  controller: UserController
};
