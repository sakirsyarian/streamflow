/**
 * System Controller
 * Handle system monitoring and settings
 */

const UserService = require('../user/user.service');
const systemMonitor = require('../../../services/systemMonitor');
const bcrypt = require('bcrypt');

class SystemController {
  /**
   * GET /settings - Settings page
   */
  static async settingsPage(req, res) {
    try {
      const user = await UserService.findById(req.session.userId);
      if (!user) {
        req.session.destroy();
        return res.redirect('/login');
      }

      res.render('settings', {
        title: 'Settings',
        active: 'settings',
        user
      });
    } catch (error) {
      console.error('Settings error:', error);
      res.redirect('/login');
    }
  }

  /**
   * POST /settings/profile - Update profile
   */
  static async updateProfile(req, res) {
    try {
      const { username } = req.body;
      const userId = req.session.userId;

      const user = await UserService.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Check if username is taken
      if (username !== user.username) {
        const existing = await UserService.findByUsername(username);
        if (existing) {
          return res.status(400).json({ success: false, error: 'Username already taken' });
        }
      }

      let avatarPath = user.avatar_path;
      if (req.file) {
        avatarPath = `/uploads/avatars/${req.file.filename}`;
      }

      await UserService.update(userId, {
        username,
        avatar_path: avatarPath
      });

      // Update session
      req.session.username = username;
      req.session.avatar_path = avatarPath;

      res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  }

  /**
   * POST /settings/password - Update password
   */
  static async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.session.userId;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, error: 'Passwords do not match' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
      }

      const user = await UserService.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const isValid = await UserService.verifyPassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect' });
      }

      await UserService.update(userId, {
        username: user.username,
        password: newPassword,
        avatar_path: user.avatar_path
      });

      res.json({ success: true, message: 'Password updated' });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ success: false, error: 'Failed to update password' });
    }
  }

  /**
   * GET /api/system-stats - Get system statistics
   */
  static async getStats(req, res) {
    try {
      const stats = await systemMonitor.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/system/health - Health check endpoint
   */
  static async healthCheck(req, res) {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }

  /**
   * GET /api/server-time - Get server time
   */
  static async getServerTime(req, res) {
    res.json({
      success: true,
      serverTime: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }
}

module.exports = SystemController;
