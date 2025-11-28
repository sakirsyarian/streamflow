/**
 * User Controller
 * Handle HTTP requests for user operations
 */

const UserService = require('./user.service');
const viewHelpers = require('../../core/helpers/viewHelpers');
const bcrypt = require('bcrypt');

class UserController {
  /**
   * GET /users - User management page
   */
  static async index(req, res) {
    try {
      const users = await UserService.findAll();
      
      // Add stats to each user
      const usersWithStats = await Promise.all(users.map(async (user) => {
        const stats = await UserService.getUserStats(user.id);
        return {
          ...user,
          videoCount: stats.videoCount,
          totalVideoSize: stats.totalVideoSize > 0 
            ? viewHelpers.formatFileSize(stats.totalVideoSize) 
            : null,
          streamCount: stats.streamCount,
          activeStreamCount: stats.activeStreamCount
        };
      }));
      
      res.render('users', {
        title: 'User Management',
        active: 'users',
        users: usersWithStats,
        user: req.user
      });
    } catch (error) {
      console.error('Users page error:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load users page',
        user: req.user
      });
    }
  }

  /**
   * POST /api/users/create - Create new user
   */
  static async create(req, res) {
    try {
      const { username, role, status, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      const existingUser = await UserService.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      let avatarPath = '/uploads/avatars/default-avatar.png';
      if (req.file) {
        avatarPath = `/uploads/avatars/${req.file.filename}`;
      }

      const result = await UserService.create({
        username,
        password,
        user_role: role || 'member',
        status: status || 'active',
        avatar_path: avatarPath
      });
      
      res.json({
        success: true,
        message: 'User created successfully',
        userId: result.id
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
  }

  /**
   * POST /api/users/update - Update user
   */
  static async update(req, res) {
    try {
      const { userId, username, role, status, password } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const user = await UserService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      let avatarPath = user.avatar_path;
      if (req.file) {
        avatarPath = `/uploads/avatars/${req.file.filename}`;
      }

      const updateData = {
        username: username || user.username,
        user_role: role || user.user_role,
        status: status || user.status,
        avatar_path: avatarPath
      };

      if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await UserService.updateProfile(userId, updateData);
      
      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  }

  /**
   * POST /api/users/delete - Delete user
   */
  static async delete(req, res) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      if (userId == req.session.userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const user = await UserService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await UserService.delete(userId);
      
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }

  /**
   * POST /api/users/status - Update user status
   */
  static async updateStatus(req, res) {
    try {
      const { userId, status } = req.body;
      
      if (!userId || !status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID or status'
        });
      }

      if (userId == req.session.userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change your own status'
        });
      }

      const user = await UserService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await UserService.updateStatus(userId, status);
      
      res.json({
        success: true,
        message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
    }
  }

  /**
   * POST /api/users/role - Update user role
   */
  static async updateRole(req, res) {
    try {
      const { userId, role } = req.body;
      
      if (!userId || !role || !['admin', 'member'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID or role'
        });
      }

      if (userId == req.session.userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change your own role'
        });
      }

      const user = await UserService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await UserService.updateRole(userId, role);
      
      res.json({
        success: true,
        message: `User role updated to ${role} successfully`
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user role'
      });
    }
  }
}

module.exports = UserController;
