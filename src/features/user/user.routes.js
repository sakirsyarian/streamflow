/**
 * User Routes
 * Define routes for user feature
 */

const express = require('express');
const router = express.Router();
const UserController = require('./user.controller');
const { isAdmin } = require('../../core/middleware/auth');
const { upload } = require('../../../middleware/uploadMiddleware');

// Page routes
router.get('/users', isAdmin, UserController.index);

// API routes
router.post('/api/users/create', isAdmin, upload.single('avatar'), UserController.create);
router.post('/api/users/update', isAdmin, upload.single('avatar'), UserController.update);
router.post('/api/users/delete', isAdmin, UserController.delete);
router.post('/api/users/status', isAdmin, UserController.updateStatus);
router.post('/api/users/role', isAdmin, UserController.updateRole);

module.exports = router;
