const { pool } = require('../config/database');

const Location = {
  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM locations ORDER BY name ASC');
    rows.forEach((r) => { r.active = !!r.active; });
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM locations WHERE id = ?', [id]);
    const location = rows[0] || null;
    if (location) location.active = !!location.active;
    return location;
  },

  async create({ name, address, notes, active }) {
    const [result] = await pool.execute(
      'INSERT INTO locations (name, address, notes, active) VALUES (?, ?, ?, ?)',
      [name, address || null, notes || null, active !== false]
    );
    return this.findById(result.insertId);
  },

  async update(id, fields) {
    const allowed = ['name', 'address', 'notes', 'active'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] === undefined) continue;
      updates.push(`${key} = ?`);
      values.push(key === 'active' ? !!fields[key] : (fields[key] || null));
    }
    if (updates.length === 0) return this.findById(id);
    values.push(id);
    await pool.execute(`UPDATE locations SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  // Rehearsals keep a location_id, so a location in use cannot be removed
  // without silently blanking those rehearsals. Callers deactivate instead.
  async rehearsalCount(id) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM rehearsals WHERE location_id = ?',
      [id]
    );
    return rows[0].count;
  },

  async delete(id) {
    await pool.execute('DELETE FROM locations WHERE id = ?', [id]);
  },
};

module.exports = Location;
