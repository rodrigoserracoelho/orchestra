const { pool } = require('../config/database');

const MolliePayment = {
  async create({ user_id, season_id, mollie_payment_id, amount, checkout_url }) {
    const [result] = await pool.execute(
      `INSERT INTO mollie_payments (user_id, season_id, mollie_payment_id, amount, checkout_url)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, season_id, mollie_payment_id, amount, checkout_url]
    );
    return result.insertId;
  },

  async findByMollieId(mollie_payment_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM mollie_payments WHERE mollie_payment_id = ?',
      [mollie_payment_id]
    );
    return rows[0] || null;
  },

  async findLatestForUserSeason(user_id, season_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM mollie_payments
       WHERE user_id = ? AND season_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [user_id, season_id]
    );
    return rows[0] || null;
  },

  async updateStatus(mollie_payment_id, status, payload) {
    const paidAt = status === 'paid' ? new Date() : null;
    const failedAt = ['failed', 'canceled', 'expired'].includes(status) ? new Date() : null;
    await pool.execute(
      `UPDATE mollie_payments
       SET status = ?, webhook_payload = ?, paid_at = COALESCE(paid_at, ?), failed_at = COALESCE(failed_at, ?)
       WHERE mollie_payment_id = ?`,
      [status, JSON.stringify(payload), paidAt, failedAt, mollie_payment_id]
    );
  },
};

module.exports = MolliePayment;
