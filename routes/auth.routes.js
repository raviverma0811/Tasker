const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, getAllUsers } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authorize }    = require('../middleware/roles');

const router = express.Router();

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], login);

router.get('/me',    authenticate, getMe);
router.get('/users', authenticate, getAllUsers); // For task assignment dropdown

module.exports = router;
