/**
 * StreamFlow v2.1 - Main Application Entry Point
 * 
 * Feature-based architecture with clean separation of concerns
 * 
 * @author Bang Tutorial
 * @version 2.1.0
 */

require('dotenv').config();
require('../services/logger.js');

const express = require('express');
const path = require('path');
const engine = require('ejs-mate');
const session = require('express-session');
const fs = require('fs');

// Configuration
const config = require('./config');
const sessionConfig = require('./config/session');

// Core middleware
const { initCsrf, loadUser } = require('./core/middleware');
const viewHelpers = require('./core/helpers/viewHelpers');

// Feature routes
const authRoutes = require('./features/auth/auth.routes');
const userRoutes = require('./features/user/user.routes');
const videoRoutes = require('./features/video/video.routes');
const streamRoutes = require('./features/stream/stream.routes');
const playlistRoutes = require('./features/playlist/playlist.routes');
const historyRoutes = require('./features/history/history.routes');
const systemRoutes = require('./features/system/system.routes');

// Services
const { ensureDirectories } = require('../utils/storage');
const schedulerService = require('../services/schedulerService');

// FFmpeg setup
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('-----------------------------------');
  console.error('UNHANDLED REJECTION AT:', promise);
  console.error('REASON:', reason);
  console.error('-----------------------------------');
});

process.on('uncaughtException', (error) => {
  console.error('-----------------------------------');
  console.error('UNCAUGHT EXCEPTION:', error);
  console.error('-----------------------------------');
});

// Initialize Express app
const app = express();
app.set('trust proxy', config.app.trustProxy);

// Ensure required directories exist
ensureDirectories();

// View engine setup
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Service worker
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, '..', 'public', 'sw.js'));
});

// Body parsers
app.use(express.urlencoded({ extended: true, limit: '10gb' }));
app.use(express.json({ limit: '10gb' }));

// Session
app.use(session(sessionConfig));

// Load user data into request
app.use(loadUser);

// CSRF protection
app.use(initCsrf);

// View helpers
app.locals.helpers = viewHelpers;

// Upload headers
app.use('/uploads', (req, res, next) => {
  res.header('Cache-Control', 'no-cache');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  next();
});

// Avatar serving with proper content type
app.use('/uploads/avatars', (req, res, next) => {
  const file = path.join(__dirname, '..', 'public', 'uploads', 'avatars', path.basename(req.path));
  if (fs.existsSync(file)) {
    const ext = path.extname(file).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif'
    };
    res.header('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.header('Cache-Control', 'max-age=60, must-revalidate');
    fs.createReadStream(file).pipe(res);
  } else {
    next();
  }
});

// ============================================
// ROUTES
// ============================================

// Feature routes
app.use(authRoutes);
app.use(userRoutes);
app.use(videoRoutes);
app.use(streamRoutes);
app.use(playlistRoutes);
app.use(historyRoutes);
app.use(systemRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Not Found',
    error: 'Page not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Application error:', err);
  res.status(500).render('error', {
    title: 'Error',
    error: config.app.env === 'development' ? err.message : 'Internal server error'
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = config.app.port;

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`StreamFlow v2.1 - Feature-Based Architecture`);
  console.log('='.repeat(50));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.app.env}`);
  console.log('='.repeat(50));
  
  // Initialize scheduler
  schedulerService.init();
});

module.exports = app;
