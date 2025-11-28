/**
 * Playlist Controller
 * Handle HTTP requests for playlist operations
 */

const PlaylistService = require('./playlist.service');
const UserService = require('../user/user.service');
const VideoService = require('../video/video.service');

class PlaylistController {
  /**
   * GET /playlist - Playlist page
   */
  static async index(req, res) {
    try {
      const playlists = await PlaylistService.findByUserId(req.session.userId);
      const user = await UserService.findById(req.session.userId);
      const videos = await VideoService.findByUserId(req.session.userId);

      // Add video count to each playlist
      const playlistsWithCount = await Promise.all(
        playlists.map(async (playlist) => ({
          ...playlist,
          videoCount: await PlaylistService.getVideoCount(playlist.id)
        }))
      );

      res.render('playlist', {
        title: 'Playlists',
        active: 'playlist',
        user,
        playlists: playlistsWithCount,
        videos
      });
    } catch (error) {
      console.error('Playlist page error:', error);
      res.redirect('/dashboard');
    }
  }

  /**
   * GET /api/playlists - Get all playlists
   */
  static async getAll(req, res) {
    try {
      const playlists = await PlaylistService.findByUserId(req.session.userId);
      res.json({ success: true, playlists });
    } catch (error) {
      console.error('Error fetching playlists:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch playlists' });
    }
  }

  /**
   * GET /api/playlists/:id - Get single playlist with videos
   */
  static async getOne(req, res) {
    try {
      const playlist = await PlaylistService.findByIdWithVideos(req.params.id);

      if (!playlist || playlist.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Playlist not found' });
      }

      res.json({ success: true, playlist });
    } catch (error) {
      console.error('Error fetching playlist:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch playlist' });
    }
  }

  /**
   * POST /api/playlists - Create playlist
   */
  static async create(req, res) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }

      const playlist = await PlaylistService.create({
        user_id: req.session.userId,
        name,
        description
      });

      res.json({ success: true, playlist });
    } catch (error) {
      console.error('Error creating playlist:', error);
      res.status(500).json({ success: false, error: 'Failed to create playlist' });
    }
  }

  /**
   * PUT /api/playlists/:id - Update playlist
   */
  static async update(req, res) {
    try {
      const playlist = await PlaylistService.findById(req.params.id);

      if (!playlist || playlist.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Playlist not found' });
      }

      await PlaylistService.update(req.params.id, {
        name: req.body.name || playlist.name,
        description: req.body.description
      });

      res.json({ success: true, message: 'Playlist updated' });
    } catch (error) {
      console.error('Error updating playlist:', error);
      res.status(500).json({ success: false, error: 'Failed to update playlist' });
    }
  }

  /**
   * DELETE /api/playlists/:id - Delete playlist
   */
  static async delete(req, res) {
    try {
      const playlist = await PlaylistService.findById(req.params.id);

      if (!playlist || playlist.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Playlist not found' });
      }

      await PlaylistService.delete(req.params.id);

      res.json({ success: true, message: 'Playlist deleted' });
    } catch (error) {
      console.error('Error deleting playlist:', error);
      res.status(500).json({ success: false, error: 'Failed to delete playlist' });
    }
  }

  /**
   * POST /api/playlists/:id/videos - Add video to playlist
   */
  static async addVideo(req, res) {
    try {
      const playlist = await PlaylistService.findById(req.params.id);

      if (!playlist || playlist.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Playlist not found' });
      }

      await PlaylistService.addVideo(req.params.id, req.body.videoId);

      res.json({ success: true, message: 'Video added to playlist' });
    } catch (error) {
      console.error('Error adding video to playlist:', error);
      res.status(500).json({ success: false, error: 'Failed to add video' });
    }
  }

  /**
   * DELETE /api/playlists/:id/videos/:videoId - Remove video from playlist
   */
  static async removeVideo(req, res) {
    try {
      const playlist = await PlaylistService.findById(req.params.id);

      if (!playlist || playlist.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Playlist not found' });
      }

      await PlaylistService.removeVideo(req.params.id, req.params.videoId);

      res.json({ success: true, message: 'Video removed from playlist' });
    } catch (error) {
      console.error('Error removing video from playlist:', error);
      res.status(500).json({ success: false, error: 'Failed to remove video' });
    }
  }

  /**
   * PUT /api/playlists/:id/reorder - Reorder videos in playlist
   */
  static async reorder(req, res) {
    try {
      const playlist = await PlaylistService.findById(req.params.id);

      if (!playlist || playlist.user_id !== req.session.userId) {
        return res.status(404).json({ success: false, error: 'Playlist not found' });
      }

      await PlaylistService.reorderVideos(req.params.id, req.body.videoIds);

      res.json({ success: true, message: 'Playlist reordered' });
    } catch (error) {
      console.error('Error reordering playlist:', error);
      res.status(500).json({ success: false, error: 'Failed to reorder playlist' });
    }
  }
}

module.exports = PlaylistController;
