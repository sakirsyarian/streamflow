/**
 * Video Routes
 */

const express = require('express');
const router = express.Router();
const VideoController = require('./video.controller');
const { isAuthenticated, isAdmin } = require('../../core/middleware/auth');
const { uploadRateLimiter, concurrentUploadLimiter } = require('../../core/middleware/rateLimiter');
const { uploadVideo } = require('../../../middleware/uploadMiddleware');

// Page routes
router.get('/gallery', isAuthenticated, VideoController.index);

// API routes
router.get('/api/videos', isAuthenticated, VideoController.getAll);
router.get('/api/videos/:id', isAuthenticated, VideoController.getOne);
router.post('/api/videos/upload', 
  isAuthenticated, 
  uploadRateLimiter, 
  concurrentUploadLimiter, 
  uploadVideo.single('video'), 
  VideoController.upload
);
router.put('/api/videos/:id', isAuthenticated, VideoController.update);
router.delete('/api/videos/:id', isAuthenticated, VideoController.delete);

// Admin routes
router.get('/api/users/:id/videos', isAdmin, VideoController.getByUser);

module.exports = router;
