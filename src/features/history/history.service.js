/**
 * History Service
 * Business logic for stream history
 */

const { dbRun, dbGet, dbAll } = require('../../core/database');

class HistoryService {
  /**
   * Find history by ID
   */
  static async findById(id) {
    return dbGet('SELECT * FROM stream_history WHERE id = ?', [id]);
  }

  /**
   * Find all history for a user
   */
  static async findByUserId(userId) {
    return dbAll(
      `SELECT h.*, v.thumbnail_path 
       FROM stream_history h 
       LEFT JOIN videos v ON h.video_id = v.id 
       WHERE h.user_id = ? 
       ORDER BY h.start_time DESC`,
      [userId]
    );
  }

  /**
   * Create history entry
   */
  static async create(historyData) {
    const {
      user_id, stream_id, video_id, title, platform,
      status, start_time, end_time, duration_seconds, error_message
    } = historyData;

    const result = await dbRun(
      `INSERT INTO stream_history (
        user_id, stream_id, video_id, title, platform,
        status, start_time, end_time, duration_seconds, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, stream_id, video_id, title, platform,
        status, start_time, end_time, duration_seconds, error_message
      ]
    );

    return { id: result.lastID, ...historyData };
  }

  /**
   * Update history entry
   */
  static async update(id, historyData) {
    const { status, end_time, duration_seconds, error_message } = historyData;

    return dbRun(
      `UPDATE stream_history 
       SET status = ?, end_time = ?, duration_seconds = ?, error_message = ?
       WHERE id = ?`,
      [status, end_time, duration_seconds, error_message, id]
    );
  }

  /**
   * Delete history entry
   */
  static async delete(id) {
    return dbRun('DELETE FROM stream_history WHERE id = ?', [id]);
  }

  /**
   * Delete all history for user
   */
  static async deleteAllByUserId(userId) {
    return dbRun('DELETE FROM stream_history WHERE user_id = ?', [userId]);
  }

  /**
   * Get history statistics for user
   */
  static async getStats(userId) {
    const result = await dbGet(
      `SELECT 
        COUNT(*) as totalStreams,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedStreams,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errorStreams,
        COALESCE(SUM(duration_seconds), 0) as totalDuration
       FROM stream_history 
       WHERE user_id = ?`,
      [userId]
    );

    return {
      totalStreams: result?.totalStreams || 0,
      completedStreams: result?.completedStreams || 0,
      errorStreams: result?.errorStreams || 0,
      totalDuration: result?.totalDuration || 0
    };
  }
}

module.exports = HistoryService;
