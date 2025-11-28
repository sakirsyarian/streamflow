/**
 * Auth Service
 * Business logic for authentication
 */

const UserService = require('../user/user.service');
const { checkIfUsersExist } = require('../../core/database');

class AuthService {
  /**
   * Authenticate user with username and password
   */
  static async authenticate(username, password) {
    const user = await UserService.findByUsername(username);
    
    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }
    
    const passwordMatch = await UserService.verifyPassword(password, user.password);
    
    if (!passwordMatch) {
      return { success: false, error: 'Invalid username or password' };
    }
    
    if (user.status !== 'active') {
      return { 
        success: false, 
        error: 'Your account is not active. Please contact administrator for activation.' 
      };
    }
    
    return { success: true, user };
  }

  /**
   * Register new user
   */
  static async register(userData) {
    const { username, password, confirmPassword, avatar_path } = userData;
    
    if (!username || !password) {
      return { success: false, error: 'Username and password are required' };
    }
    
    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }
    
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }
    
    const existingUser = await UserService.findByUsername(username);
    if (existingUser) {
      return { success: false, error: 'Username already exists' };
    }
    
    const newUser = await UserService.create({
      username,
      password,
      avatar_path,
      user_role: 'member',
      status: 'inactive' // Requires admin approval
    });
    
    return { success: true, user: newUser };
  }

  /**
   * Setup initial admin account
   */
  static async setupAccount(userData) {
    const { username, password, avatar_path } = userData;
    
    const usersExist = await checkIfUsersExist();
    
    if (!usersExist) {
      // First user becomes admin
      const user = await UserService.create({
        username,
        password,
        avatar_path,
        user_role: 'admin',
        status: 'active'
      });
      
      return { success: true, user, isNewAdmin: true };
    }
    
    return { success: false, error: 'Setup already completed' };
  }

  /**
   * Check if initial setup is needed
   */
  static async needsSetup() {
    return !(await checkIfUsersExist());
  }
}

module.exports = AuthService;
