/**
 * Playlist Routes
 */

const express = require('express');
const router = express.Router();
const PlaylistController = require('./playlist.controller');
const { isAuthenticated } = require('../../core/middleware/auth');

// Page routes
router.get('/playlist', isAuthenticated, PlaylistController.index);

// API routes
router.get('/api/playlists', isAuthenticated, PlaylistController.getAll);
router.get('/api/playlists/:id', isAuthenticated, PlaylistController.getOne);
router.post('/api/playlists', isAuthenticated, PlaylistController.create);
router.put('/api/playlists/:id', isAuthenticated, PlaylistController.update);
router.delete('/api/playlists/:id', isAuthenticated, PlaylistController.delete);

// Playlist video management
router.post('/api/playlists/:id/videos', isAuthenticated, PlaylistController.addVideo);
router.delete('/api/playlists/:id/videos/:videoId', isAuthenticated, PlaylistController.removeVideo);
router.put('/api/playlists/:id/reorder', isAuthenticated, PlaylistController.reorder);

module.exports = router;
