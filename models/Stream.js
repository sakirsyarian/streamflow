/**
 * Stream Model - Compatibility Layer
 * Wraps new StreamService for backward compatibility
 */

const StreamService = require('../src/features/stream/stream.service');
const { dbGet, dbAll, dbRun } = require('../src/core/database');

class Stream {
  static async findById(id) {
    return StreamService.findById(id);
  }

  static async findAll(userId = null, filter = null) {
    if (userId) {
      const streams = await StreamService.findByUserId(userId);
      if (filter === 'live') {
        return streams.filter(s => s.status === 'live');
      }
      return streams;
    }
    
    // Get all streams with video info
    return dbAll(`
      SELECT s.*, 
             v.title AS video_title, 
             v.filepath AS video_filepath,
             v.thumbnail_path AS video_thumbnail, 
             v.duration AS video_duration,
             v.resolution AS video_resolution,  
             v.bitrate AS video_bitrate,        
             v.fps AS video_fps,
             p.name AS playlist_name,
             CASE 
               WHEN p.id IS NOT NULL THEN 'playlist'
               WHEN v.id IS NOT NULL THEN 'video'
               ELSE NULL
             END AS video_type
      FROM streams s
      LEFT JOIN videos v ON s.video_id = v.id
      LEFT JOIN playlists p ON s.video_id = p.id
      ${filter === 'live' ? "WHERE s.status = 'live'" : ''}
      ORDER BY s.created_at DESC
    `);
  }

  static async create(streamData) {
    return StreamService.create(streamData);
  }

  static async update(id, streamData) {
    return StreamService.update(id, streamData);
  }

  static async delete(id, userId) {
    return dbRun('DELETE FROM streams WHERE id = ? AND user_id = ?', [id, userId]);
  }

  static async updateStatus(id, status, userId, options = {}) {
    const status_updated_at = new Date().toISOString();
    const { startTimeOverride = null, endTimeOverride = null } = options;
    
    let start_time = null;
    let end_time = null;
    
    if (status === 'live') {
      start_time = startTimeOverride || new Date().toISOString();
    } else if (status === 'offline') {
      end_time = endTimeOverride || new Date().toISOString();
    }
    
    return dbRun(
      `UPDATE streams SET 
        status = ?, 
        status_updated_at = ?, 
        start_time = CASE WHEN ? IS NOT NULL THEN ? ELSE start_time END, 
        end_time = CASE WHEN ? IS NOT NULL THEN ? ELSE end_time END,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, status_updated_at, start_time, start_time, end_time, end_time, id]
    );
  }

  static async getStreamWithVideo(id) {
    return dbGet(`
      SELECT s.*, 
             v.title AS video_title, 
             v.filepath AS video_filepath, 
             v.thumbnail_path AS video_thumbnail, 
             v.duration AS video_duration,
             p.name AS playlist_name,
             CASE 
               WHEN p.id IS NOT NULL THEN 'playlist'
               WHEN v.id IS NOT NULL THEN 'video'
               ELSE NULL
             END AS video_type
      FROM streams s
      LEFT JOIN videos v ON s.video_id = v.id
      LEFT JOIN playlists p ON s.video_id = p.id
      WHERE s.id = ?
    `, [id]);
  }

  static async findScheduledInRange(startTime, endTime) {
    const startTimeStr = startTime.toISOString();
    const endTimeStr = endTime.toISOString();
    
    return dbAll(`
      SELECT s.*, 
             v.title AS video_title, 
             v.filepath AS video_filepath,
             v.thumbnail_path AS video_thumbnail, 
             v.duration AS video_duration,
             v.resolution AS video_resolution,
             v.bitrate AS video_bitrate,
             v.fps AS video_fps  
      FROM streams s
      LEFT JOIN videos v ON s.video_id = v.id
      WHERE s.status = 'scheduled'
      AND s.schedule_time IS NOT NULL
      AND s.schedule_time >= ?
      AND s.schedule_time <= ?
    `, [startTimeStr, endTimeStr]);
  }
}

module.exports = Stream;
