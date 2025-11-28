/**
 * Video Controller
 * Handle HTTP requests for video operations
 */

const VideoService = require('./video.service');
const UserService = require('../user/user.service');
const { getVideoInfo, generateThumbnail } = require('../../../utils/videoProcessor');
const path = require('path');
const fs = require('fs');

class VideoController {
  /**
   * GET /gallery - Video gallery page
   */
  static async index(req, res) {
    try {
      const videos = await VideoService.findByUserId(req.session.userId);
      const user = await UserService.findById(req.session.userId);
      
      res.render('gallery', {
        title: 'Video Gallery',
        active: 'gallery',
        user,
        videos
      });
    } catch (error) {
      console.error('Gallery error:', error);
      res.redirect('/dashboard');
    }
  }

  /**
   * GET /api/videos - Get all videos for user
   */
  static async getAll(req, res) {
    try {
      const videos = await VideoService.findByUserId(req.session.userId);
      res.json({ success: true, videos });
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch videos' });
    }
  }

  /**
   * GET /api/videos/:id - Get single video
   */
  static async getOne(req, res) {
    try {
      const video = await VideoService.findById(req.params.id);
      
      if (!video || video.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Video not found' });
      }
      
      res.json({ success: true, video });
    } catch (error) {
      console.error('Error fetching video:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch video' });
    }
  }

  /**
   * POST /api/videos/upload - Upload video
   */
  static async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }
      
      const file = req.file;
      const filePath = `/uploads/videos/${file.filename}`;
      const fullPath = path.join(process.cwd(), 'public', filePath);
      
      // Get video info
      let videoInfo = { duration: 0, resolution: 'unknown' };
      try {
        videoInfo = await getVideoInfo(fullPath);
      } catch (err) {
        console.error('Error getting video info:', err);
      }
      
      // Generate thumbnail
      let thumbnailPath = null;
      try {
        const thumbnailFilename = `thumb_${path.parse(file.filename).name}.jpg`;
        thumbnailPath = `/uploads/thumbnails/${thumbnailFilename}`;
        await generateThumbnail(fullPath, path.join(process.cwd(), 'public', thumbnailPath));
      } catch (err) {
        console.error('Error generating thumbnail:', err);
      }
      
      const video = await VideoService.create({
        user_id: req.session.userId,
        title: req.body.title || path.parse(file.originalname).name,
        filename: file.filename,
        file_path: filePath,
        file_size: file.size,
        duration: videoInfo.duration,
        resolution: videoInfo.resolution,
        thumbnail_path: thumbnailPath
      });
      
      res.json({ success: true, video });
    } catch (error) {
      console.error('Error uploading video:', error);
      res.status(500).json({ success: false, error: 'Failed to upload video' });
    }
  }

  /**
   * PUT /api/videos/:id - Update video
   */
  static async update(req, res) {
    try {
      const video = await VideoService.findById(req.params.id);
      
      if (!video || video.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Video not found' });
      }
      
      await VideoService.update(req.params.id, {
        title: req.body.title || video.title,
        thumbnail_path: video.thumbnail_path
      });
      
      res.json({ success: true, message: 'Video updated' });
    } catch (error) {
      console.error('Error updating video:', error);
      res.status(500).json({ success: false, error: 'Failed to update video' });
    }
  }

  /**
   * DELETE /api/videos/:id - Delete video
   */
  static async delete(req, res) {
    try {
      const video = await VideoService.findById(req.params.id);
      
      if (!video || video.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Video not found' });
      }
      
      await VideoService.delete(req.params.id);
      
      res.json({ success: true, message: 'Video deleted' });
    } catch (error) {
      console.error('Error deleting video:', error);
      res.status(500).json({ success: false, error: 'Failed to delete video' });
    }
  }

  /**
   * GET /api/users/:id/videos - Get videos for specific user (admin)
   */
  static async getByUser(req, res) {
    try {
      const videos = await VideoService.findByUserId(req.params.id);
      res.json({ success: true, videos });
    } catch (error) {
      console.error('Error fetching user videos:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch videos' });
    }
  }
}

module.exports = VideoController;
