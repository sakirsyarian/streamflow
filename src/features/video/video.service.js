/**
 * Video Service
 * Business logic for video operations
 */

const { dbRun, dbGet, dbAll } = require('../../core/database');
const fs = require('fs').promises;
const path = require('path');

class VideoService {
  /**
   * Find video by ID
   */
  static async findById(id) {
    return dbGet('SELECT * FROM videos WHERE id = ?', [id]);
  }

  /**
   * Find all videos for a user
   */
  static async findByUserId(userId) {
    return dbAll(
      'SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  /**
   * Find all videos
   */
  static async findAll(userId = null) {
    if (userId) {
      return this.findByUserId(userId);
    }
    return dbAll('SELECT * FROM videos ORDER BY created_at DESC');
  }

  /**
   * Create new video
   */
  static async create(videoData) {
    const { 
      user_id, title, filename, file_path, file_size, 
      duration, resolution, thumbnail_path 
    } = videoData;
    
    const result = await dbRun(
      `INSERT INTO videos (user_id, title, filename, file_path, file_size, duration, resolution, thumbnail_path) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, title, filename, file_path, file_size, duration, resolution, thumbnail_path]
    );
    
    return { id: result.lastID, ...videoData };
  }

  /**
   * Update video
   */
  static async update(id, videoData) {
    const { title, thumbnail_path } = videoData;
    
    return dbRun(
      'UPDATE videos SET title = ?, thumbnail_path = ? WHERE id = ?',
      [title, thumbnail_path, id]
    );
  }

  /**
   * Delete video
   */
  static async delete(id) {
    const video = await this.findById(id);
    
    if (video) {
      // Delete physical files
      try {
        if (video.file_path) {
          await fs.unlink(path.join(process.cwd(), 'public', video.file_path)).catch(() => {});
        }
        if (video.thumbnail_path) {
          await fs.unlink(path.join(process.cwd(), 'public', video.thumbnail_path)).catch(() => {});
        }
      } catch (error) {
        console.error('Error deleting video files:', error);
      }
    }
    
    return dbRun('DELETE FROM videos WHERE id = ?', [id]);
  }

  /**
   * Get videos by user with pagination
   */
  static async findByUserIdPaginated(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const videos = await dbAll(
      'SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    
    const countResult = await dbGet(
      'SELECT COUNT(*) as total FROM videos WHERE user_id = ?',
      [userId]
    );
    
    return {
      videos,
      total: countResult.total,
      page,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  /**
   * Search videos
   */
  static async search(userId, query) {
    return dbAll(
      `SELECT * FROM videos 
       WHERE user_id = ? AND title LIKE ? 
       ORDER BY created_at DESC`,
      [userId, `%${query}%`]
    );
  }

  /**
   * Get video statistics for user
   */
  static async getStats(userId) {
    const result = await dbGet(
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as totalSize 
       FROM videos WHERE user_id = ?`,
      [userId]
    );
    
    return {
      count: result?.count || 0,
      totalSize: result?.totalSize || 0
    };
  }
}

module.exports = VideoService;
