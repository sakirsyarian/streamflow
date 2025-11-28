/**
 * Auth Routes
 * Define routes for authentication
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('./auth.controller');
const { loginLimiter, loginDelayMiddleware } = require('../../core/middleware/rateLimiter');
const { upload } = require('../../../middleware/uploadMiddleware');

// Validation rules for setup
const setupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match')
];

// Login routes
router.get('/login', AuthController.loginPage);
router.post('/login', loginDelayMiddleware, loginLimiter, AuthController.login);

// Logout
router.get('/logout', AuthController.logout);

// Signup routes
router.get('/signup', AuthController.signupPage);
router.post('/signup', upload.single('avatar'), AuthController.signup);

// Setup routes
router.get('/setup-account', AuthController.setupPage);
router.post('/setup-account', upload.single('avatar'), setupValidation, AuthController.setup);

module.exports = router;
