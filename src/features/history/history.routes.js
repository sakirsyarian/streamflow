/**
 * History Routes
 */

const express = require('express');
const router = express.Router();
const HistoryController = require('./history.controller');
const { isAuthenticated } = require('../../core/middleware/auth');

// Page routes
router.get('/history', isAuthenticated, HistoryController.index);

// API routes
router.get('/api/history', isAuthenticated, HistoryController.getAll);
router.get('/api/history/stats', isAuthenticated, HistoryController.getStats);
router.delete('/api/history/:id', isAuthenticated, HistoryController.delete);
router.delete('/api/history', isAuthenticated, HistoryController.deleteAll);

module.exports = router;
