/**
 * Application Configuration
 * Centralized configuration management
 */

require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT || 7575,
    env: process.env.NODE_ENV || 'development',
    trustProxy: true
  },
  
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    dbPath: './db/',
    dbName: 'sessions.db'
  },
  
  upload: {
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
    maxConcurrentUploads: 3,
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
  },
  
  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5
    },
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10
    }
  },
  
  paths: {
    uploads: 'public/uploads',
    avatars: 'public/uploads/avatars',
    videos: 'public/uploads/videos',
    thumbnails: 'public/uploads/thumbnails',
    temp: 'temp'
  }
};
