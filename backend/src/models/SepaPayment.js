const { pool } = require('../config/database');

const SepaPayment = {
  // Returns existing pending row for (user, season) or null.
  async findPending(user_id, season_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM sepa_payments
       WHERE user_id = ? AND season_id = ? AND status = 'pending'
       LIMIT 1`,
      [user_id, season_id]
    );
    return rows[0] || null;
  },

  async findByCommunication(structured_communication) {
    const [rows] = await pool.execute(
      'SELECT * FROM sepa_payments WHERE structured_communication = ?',
      [structured_communication]
    );
    return rows[0] || null;
  },

  // Two-step insert: create row to get the auto-id, then patch the
  // structured_communication derived from that id.
  async createPending({ user_id, season_id, amount }) {
    const [ins] = await pool.execute(
      `INSERT INTO sepa_payments (user_id, season_id, amount, structured_communication)
       VALUES (?, ?, ?, '')`,
      [user_id, season_id, amount]
    );
    return ins.insertId;
  },

  async setCommunication(id, communication) {
    await pool.execute(
      'UPDATE sepa_payments SET structured_communication = ? WHERE id = ?',
      [communication, id]
    );
  },

  async markPaid(id, coda_transaction_ref) {
    await pool.execute(
      `UPDATE sepa_payments SET status = 'paid', paid_at = NOW(), coda_transaction_ref = ?
       WHERE id = ? AND status = 'pending'`,
      [coda_transaction_ref || null, id]
    );
  },
};

module.exports = SepaPayment;
