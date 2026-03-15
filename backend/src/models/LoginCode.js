const { pool } = require('../config/database');
const crypto = require('crypto');

const CODE_EXPIRY_MINUTES = 5;

const LoginCode = {
  generateCode() {
    // Generate a 6-digit numeric code
    return crypto.randomInt(100000, 999999).toString();
  },

  async create(email) {
    // Invalidate any existing unused codes for this email
    await pool.execute(
      'UPDATE login_codes SET used_at = NOW() WHERE email = ? AND used_at IS NULL',
      [email]
    );

    const code = this.generateCode();
    const [result] = await pool.execute(
      `INSERT INTO login_codes (email, code, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [email, code, CODE_EXPIRY_MINUTES]
    );

    return { id: result.insertId, code, email, expires_minutes: CODE_EXPIRY_MINUTES };
  },

  async verify(email, code) {
    const [rows] = await pool.execute(
      `SELECT * FROM login_codes
       WHERE email = ? AND code = ? AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (rows.length === 0) {
      return { valid: false, reason: 'Invalid or expired code' };
    }

    // Mark as used
    await pool.execute('UPDATE login_codes SET used_at = NOW() WHERE id = ?', [rows[0].id]);

    return { valid: true };
  },

  // Clean up expired codes (optional maintenance)
  async cleanup() {
    await pool.execute(
      'DELETE FROM login_codes WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)'
    );
  },
};

module.exports = LoginCode;
