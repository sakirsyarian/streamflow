/**
 * Playlist Model - Compatibility Layer
 * Wraps new PlaylistService for backward compatibility
 */

const PlaylistService = require('../src/features/playlist/playlist.service');
const { dbAll } = require('../src/core/database');

class Playlist {
  static async findById(id) {
    return PlaylistService.findById(id);
  }

  static async findAll(userId) {
    return PlaylistService.findByUserId(userId);
  }

  static async findByIdWithVideos(id) {
    return PlaylistService.findByIdWithVideos(id);
  }

  static async create(playlistData) {
    return PlaylistService.create(playlistData);
  }

  static async update(id, playlistData) {
    return PlaylistService.update(id, playlistData);
  }

  static async delete(id) {
    return PlaylistService.delete(id);
  }

  static async addVideo(playlistId, videoId, position) {
    return PlaylistService.addVideo(playlistId, videoId);
  }

  static async removeVideo(playlistId, videoId) {
    return PlaylistService.removeVideo(playlistId, videoId);
  }

  static async updateVideoPositions(playlistId, videoPositions) {
    const videoIds = videoPositions.map(v => v.videoId);
    return PlaylistService.reorderVideos(playlistId, videoIds);
  }

  static async getNextPosition(playlistId) {
    return PlaylistService.getVideoCount(playlistId) + 1;
  }
}

module.exports = Playlist;
