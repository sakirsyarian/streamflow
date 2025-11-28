/**
 * System Feature Module
 */

const systemRoutes = require('./system.routes');
const SystemController = require('./system.controller');

module.exports = {
  routes: systemRoutes,
  controller: SystemController
};
