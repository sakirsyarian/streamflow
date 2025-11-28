/**
 * Stream Feature Module
 */

const streamRoutes = require('./stream.routes');
const StreamService = require('./stream.service');
const StreamController = require('./stream.controller');

module.exports = {
  routes: streamRoutes,
  service: StreamService,
  controller: StreamController
};
