/**
 * Playlist Service
 * Business logic for playlist operations
 */

const { dbRun, dbGet, dbAll } = require('../../core/database');

class PlaylistService {
  /**
   * Find playlist by ID
   */
  static async findById(id) {
    return dbGet('SELECT * FROM playlists WHERE id = ?', [id]);
  }

  /**
   * Find all playlists for a user
   */
  static async findByUserId(userId) {
    return dbAll(
      'SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  /**
   * Find playlist with videos
   */
  static async findByIdWithVideos(id) {
    const playlist = await this.findById(id);
    if (!playlist) return null;

    const videos = await dbAll(
      `SELECT v.*, pv.position 
       FROM playlist_videos pv
       JOIN videos v ON pv.video_id = v.id
       WHERE pv.playlist_id = ?
       ORDER BY pv.position ASC`,
      [id]
    );

    return { ...playlist, videos };
  }

  /**
   * Create new playlist
   */
  static async create(playlistData) {
    const { user_id, name, description } = playlistData;

    const result = await dbRun(
      'INSERT INTO playlists (user_id, name, description) VALUES (?, ?, ?)',
      [user_id, name, description]
    );

    return { id: result.lastID, ...playlistData };
  }

  /**
   * Update playlist
   */
  static async update(id, playlistData) {
    const { name, description } = playlistData;

    return dbRun(
      'UPDATE playlists SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );
  }

  /**
   * Delete playlist
   */
  static async delete(id) {
    // Delete playlist videos first
    await dbRun('DELETE FROM playlist_videos WHERE playlist_id = ?', [id]);
    return dbRun('DELETE FROM playlists WHERE id = ?', [id]);
  }

  /**
   * Add video to playlist
   */
  static async addVideo(playlistId, videoId) {
    // Get max position
    const result = await dbGet(
      'SELECT MAX(position) as maxPos FROM playlist_videos WHERE playlist_id = ?',
      [playlistId]
    );
    const position = (result?.maxPos || 0) + 1;

    return dbRun(
      'INSERT INTO playlist_videos (playlist_id, video_id, position) VALUES (?, ?, ?)',
      [playlistId, videoId, position]
    );
  }

  /**
   * Remove video from playlist
   */
  static async removeVideo(playlistId, videoId) {
    return dbRun(
      'DELETE FROM playlist_videos WHERE playlist_id = ? AND video_id = ?',
      [playlistId, videoId]
    );
  }

  /**
   * Reorder videos in playlist
   */
  static async reorderVideos(playlistId, videoIds) {
    for (let i = 0; i < videoIds.length; i++) {
      await dbRun(
        'UPDATE playlist_videos SET position = ? WHERE playlist_id = ? AND video_id = ?',
        [i + 1, playlistId, videoIds[i]]
      );
    }
  }

  /**
   * Get video count in playlist
   */
  static async getVideoCount(playlistId) {
    const result = await dbGet(
      'SELECT COUNT(*) as count FROM playlist_videos WHERE playlist_id = ?',
      [playlistId]
    );
    return result?.count || 0;
  }
}

module.exports = PlaylistService;
