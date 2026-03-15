const { pool } = require('../config/database');

const News = {
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT n.*, u.name AS author_name,
        (SELECT COUNT(*) FROM news_reads nr WHERE nr.news_id = n.id) AS read_count
       FROM news n
       JOIN users u ON n.created_by = u.id
       ORDER BY n.created_at DESC`
    );
    rows.forEach((r) => { r.active = !!r.active; });
    return rows;
  },

  async findActiveForUser(userId) {
    const [rows] = await pool.execute(
      `SELECT n.*, u.name AS author_name,
        (SELECT COUNT(*) FROM news_reads nr WHERE nr.news_id = n.id AND nr.user_id = ?) AS is_read
       FROM news n
       JOIN users u ON n.created_by = u.id
       WHERE n.active = TRUE
       ORDER BY n.created_at DESC`,
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
      `SELECT COUNT(*) AS count FROM news n
       WHERE n.active = TRUE
       AND NOT EXISTS (SELECT 1 FROM news_reads nr WHERE nr.news_id = n.id AND nr.user_id = ?)`,
      [userId]
    );
    return rows[0].count;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM news WHERE id = ?', [id]);
    const article = rows[0] || null;
    if (article) article.active = !!article.active;
    return article;
  },

  async create({ title, body, cover_image, created_by }) {
    const [result] = await pool.execute(
      'INSERT INTO news (title, body, cover_image, created_by) VALUES (?, ?, ?, ?)',
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
    await pool.execute(`UPDATE news SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('DELETE FROM news WHERE id = ?', [id]);
  },

  async markRead(newsId, userId) {
    await pool.execute(
      'INSERT IGNORE INTO news_reads (news_id, user_id) VALUES (?, ?)',
      [newsId, userId]
    );
  },

  async getReaders(newsId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.instrument, nr.read_at
       FROM news_reads nr
       JOIN users u ON nr.user_id = u.id
       WHERE nr.news_id = ?
       ORDER BY nr.read_at DESC`,
      [newsId]
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

module.exports = News;
