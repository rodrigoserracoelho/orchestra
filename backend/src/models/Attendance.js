const { pool } = require('../config/database');
const { NOT_OVER } = require('./Rehearsal');
const { appNow } = require('../config/time');

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

  // What a musician has accepted and still has ahead of them in one season,
  // with the venue resolved the way the rehearsal list resolves it. Matches the
  // musician rehearsal list, so the export count and the file agree.
  async findAcceptedInSeason(userId, seasonId) {
    const [rows] = await pool.execute(
      `SELECT r.id, r.title, r.rehearsal_date, r.duration_minutes, r.notes, r.concert_id,
              c.concert_time, c.warmup_time,
              COALESCE(l.name, c.venue, r.location) AS location,
              COALESCE(l.address, c.venue_address) AS location_address
       FROM attendance a
       JOIN rehearsals r ON a.rehearsal_id = r.id
       LEFT JOIN locations l ON r.location_id = l.id
       LEFT JOIN concerts c ON r.concert_id = c.id
       WHERE a.user_id = ? AND r.season_id = ? AND a.status = 'attending'
         AND ${NOT_OVER}
       ORDER BY r.rehearsal_date ASC`,
      [userId, seasonId, appNow()]
    );
    return rows;
  },

  // Per-member declared-attendance totals for one season.
  //
  // The denominator is rehearsals that have already FINISHED — counting ones
  // still to come would drag every rate down in proportion to how early in the
  // season you look. Uses appNow() rather than SQL NOW() for the same reason
  // the rest of the app does: see config/time.js.
  //
  // No role filter: an admin or maestro who also plays gets counted like
  // anyone else, and the caller decides who to display.
  async getSeasonStats(seasonId) {
    const [rows] = await pool.execute(
      `SELECT u.id AS user_id,
              COUNT(r.id) AS total,
              CAST(SUM(a.status = 'attending') AS UNSIGNED)     AS attending,
              CAST(SUM(a.status = 'maybe') AS UNSIGNED)         AS maybe,
              CAST(SUM(a.status = 'not_attending') AS UNSIGNED) AS not_attending,
              CAST(SUM(a.status IS NOT NULL) AS UNSIGNED)       AS responded
       FROM users u
       CROSS JOIN rehearsals r
       LEFT JOIN attendance a ON a.rehearsal_id = r.id AND a.user_id = u.id
       WHERE r.season_id = ?
         AND DATE_ADD(r.rehearsal_date, INTERVAL COALESCE(r.duration_minutes, 120) MINUTE) < ?
       GROUP BY u.id`,
      [seasonId, appNow()]
    );
    // mysql2 returns SUM() as a string; callers want numbers.
    return rows.map((r) => ({
      user_id: r.user_id,
      total: Number(r.total),
      attending: Number(r.attending),
      maybe: Number(r.maybe),
      not_attending: Number(r.not_attending),
      responded: Number(r.responded),
    }));
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
