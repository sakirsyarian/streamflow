/**
 * Stream Controller
 * Handle HTTP requests for stream operations
 */

const StreamService = require('./stream.service');
const VideoService = require('../video/video.service');
const UserService = require('../user/user.service');
const streamingService = require('../../../services/streamingService');

class StreamController {
  /**
   * GET /dashboard - Dashboard page
   */
  static async dashboard(req, res) {
    try {
      const user = await UserService.findById(req.session.userId);
      res.render('dashboard', {
        title: 'Dashboard',
        active: 'dashboard',
        user
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.redirect('/login');
    }
  }

  /**
   * GET /api/streams - Get all streams for user
   */
  static async getAll(req, res) {
    try {
      const streams = await StreamService.findByUserId(req.session.userId);
      res.json({ success: true, streams });
    } catch (error) {
      console.error('Error fetching streams:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch streams' });
    }
  }

  /**
   * GET /api/streams/:id - Get single stream
   */
  static async getOne(req, res) {
    try {
      const stream = await StreamService.findById(req.params.id);
      
      if (!stream || stream.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Stream not found' });
      }
      
      res.json({ success: true, stream });
    } catch (error) {
      console.error('Error fetching stream:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch stream' });
    }
  }

  /**
   * POST /api/streams - Create new stream
   */
  static async create(req, res) {
    try {
      const {
        videoId, streamTitle, rtmpUrl, streamKey,
        loopVideo, scheduledTime, durationMinutes,
        bitrate, fps, resolution, orientation
      } = req.body;

      if (!videoId || !rtmpUrl || !streamKey) {
        return res.status(400).json({
          success: false,
          error: 'Video, RTMP URL, and Stream Key are required'
        });
      }

      // Verify video belongs to user
      const video = await VideoService.findById(videoId);
      if (!video || video.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Video not found' });
      }

      const platform = StreamService.detectPlatform(rtmpUrl);

      const stream = await StreamService.create({
        user_id: req.session.userId,
        video_id: videoId,
        title: streamTitle || video.title,
        rtmp_url: rtmpUrl,
        stream_key: streamKey,
        platform,
        loop_video: loopVideo ? 1 : 0,
        scheduled_time: scheduledTime || null,
        duration_minutes: durationMinutes || null,
        bitrate: bitrate || 2500,
        fps: fps || 30,
        resolution: resolution || '1280x720',
        orientation: orientation || 'horizontal'
      });

      res.json({ success: true, stream });
    } catch (error) {
      console.error('Error creating stream:', error);
      res.status(500).json({ success: false, error: 'Failed to create stream' });
    }
  }

  /**
   * PUT /api/streams/:id - Update stream
   */
  static async update(req, res) {
    try {
      const stream = await StreamService.findById(req.params.id);
      
      if (!stream || stream.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Stream not found' });
      }

      if (stream.status === 'live') {
        return res.status(400).json({
          success: false,
          error: 'Cannot update a live stream'
        });
      }

      const platform = StreamService.detectPlatform(req.body.rtmpUrl || stream.rtmp_url);

      await StreamService.update(req.params.id, {
        video_id: req.body.videoId,
        title: req.body.streamTitle,
        rtmp_url: req.body.rtmpUrl,
        stream_key: req.body.streamKey,
        platform,
        loop_video: req.body.loopVideo ? 1 : 0,
        scheduled_time: req.body.scheduledTime,
        duration_minutes: req.body.durationMinutes,
        bitrate: req.body.bitrate,
        fps: req.body.fps,
        resolution: req.body.resolution,
        orientation: req.body.orientation
      });

      res.json({ success: true, message: 'Stream updated' });
    } catch (error) {
      console.error('Error updating stream:', error);
      res.status(500).json({ success: false, error: 'Failed to update stream' });
    }
  }

  /**
   * DELETE /api/streams/:id - Delete stream
   */
  static async delete(req, res) {
    try {
      const stream = await StreamService.findById(req.params.id);
      
      if (!stream || stream.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Stream not found' });
      }

      // Stop if live
      if (stream.status === 'live') {
        await streamingService.stopStream(stream.id);
      }

      await StreamService.delete(req.params.id);
      
      res.json({ success: true, message: 'Stream deleted' });
    } catch (error) {
      console.error('Error deleting stream:', error);
      res.status(500).json({ success: false, error: 'Failed to delete stream' });
    }
  }

  /**
   * POST /api/streams/:id/start - Start stream
   */
  static async start(req, res) {
    try {
      const stream = await StreamService.findById(req.params.id);
      
      if (!stream || stream.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Stream not found' });
      }

      if (stream.status === 'live') {
        return res.status(400).json({ success: false, error: 'Stream is already live' });
      }

      const result = await streamingService.startStream(stream.id);
      
      if (result.success) {
        res.json({ success: true, message: 'Stream started' });
      } else {
        res.status(500).json({ success: false, error: result.error || 'Failed to start stream' });
      }
    } catch (error) {
      console.error('Error starting stream:', error);
      res.status(500).json({ success: false, error: 'Failed to start stream' });
    }
  }

  /**
   * POST /api/streams/:id/stop - Stop stream
   */
  static async stop(req, res) {
    try {
      const stream = await StreamService.findById(req.params.id);
      
      if (!stream || stream.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Stream not found' });
      }

      if (stream.status !== 'live') {
        return res.status(400).json({ success: false, error: 'Stream is not live' });
      }

      const result = await streamingService.stopStream(stream.id);
      
      if (result.success) {
        res.json({ success: true, message: 'Stream stopped' });
      } else {
        res.status(500).json({ success: false, error: result.error || 'Failed to stop stream' });
      }
    } catch (error) {
      console.error('Error stopping stream:', error);
      res.status(500).json({ success: false, error: 'Failed to stop stream' });
    }
  }

  /**
   * GET /api/users/:id/streams - Get streams for specific user (admin)
   */
  static async getByUser(req, res) {
    try {
      const streams = await StreamService.findByUserId(req.params.id);
      res.json({ success: true, streams });
    } catch (error) {
      console.error('Error fetching user streams:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch streams' });
    }
  }
}

module.exports = StreamController;
