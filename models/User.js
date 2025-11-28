/**
 * User Model - Compatibility Layer
 * Wraps new UserService for backward compatibility
 */

const UserService = require('../src/features/user/user.service');

class User {
  static async findById(id) {
    return UserService.findById(id);
  }

  static async findByUsername(username) {
    return UserService.findByUsername(username);
  }

  static async findByEmail(email) {
    // Email not used in current implementation
    return null;
  }

  static async findAll() {
    return UserService.findAll();
  }

  static async create(userData) {
    return UserService.create(userData);
  }

  static async update(userId, userData) {
    return UserService.update(userId, userData);
  }

  static async updateStatus(userId, status) {
    return UserService.updateStatus(userId, status);
  }

  static async updateRole(userId, role) {
    return UserService.updateRole(userId, role);
  }

  static async updateProfile(userId, updateData) {
    return UserService.updateProfile(userId, updateData);
  }

  static async delete(userId) {
    return UserService.delete(userId);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return UserService.verifyPassword(plainPassword, hashedPassword);
  }
}

module.exports = User;
