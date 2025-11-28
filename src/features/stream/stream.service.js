/**
 * Stream Service
 * Business logic for stream operations
 */

const { dbRun, dbGet, dbAll } = require('../../core/database');

class StreamService {
  /**
   * Find stream by ID
   */
  static async findById(id) {
    return dbGet('SELECT * FROM streams WHERE id = ?', [id]);
  }

  /**
   * Find all streams for a user
   */
  static async findByUserId(userId) {
    return dbAll(
      `SELECT s.*, v.title as video_title, v.thumbnail_path, v.file_path as video_path
       FROM streams s
       LEFT JOIN videos v ON s.video_id = v.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      [userId]
    );
  }

  /**
   * Find active streams for a user
   */
  static async findActiveByUserId(userId) {
    return dbAll(
      `SELECT s.*, v.title as video_title, v.thumbnail_path
       FROM streams s
       LEFT JOIN videos v ON s.video_id = v.id
       WHERE s.user_id = ? AND s.status = 'live'
       ORDER BY s.started_at DESC`,
      [userId]
    );
  }

  /**
   * Create new stream
   */
  static async create(streamData) {
    const {
      user_id, video_id, title, rtmp_url, stream_key, platform,
      loop_video = 1, scheduled_time, duration_minutes,
      bitrate = 2500, fps = 30, resolution = '1280x720', orientation = 'horizontal'
    } = streamData;

    const result = await dbRun(
      `INSERT INTO streams (
        user_id, video_id, title, rtmp_url, stream_key, platform,
        loop_video, scheduled_time, duration_minutes,
        bitrate, fps, resolution, orientation, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'idle')`,
      [
        user_id, video_id, title, rtmp_url, stream_key, platform,
        loop_video, scheduled_time, duration_minutes,
        bitrate, fps, resolution, orientation
      ]
    );

    return { id: result.lastID, ...streamData };
  }

  /**
   * Update stream
   */
  static async update(id, streamData) {
    const fields = [];
    const values = [];

    Object.entries(streamData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    values.push(id);
    return dbRun(
      `UPDATE streams SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  /**
   * Update stream status
   */
  static async updateStatus(id, status, pid = null) {
    const updates = { status };
    
    if (status === 'live') {
      updates.started_at = new Date().toISOString();
      if (pid) updates.pid = pid;
    }
    
    return this.update(id, updates);
  }

  /**
   * Delete stream
   */
  static async delete(id) {
    return dbRun('DELETE FROM streams WHERE id = ?', [id]);
  }

  /**
   * Get stream count by status
   */
  static async getCountByStatus(userId, status) {
    const result = await dbGet(
      'SELECT COUNT(*) as count FROM streams WHERE user_id = ? AND status = ?',
      [userId, status]
    );
    return result?.count || 0;
  }

  /**
   * Get all active streams (for scheduler)
   */
  static async getAllActive() {
    return dbAll(
      `SELECT s.*, v.file_path as video_path
       FROM streams s
       LEFT JOIN videos v ON s.video_id = v.id
       WHERE s.status = 'live'`
    );
  }

  /**
   * Get scheduled streams
   */
  static async getScheduled() {
    return dbAll(
      `SELECT s.*, v.file_path as video_path
       FROM streams s
       LEFT JOIN videos v ON s.video_id = v.id
       WHERE s.status = 'scheduled' AND s.scheduled_time <= datetime('now')
       ORDER BY s.scheduled_time ASC`
    );
  }

  /**
   * Detect platform from RTMP URL
   */
  static detectPlatform(rtmpUrl) {
    if (!rtmpUrl) return 'Custom';
    
    const platforms = {
      'youtube': 'YouTube',
      'facebook': 'Facebook',
      'twitch': 'Twitch',
      'tiktok': 'TikTok',
      'instagram': 'Instagram',
      'shopee': 'Shopee Live',
      'restream': 'Restream.io'
    };
    
    const url = rtmpUrl.toLowerCase();
    for (const [key, value] of Object.entries(platforms)) {
      if (url.includes(key)) return value;
    }
    
    return 'Custom';
  }
}

module.exports = StreamService;
