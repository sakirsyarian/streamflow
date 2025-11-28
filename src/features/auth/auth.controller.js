/**
 * Auth Controller
 * Handle HTTP requests for authentication
 */

const AuthService = require('./auth.service');
const UserService = require('../user/user.service');
const { validationResult } = require('express-validator');

class AuthController {
  /**
   * GET /login - Login page
   */
  static async loginPage(req, res) {
    if (req.session.userId) {
      return res.redirect('/dashboard');
    }
    
    try {
      const needsSetup = await AuthService.needsSetup();
      if (needsSetup) {
        return res.redirect('/setup-account');
      }
      
      res.render('login', {
        title: 'Login',
        error: null
      });
    } catch (error) {
      console.error('Error checking for users:', error);
      res.render('login', {
        title: 'Login',
        error: 'System error. Please try again.'
      });
    }
  }

  /**
   * POST /login - Process login
   */
  static async login(req, res) {
    const { username, password } = req.body;
    
    try {
      const result = await AuthService.authenticate(username, password);
      
      if (!result.success) {
        return res.render('login', {
          title: 'Login',
          error: result.error
        });
      }
      
      const { user } = result;
      
      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.avatar_path = user.avatar_path;
      req.session.user_role = user.user_role;
      
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      res.render('login', {
        title: 'Login',
        error: 'An error occurred during login. Please try again.'
      });
    }
  }

  /**
   * GET /logout - Logout user
   */
  static logout(req, res) {
    req.session.destroy();
    res.redirect('/login');
  }

  /**
   * GET /signup - Signup page
   */
  static async signupPage(req, res) {
    if (req.session.userId) {
      return res.redirect('/dashboard');
    }
    
    try {
      const needsSetup = await AuthService.needsSetup();
      if (needsSetup) {
        return res.redirect('/setup-account');
      }
      
      res.render('signup', {
        title: 'Sign Up',
        error: null,
        success: null
      });
    } catch (error) {
      console.error('Error loading signup page:', error);
      res.render('signup', {
        title: 'Sign Up',
        error: 'System error. Please try again.',
        success: null
      });
    }
  }

  /**
   * POST /signup - Process signup
   */
  static async signup(req, res) {
    const { username, password, confirmPassword } = req.body;
    
    try {
      let avatarPath = null;
      if (req.file) {
        avatarPath = `/uploads/avatars/${req.file.filename}`;
      }
      
      const result = await AuthService.register({
        username,
        password,
        confirmPassword,
        avatar_path: avatarPath
      });
      
      if (!result.success) {
        return res.render('signup', {
          title: 'Sign Up',
          error: result.error,
          success: null
        });
      }
      
      res.render('signup', {
        title: 'Sign Up',
        error: null,
        success: 'Account created successfully! Please wait for admin approval to activate your account.'
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.render('signup', {
        title: 'Sign Up',
        error: 'An error occurred during registration. Please try again.',
        success: null
      });
    }
  }

  /**
   * GET /setup-account - Initial setup page
   */
  static async setupPage(req, res) {
    try {
      const needsSetup = await AuthService.needsSetup();
      
      if (!needsSetup && !req.session.userId) {
        return res.redirect('/login');
      }
      
      if (req.session.userId) {
        const user = await UserService.findById(req.session.userId);
        if (user && user.username) {
          return res.redirect('/dashboard');
        }
      }
      
      res.render('setup-account', {
        title: 'Complete Your Account',
        user: req.session.userId ? await UserService.findById(req.session.userId) : {},
        error: null
      });
    } catch (error) {
      console.error('Setup account error:', error);
      res.redirect('/login');
    }
  }

  /**
   * POST /setup-account - Process initial setup
   */
  static async setup(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render('setup-account', {
          title: 'Complete Your Account',
          user: { username: req.body.username || '' },
          error: errors.array()[0].msg
        });
      }
      
      const existingUsername = await UserService.findByUsername(req.body.username);
      if (existingUsername) {
        return res.render('setup-account', {
          title: 'Complete Your Account',
          user: { email: req.body.email || '' },
          error: 'Username is already taken'
        });
      }
      
      const avatarPath = req.file ? `/uploads/avatars/${req.file.filename}` : null;
      
      const result = await AuthService.setupAccount({
        username: req.body.username,
        password: req.body.password,
        avatar_path: avatarPath
      });
      
      if (result.success) {
        req.session.userId = result.user.id;
        req.session.username = req.body.username;
        req.session.user_role = result.user.user_role;
        if (avatarPath) {
          req.session.avatar_path = avatarPath;
        }
        return res.redirect('/dashboard');
      }
      
      // If setup already done, update existing user
      await UserService.update(req.session.userId, {
        username: req.body.username,
        password: req.body.password,
        avatar_path: avatarPath
      });
      
      req.session.username = req.body.username;
      if (avatarPath) {
        req.session.avatar_path = avatarPath;
      }
      
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Account setup error:', error);
      res.render('setup-account', {
        title: 'Complete Your Account',
        user: { email: req.body.email || '' },
        error: 'An error occurred. Please try again.'
      });
    }
  }
}

module.exports = AuthController;
