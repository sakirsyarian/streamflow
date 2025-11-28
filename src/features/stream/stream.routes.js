/**
 * Stream Routes
 */

const express = require('express');
const router = express.Router();
const StreamController = require('./stream.controller');
const { isAuthenticated, isAdmin } = require('../../core/middleware/auth');

// Page routes
router.get('/', (req, res) => res.redirect('/dashboard'));
router.get('/dashboard', isAuthenticated, StreamController.dashboard);

// API routes
router.get('/api/streams', isAuthenticated, StreamController.getAll);
router.get('/api/streams/:id', isAuthenticated, StreamController.getOne);
router.post('/api/streams', isAuthenticated, StreamController.create);
router.put('/api/streams/:id', isAuthenticated, StreamController.update);
router.delete('/api/streams/:id', isAuthenticated, StreamController.delete);

// Stream control
router.post('/api/streams/:id/start', isAuthenticated, StreamController.start);
router.post('/api/streams/:id/stop', isAuthenticated, StreamController.stop);

// Admin routes
router.get('/api/users/:id/streams', isAdmin, StreamController.getByUser);

module.exports = router;
