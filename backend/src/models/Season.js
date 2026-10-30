const { pool } = require('../config/database');

// A concert is a date plus two optional clock times: `warmup_time` is when the
// players are called in for the raccord, `concert_time` when the audience
// hears the first note. The mirror rehearsal — the row that carries attendance
// and feeds the .ics export — starts at the raccord, because that is the
// moment a musician actually has to be there.
const CONCERT_LENGTH_MINUTES = 180;

// A <input type="time"> sends 'HH:MM'; MySQL reads back 'HH:MM:SS'. Normalise
// both to the column format, and treat an empty string as "not set".
function toSqlTime(value) {
  if (!value) return null;
  const m = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return `${m[1].padStart(2, '0')}:${m[2]}:00`;
}

function minutesOfDay(sqlTime) {
  const [h, m] = sqlTime.split(':');
  return Number(h) * 60 + Number(m);
}

function concertSchedule(c) {
  const date = String(c.concert_date).split('T')[0];
  const concertTime = toSqlTime(c.concert_time);
  const warmupTime = toSqlTime(c.warmup_time);
  const start = warmupTime || concertTime;

  let duration = CONCERT_LENGTH_MINUTES;
  if (warmupTime && concertTime) {
    // A raccord logged after the downbeat is nonsense; ignore the gap rather
    // than produce a rehearsal that ends before it starts.
    duration += Math.max(0, minutesOfDay(concertTime) - minutesOfDay(warmupTime));
  }

  return {
    concertTime,
    warmupTime,
    // No time given at all keeps the old behaviour: midnight on the day.
    rehearsalDate: start ? `${date} ${start}` : `${date} 00:00:00`,
    duration,
  };
}

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
    const [existing] = await pool.execute('SELECT id FROM concerts WHERE season_id = ?', [seasonId]);
    const existingIds = existing.map((c) => c.id);
    const incomingIds = concerts.filter((c) => c.id).map((c) => c.id);

    // Delete removed concerts (CASCADE deletes linked rehearsals + attendance)
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
    for (const id of toDelete) {
      await pool.execute('DELETE FROM concerts WHERE id = ?', [id]);
    }

    for (const c of concerts) {
      const { concertTime, warmupTime, rehearsalDate, duration } = concertSchedule(c);

      if (c.id && existingIds.includes(c.id)) {
        // Update existing concert
        await pool.execute(
          'UPDATE concerts SET concert_date = ?, concert_time = ?, warmup_time = ?, label = ?, venue = ?, venue_address = ? WHERE id = ?',
          [c.concert_date, concertTime, warmupTime, c.label || null, c.venue || null, c.venue_address || null, c.id]
        );
        // Update linked rehearsal
        await pool.execute(
          'UPDATE rehearsals SET title = ?, location = ?, rehearsal_date = ?, duration_minutes = ? WHERE concert_id = ?',
          [c.label || 'Concert', c.venue || null, rehearsalDate, duration, c.id]
        );
      } else {
        // Insert new concert
        const [result] = await pool.execute(
          'INSERT INTO concerts (season_id, concert_date, concert_time, warmup_time, label, venue, venue_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [seasonId, c.concert_date, concertTime, warmupTime, c.label || null, c.venue || null, c.venue_address || null]
        );
        // Create linked rehearsal entry for attendance tracking
        await pool.execute(
          'INSERT INTO rehearsals (season_id, title, location, rehearsal_date, duration_minutes, concert_id) VALUES (?, ?, ?, ?, ?, ?)',
          [seasonId, c.label || 'Concert', c.venue || null, rehearsalDate, duration, result.insertId]
        );
      }
    }
  },
};

module.exports = Season;
module.exports.concertSchedule = concertSchedule;
