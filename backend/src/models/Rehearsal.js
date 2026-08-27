const { pool } = require('../config/database');

const REHEARSAL_TYPES = ['tutti', 'sectionelle'];

// Locations moved from free text to a managed list. Rows created before that
// still carry their text in `location`, so the joined name wins when present
// and every existing caller can keep reading `location`.
function withLocation(row) {
  if (row.location_name) row.location = row.location_name;
  return row;
}

const Rehearsal = {
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT r.*, s.name as season_name,
              l.name as location_name, l.address as location_address,
              c.venue as concert_venue, c.venue_address as concert_venue_address
       FROM rehearsals r
       JOIN seasons s ON r.season_id = s.id
       LEFT JOIN locations l ON r.location_id = l.id
       LEFT JOIN concerts c ON r.concert_id = c.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] ? withLocation(rows[0]) : null;
  },

  async findBySeasonId(seasonId) {
    const [rows] = await pool.execute(
      `SELECT r.*, s.name as season_name,
              l.name as location_name, l.address as location_address,
              c.venue as concert_venue, c.venue_address as concert_venue_address
       FROM rehearsals r
       JOIN seasons s ON r.season_id = s.id
       LEFT JOIN locations l ON r.location_id = l.id
       LEFT JOIN concerts c ON r.concert_id = c.id
       WHERE r.season_id = ?
       ORDER BY r.rehearsal_date ASC`,
      [seasonId]
    );
    return rows.map(withLocation);
  },

  async findUpcoming(limit = 20) {
    const [rows] = await pool.execute(
      `SELECT r.*, s.name as season_name,
              l.name as location_name, l.address as location_address
       FROM rehearsals r
       JOIN seasons s ON r.season_id = s.id
       LEFT JOIN locations l ON r.location_id = l.id
       WHERE r.rehearsal_date >= NOW()
       ORDER BY r.rehearsal_date ASC
       LIMIT ?`,
      [String(limit)]
    );
    return rows.map(withLocation);
  },

  async findAll() {
    const [rows] = await pool.execute(
      `SELECT r.*, s.name as season_name,
              l.name as location_name, l.address as location_address
       FROM rehearsals r
       JOIN seasons s ON r.season_id = s.id
       LEFT JOIN locations l ON r.location_id = l.id
       ORDER BY r.rehearsal_date ASC`
    );
    return rows.map(withLocation);
  },

  async create({ season_id, title, rehearsal_type, location, location_id, rehearsal_date, duration_minutes, notes }) {
    const [result] = await pool.execute(
      `INSERT INTO rehearsals (season_id, title, rehearsal_type, location, location_id, rehearsal_date, duration_minutes, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [season_id, title, REHEARSAL_TYPES.includes(rehearsal_type) ? rehearsal_type : 'tutti',
       location || null, location_id || null, rehearsal_date, duration_minutes || 120, notes || null]
    );
    return this.findById(result.insertId);
  },

  async update(id, fields) {
    const allowed = ['title', 'rehearsal_type', 'location', 'location_id', 'rehearsal_date', 'duration_minutes', 'notes'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (key === 'rehearsal_type' && !REHEARSAL_TYPES.includes(fields[key])) continue;
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(key === 'location_id' ? (fields[key] || null) : fields[key]);
      }
    }
    // Picking a managed location retires whatever free text the row carried.
    if (fields.location_id && fields.location === undefined) {
      updates.push('location = ?');
      values.push(null);
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
module.exports.REHEARSAL_TYPES = REHEARSAL_TYPES;
