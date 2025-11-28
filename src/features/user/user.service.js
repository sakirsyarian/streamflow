/**
 * User Service
 * Business logic for user operations
 */

const bcrypt = require('bcrypt');
const { dbRun, dbGet, dbAll } = require('../../core/database');

const SALT_ROUNDS = 10;

class UserService {
  /**
   * Find user by ID
   */
  static async findById(id) {
    return dbGet('SELECT * FROM users WHERE id = ?', [id]);
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    return dbGet('SELECT * FROM users WHERE username = ?', [username]);
  }

  /**
   * Find all users
   */
  static async findAll() {
    return dbAll('SELECT * FROM users ORDER BY created_at DESC');
  }

  /**
   * Create new user
   */
  static async create(userData) {
    const { username, password, avatar_path, user_role = 'member', status = 'active' } = userData;
    
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const result = await dbRun(
      `INSERT INTO users (username, password, avatar_path, user_role, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, hashedPassword, avatar_path, user_role, status]
    );
    
    return { id: result.lastID, username, avatar_path, user_role, status };
  }

  /**
   * Update user
   */
  static async update(id, userData) {
    const { username, password, avatar_path } = userData;
    
    let sql = 'UPDATE users SET username = ?, avatar_path = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [username, avatar_path];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      sql += ', password = ?';
      params.push(hashedPassword);
    }
    
    sql += ' WHERE id = ?';
    params.push(id);
    
    return dbRun(sql, params);
  }

  /**
   * Update user profile (admin)
   */
  static async updateProfile(id, userData) {
    const { username, password, avatar_path, user_role, status } = userData;
    
    let sql = 'UPDATE users SET username = ?, avatar_path = ?, user_role = ?, status = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [username, avatar_path, user_role, status];
    
    if (password) {
      sql += ', password = ?';
      params.push(password); // Already hashed
    }
    
    sql += ' WHERE id = ?';
    params.push(id);
    
    return dbRun(sql, params);
  }

  /**
   * Update user status
   */
  static async updateStatus(id, status) {
    return dbRun(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
  }

  /**
   * Update user role
   */
  static async updateRole(id, role) {
    return dbRun(
      'UPDATE users SET user_role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [role, id]
    );
  }

  /**
   * Delete user
   */
  static async delete(id) {
    return dbRun('DELETE FROM users WHERE id = ?', [id]);
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId) {
    const videoStats = await dbGet(
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as totalSize 
       FROM videos WHERE user_id = ?`,
      [userId]
    );
    
    const streamStats = await dbGet(
      `SELECT COUNT(*) as count FROM streams WHERE user_id = ?`,
      [userId]
    );
    
    const activeStreamStats = await dbGet(
      `SELECT COUNT(*) as count FROM streams WHERE user_id = ? AND status = 'live'`,
      [userId]
    );
    
    return {
      videoCount: videoStats?.count || 0,
      totalVideoSize: videoStats?.totalSize || 0,
      streamCount: streamStats?.count || 0,
      activeStreamCount: activeStreamStats?.count || 0
    };
  }
}

module.exports = UserService;
