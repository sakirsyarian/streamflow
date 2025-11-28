/**
 * Video Feature Module
 */

const videoRoutes = require('./video.routes');
const VideoService = require('./video.service');
const VideoController = require('./video.controller');

module.exports = {
  routes: videoRoutes,
  service: VideoService,
  controller: VideoController
};
