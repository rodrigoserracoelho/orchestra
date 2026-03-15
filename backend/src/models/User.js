const { pool } = require('../config/database');

const User = {
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, email, name, instrument, part, birthdate, phone, role, active, created_at FROM users WHERE id = ?',
      [id]
    );
    const user = rows[0] || null;
    if (user) user.active = !!user.active;
    return user;
  },

  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0] || null;
    if (user) user.active = !!user.active;
    return user;
  },

  async findAll() {
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.name, u.instrument, u.part, u.birthdate, u.phone, u.role, u.active, u.created_at, s.last_seen_at
       FROM users u
       LEFT JOIN user_sessions s ON u.id = s.user_id
       ORDER BY u.name`
    );
    rows.forEach((u) => { u.active = !!u.active; });
    return rows;
  },

  async create({ email, name, password_hash = null, instrument, part, birthdate, phone, role = 'musician' }) {
    const [result] = await pool.execute(
      'INSERT INTO users (email, name, password_hash, instrument, part, birthdate, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [email, name, password_hash, instrument || null, part || null, birthdate || null, phone || null, role]
    );
    return { id: result.insertId, email, name, instrument, part, birthdate, phone, role };
  },

  async update(id, fields) {
    const allowed = ['name', 'instrument', 'part', 'birthdate', 'phone', 'email', 'role', 'active'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(key === 'active' ? !!fields[key] : (fields[key] || null));
      }
    }
    if (updates.length === 0) return null;
    values.push(id);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  },

  async count() {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users');
    return rows[0].count;
  },
};

module.exports = User;
