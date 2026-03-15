const { pool } = require('../config/database');

const Attendance = {
  async findByRehearsalAndUser(rehearsalId, userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM attendance WHERE rehearsal_id = ? AND user_id = ?',
      [rehearsalId, userId]
    );
    return rows[0] || null;
  },

  async findByRehearsal(rehearsalId) {
    const [rows] = await pool.execute(
      `SELECT a.*, u.name, u.instrument, u.part
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.rehearsal_id = ?
       ORDER BY u.name`,
      [rehearsalId]
    );
    return rows;
  },

  async findByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT a.*, r.title, r.rehearsal_date, r.location, s.name as season_name
       FROM attendance a
       JOIN rehearsals r ON a.rehearsal_id = r.id
       JOIN seasons s ON r.season_id = s.id
       WHERE a.user_id = ?
       ORDER BY r.rehearsal_date DESC`,
      [userId]
    );
    return rows;
  },

  async upsert({ rehearsal_id, user_id, status, notes }) {
    await pool.execute(
      `INSERT INTO attendance (rehearsal_id, user_id, status, notes, response_date)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), response_date = NOW()`,
      [rehearsal_id, user_id, status, notes || null]
    );
    return this.findByRehearsalAndUser(rehearsal_id, user_id);
  },

  async getSummaryByRehearsal(rehearsalId) {
    const [rows] = await pool.execute(
      `SELECT
         COUNT(CASE WHEN status = 'attending' THEN 1 END) as attending,
         COUNT(CASE WHEN status = 'not_attending' THEN 1 END) as not_attending,
         COUNT(CASE WHEN status = 'maybe' THEN 1 END) as maybe,
         COUNT(*) as total_responses
       FROM attendance
       WHERE rehearsal_id = ?`,
      [rehearsalId]
    );
    return rows[0];
  },

  async getSeasonSummary(seasonId) {
    const [rows] = await pool.execute(
      `SELECT r.id as rehearsal_id, r.title, r.rehearsal_date,
              u.id as user_id, u.name, u.instrument,
              a.status
       FROM rehearsals r
       CROSS JOIN users u
       LEFT JOIN attendance a ON a.rehearsal_id = r.id AND a.user_id = u.id
       WHERE r.season_id = ? AND u.role = 'musician'
       ORDER BY r.rehearsal_date, u.name`,
      [seasonId]
    );
    return rows;
  },
};

module.exports = Attendance;
