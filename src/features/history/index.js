/**
 * History Feature Module
 */

const historyRoutes = require('./history.routes');
const HistoryService = require('./history.service');
const HistoryController = require('./history.controller');

module.exports = {
  routes: historyRoutes,
  service: HistoryService,
  controller: HistoryController
};
