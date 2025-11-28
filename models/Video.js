/**
 * Video Model - Compatibility Layer
 * Wraps new VideoService for backward compatibility
 */

const VideoService = require('../src/features/video/video.service');

class Video {
  static async findById(id) {
    return VideoService.findById(id);
  }

  static async findAll(userId = null) {
    if (userId) {
      return VideoService.findByUserId(userId);
    }
    return VideoService.findAll();
  }

  static async create(data) {
    return VideoService.create(data);
  }

  static async update(id, videoData) {
    return VideoService.update(id, videoData);
  }

  static async delete(id) {
    return VideoService.delete(id);
  }
}

module.exports = Video;
