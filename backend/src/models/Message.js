const { pool } = require('../config/database');

const Message = {
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT m.*, u.name AS author_name,
        (SELECT COUNT(*) FROM message_reads mr WHERE mr.message_id = m.id) AS read_count
       FROM messages m
       JOIN users u ON m.created_by = u.id
       ORDER BY m.created_at DESC`
    );
    rows.forEach((r) => { r.active = !!r.active; });
    return rows;
  },

  async findActiveForUser(userId) {
    const [rows] = await pool.execute(
      `SELECT m.*, u.name AS author_name,
        (SELECT COUNT(*) FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = ?) AS is_read
       FROM messages m
       JOIN users u ON m.created_by = u.id
       WHERE m.active = TRUE
       ORDER BY m.created_at DESC`,
      [userId]
    );
    rows.forEach((r) => {
      r.active = !!r.active;
      r.is_read = !!r.is_read;
    });
    return rows;
  },

  async unreadCount(userId) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count FROM messages m
       WHERE m.active = TRUE
       AND NOT EXISTS (SELECT 1 FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = ?)`,
      [userId]
    );
    return rows[0].count;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM messages WHERE id = ?', [id]);
    const msg = rows[0] || null;
    if (msg) msg.active = !!msg.active;
    return msg;
  },

  async create({ title, body, cover_image, created_by }) {
    const [result] = await pool.execute(
      'INSERT INTO messages (title, body, cover_image, created_by) VALUES (?, ?, ?, ?)',
      [title, body, cover_image || null, created_by]
    );
    return { id: result.insertId, title, body, cover_image, active: true, created_by };
  },

  async update(id, { title, body, cover_image, active }) {
    const updates = [];
    const values = [];
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (body !== undefined) { updates.push('body = ?'); values.push(body); }
    if (cover_image !== undefined) { updates.push('cover_image = ?'); values.push(cover_image || null); }
    if (active !== undefined) { updates.push('active = ?'); values.push(!!active); }
    if (updates.length === 0) return null;
    values.push(id);
    await pool.execute(`UPDATE messages SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('DELETE FROM messages WHERE id = ?', [id]);
  },

  async markRead(messageId, userId) {
    await pool.execute(
      'INSERT IGNORE INTO message_reads (message_id, user_id) VALUES (?, ?)',
      [messageId, userId]
    );
  },

  async getReaders(messageId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.instrument, mr.read_at
       FROM message_reads mr
       JOIN users u ON mr.user_id = u.id
       WHERE mr.message_id = ?
       ORDER BY mr.read_at DESC`,
      [messageId]
    );
    return rows;
  },

  async getTotalMusicians() {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) AS count FROM users WHERE active = TRUE AND role = 'musician'"
    );
    return rows[0].count;
  },
};

module.exports = Message;
