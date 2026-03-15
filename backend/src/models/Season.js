const { pool } = require('../config/database');

const Season = {
  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM seasons WHERE id = ?', [id]);
    if (!rows[0]) return null;
    const season = rows[0];
    season.concerts = await this.findConcerts(id);
    return season;
  },

  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM seasons ORDER BY created_at DESC');
    for (const season of rows) {
      season.concerts = await this.findConcerts(season.id);
    }
    return rows;
  },

  async findAllActive() {
    const [rows] = await pool.execute('SELECT * FROM seasons WHERE active = TRUE ORDER BY created_at DESC');
    for (const season of rows) {
      season.concerts = await this.findConcerts(season.id);
    }
    return rows;
  },

  async findCurrent() {
    const [rows] = await pool.execute(
      `SELECT DISTINCT s.* FROM seasons s
       JOIN concerts c ON c.season_id = s.id
       WHERE c.concert_date >= CURDATE()
       ORDER BY c.concert_date ASC
       LIMIT 1`
    );
    if (!rows[0]) return null;
    rows[0].concerts = await this.findConcerts(rows[0].id);
    return rows[0];
  },

  async findByMaestroId(maestroId) {
    const [rows] = await pool.execute(
      'SELECT * FROM seasons WHERE maestro_id = ? ORDER BY created_at DESC',
      [maestroId]
    );
    for (const season of rows) {
      season.concerts = await this.findConcerts(season.id);
    }
    return rows;
  },

  async create({ name, maestro, maestro_id, active, season_fee, concerts, created_by }) {
    const [result] = await pool.execute(
      'INSERT INTO seasons (name, maestro, maestro_id, active, season_fee, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name, maestro || null, maestro_id || null, active !== undefined ? active : true, season_fee || null, created_by]
    );
    const seasonId = result.insertId;

    if (concerts && concerts.length > 0) {
      await this.replaceConcerts(seasonId, concerts);
    }

    return this.findById(seasonId);
  },

  async update(id, { name, maestro, maestro_id, active, season_fee, concerts }) {
    const updates = [];
    const values = [];
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (maestro !== undefined) { updates.push('maestro = ?'); values.push(maestro || null); }
    if (maestro_id !== undefined) { updates.push('maestro_id = ?'); values.push(maestro_id || null); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active); }
    if (season_fee !== undefined) { updates.push('season_fee = ?'); values.push(season_fee || null); }
    if (updates.length > 0) {
      values.push(id);
      await pool.execute(`UPDATE seasons SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (concerts !== undefined) {
      await this.replaceConcerts(id, concerts);
    }

    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('DELETE FROM seasons WHERE id = ?', [id]);
  },

  // --- Concerts helpers ---

  async findConcerts(seasonId) {
    const [rows] = await pool.execute(
      'SELECT * FROM concerts WHERE season_id = ? ORDER BY concert_date ASC',
      [seasonId]
    );
    return rows;
  },

  async replaceConcerts(seasonId, concerts) {
    await pool.execute('DELETE FROM concerts WHERE season_id = ?', [seasonId]);
    for (const c of concerts) {
      await pool.execute(
        'INSERT INTO concerts (season_id, concert_date, label, venue, venue_address) VALUES (?, ?, ?, ?, ?)',
        [seasonId, c.concert_date, c.label || null, c.venue || null, c.venue_address || null]
      );
    }
  },
};

module.exports = Season;
