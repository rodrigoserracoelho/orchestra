const User = require('../models/User');
const LoginCode = require('../models/LoginCode');
const { generateToken } = require('../services/tokenService');
const { sendLoginCode } = require('../services/emailService');
const { pool } = require('../config/database');
const env = require('../config/env');

async function upsertSession(userId) {
  await pool.execute(
    `INSERT INTO user_sessions (user_id, last_seen_at) VALUES (?, NOW())
     ON DUPLICATE KEY UPDATE last_seen_at = NOW()`,
    [userId]
  );
}

const authController = {
  // Step 1: Request a login code (email only)
  async requestCode(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'validation', message: 'Email is required' });
      }

      const user = await User.findByEmail(email);
      if (!user || !user.active) {
        // Don't reveal whether the email exists or is inactive — still say "code sent"
        return res.json({ success: true, message: 'If this email is registered, a code has been sent.' });
      }

      const { code } = await LoginCode.create(email);
      const emailResult = await sendLoginCode(email, code);

      // In development, include the code in the response so it shows on screen
      const response = { success: true, message: 'Login code sent to your email.' };
      if (env.nodeEnv === 'development' && !emailResult.sent) {
        response.devCode = code;
        response.message = 'Code generated (check below — email not configured).';
      }
      res.json(response);
    } catch (error) {
      console.error('Request code error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to send code' });
    }
  },

  // Step 2: Verify code and login
  async verifyCode(req, res) {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ success: false, error: 'validation', message: 'Email and code are required' });
      }

      const { valid, reason } = await LoginCode.verify(email, code);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'invalid_code', message: reason });
      }

      const user = await User.findByEmail(email);
      if (!user || !user.active) {
        return res.status(401).json({ success: false, error: 'invalid_code', message: 'Account is inactive' });
      }

      const token = generateToken(user);
      await upsertSession(user.id);

      res.json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, name: user.name, instrument: user.instrument, role: user.role },
          token,
        },
      });
    } catch (error) {
      console.error('Verify code error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Verification failed' });
    }
  },

  async me(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'User not found' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch profile' });
    }
  },
};

module.exports = authController;
