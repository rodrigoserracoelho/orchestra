const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Passwordless login (2 steps)
router.post('/request-code', authController.requestCode);
router.post('/verify-code', authController.verifyCode);

// Current user
router.get('/me', authenticate, authController.me);

module.exports = router;
