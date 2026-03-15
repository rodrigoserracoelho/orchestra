const { pool } = require('../config/database');

const Rehearsal = {
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT r.*, s.name as season_name
       FROM rehearsals r
       JOIN seasons s ON r.season_id = s.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findBySeasonId(seasonId) {
    const [rows] = await pool.execute(
      `SELECT r.*, s.name as season_name
       FROM rehearsals r
       JOIN seasons s ON r.season_id = s.id
       WHERE r.season_id = ?
       ORDER BY r.rehearsal_date ASC`,
      [seasonId]
    );
    return rows;
  },

  async findUpcoming(limit = 20) {
    const [rows] = await pool.execute(
      `SELECT r.*, s.name as season_name
       FROM rehearsals r
       JOIN seasons s ON r.season_id = s.id
       WHERE r.rehearsal_date >= NOW()
       ORDER BY r.rehearsal_date ASC
       LIMIT ?`,
      [String(limit)]
    );
    return rows;
  },

  async findAll() {
    const [rows] = await pool.execute(
      `SELECT r.*, s.name as season_name
       FROM rehearsals r
       JOIN seasons s ON r.season_id = s.id
       ORDER BY r.rehearsal_date ASC`
    );
    return rows;
  },

  async create({ season_id, title, location, rehearsal_date, duration_minutes, notes }) {
    const [result] = await pool.execute(
      `INSERT INTO rehearsals (season_id, title, location, rehearsal_date, duration_minutes, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [season_id, title, location || null, rehearsal_date, duration_minutes || 120, notes || null]
    );
    return this.findById(result.insertId);
  },

  async update(id, fields) {
    const allowed = ['title', 'location', 'rehearsal_date', 'duration_minutes', 'notes'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (updates.length === 0) return this.findById(id);
    values.push(id);
    await pool.execute(`UPDATE rehearsals SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('DELETE FROM rehearsals WHERE id = ?', [id]);
  },
};

module.exports = Rehearsal;
