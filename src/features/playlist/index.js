/**
 * Playlist Feature Module
 */

const playlistRoutes = require('./playlist.routes');
const PlaylistService = require('./playlist.service');
const PlaylistController = require('./playlist.controller');

module.exports = {
  routes: playlistRoutes,
  service: PlaylistService,
  controller: PlaylistController
};
