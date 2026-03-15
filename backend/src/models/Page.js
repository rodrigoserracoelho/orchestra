const { pool } = require('../config/database');

const Page = {
  async findAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM pages ORDER BY sort_order ASC, created_at ASC'
    );
    rows.forEach((r) => { r.active = !!r.active; r.show_in_nav = !!r.show_in_nav; });
    return rows;
  },

  async findAllActive() {
    const [rows] = await pool.execute(
      'SELECT id, slug, title, body, cover_image, sort_order, show_in_nav FROM pages WHERE active = TRUE ORDER BY sort_order ASC, created_at ASC'
    );
    rows.forEach((r) => { r.show_in_nav = !!r.show_in_nav; });
    return rows;
  },

  async findBySlug(slug) {
    const [rows] = await pool.execute(
      'SELECT id, slug, title, body, cover_image, sort_order, show_in_nav FROM pages WHERE slug = ? AND active = TRUE',
      [slug]
    );
    if (rows[0]) rows[0].show_in_nav = !!rows[0].show_in_nav;
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM pages WHERE id = ?', [id]);
    const page = rows[0] || null;
    if (page) { page.active = !!page.active; page.show_in_nav = !!page.show_in_nav; }
    return page;
  },

  async create({ slug, title, body, cover_image, sort_order, active, show_in_nav, created_by }) {
    const [result] = await pool.execute(
      'INSERT INTO pages (slug, title, body, cover_image, sort_order, active, show_in_nav, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [slug, title, body, cover_image || null, sort_order || 0, active !== false, show_in_nav !== false, created_by]
    );
    return this.findById(result.insertId);
  },

  async update(id, fields) {
    const updates = [];
    const values = [];
    const allowed = ['slug', 'title', 'body', 'cover_image', 'sort_order', 'active', 'show_in_nav'];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        if (key === 'active' || key === 'show_in_nav') {
          values.push(!!fields[key]);
        } else if (key === 'cover_image') {
          values.push(fields[key] || null);
        } else {
          values.push(fields[key]);
        }
      }
    }
    if (updates.length === 0) return null;
    values.push(id);
    await pool.execute(`UPDATE pages SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('DELETE FROM pages WHERE id = ?', [id]);
  },
};

module.exports = Page;
