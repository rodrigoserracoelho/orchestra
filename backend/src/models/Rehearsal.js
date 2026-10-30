const { pool } = require('../config/database');
const { appNow } = require('../config/time');

const REHEARSAL_TYPES = ['tutti', 'sectionelle'];

// "Upcoming" means not finished yet, not merely not started: a rehearsal that
// began an hour ago is still the one you are walking into. The bound parameter
// is appNow() rather than SQL NOW() — see config/time.js.
const NOT_OVER = 'DATE_ADD(r.rehearsal_date, INTERVAL COALESCE(r.duration_minutes, 120) MINUTE) >= ?';

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
              c.venue as concert_venue, c.venue_address as concert_venue_address,
              c.concert_time, c.warmup_time
       FROM rehearsals r
       JOIN seasons s ON r.season_id = s.id
       LEFT JOIN locations l ON r.location_id = l.id
       LEFT JOIN concerts c ON r.concert_id = c.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] ? withLocation(rows[0]) : null;
  },

  // upcomingOnly is for the musician views: players are shown what is still
  // ahead of them, while staff views keep the whole season for attendance.
  async findBySeasonId(seasonId, { upcomingOnly = false } = {}) {
    const [rows] = await pool.execute(
      `SELECT r.*, s.name as season_name,
              l.name as location_name, l.address as location_address,
              c.venue as concert_venue, c.venue_address as concert_venue_address,
              c.concert_time, c.warmup_time
       FROM rehearsals r
       JOIN seasons s ON r.season_id = s.id
       LEFT JOIN locations l ON r.location_id = l.id
       LEFT JOIN concerts c ON r.concert_id = c.id
       WHERE r.season_id = ?${upcomingOnly ? ` AND ${NOT_OVER}` : ''}
       ORDER BY r.rehearsal_date ASC`,
      upcomingOnly ? [seasonId, appNow()] : [seasonId]
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
       WHERE ${NOT_OVER}
       ORDER BY r.rehearsal_date ASC
       LIMIT ?`,
      [appNow(), String(limit)]
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
module.exports.NOT_OVER = NOT_OVER;
