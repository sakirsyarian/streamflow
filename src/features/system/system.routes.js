/**
 * System Routes
 * System monitoring and settings
 */

const express = require('express');
const router = express.Router();
const SystemController = require('./system.controller');
const { isAuthenticated } = require('../../core/middleware/auth');
const { upload } = require('../../../middleware/uploadMiddleware');

// Settings page
router.get('/settings', isAuthenticated, SystemController.settingsPage);
router.post('/settings/profile', isAuthenticated, upload.single('avatar'), SystemController.updateProfile);
router.post('/settings/password', isAuthenticated, SystemController.updatePassword);

// System monitoring API
router.get('/api/system-stats', isAuthenticated, SystemController.getStats);
router.get('/api/system/stats', isAuthenticated, SystemController.getStats);
router.get('/api/system/health', SystemController.healthCheck);
router.get('/api/server-time', isAuthenticated, SystemController.getServerTime);

module.exports = router;
