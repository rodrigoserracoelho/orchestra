const { pool } = require('../config/database');
const Rehearsal = require('./Rehearsal');
const Attendance = require('./Attendance');

const AVAILABILITY = ['yes', 'maybe', 'no'];

// A "yes" on the poll is a commitment, "maybe" and "no" carry over as-is, so
// closing a poll does not ask the same people the same question twice.
const AVAILABILITY_TO_ATTENDANCE = {
  yes: 'attending',
  maybe: 'maybe',
  no: 'not_attending',
};

// Whoever plays gets polled, whatever their role: an admin or maestro who also
// sits in the orchestra is asked, a purely administrative account is not. Role
// is the wrong test — an admin checking the app in Musician view still has
// role 'admin', and would never see a poll.
const PLAYS_IN_ORCHESTRA = "u.active = TRUE AND u.instrument IS NOT NULL AND u.instrument <> ''";

// The pool sets no timezone, so a DATETIME read back as a JS Date and written
// again would shift. Poll dates stay wall-clock strings end to end.
function toSqlDate(value) {
  return String(value).slice(0, 16).replace('T', ' ') + ':00';
}

const Poll = {
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT p.*, s.name as season_name,
              l.name as location_name, l.address as location_address,
              o.option_date as winning_date
       FROM polls p
       JOIN seasons s ON p.season_id = s.id
       LEFT JOIN locations l ON p.location_id = l.id
       LEFT JOIN poll_options o ON p.winning_option_id = o.id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findBySeasonId(seasonId) {
    const [rows] = await pool.execute(
      `SELECT p.*, l.name as location_name,
              (SELECT COUNT(*) FROM poll_options o WHERE o.poll_id = p.id) as option_count,
              (SELECT COUNT(DISTINCT v.user_id) FROM poll_votes v
                 JOIN poll_options o ON v.option_id = o.id
                WHERE o.poll_id = p.id) as respondent_count,
              (SELECT COUNT(*) FROM users u
                WHERE ${PLAYS_IN_ORCHESTRA}
                  AND (p.audience = 'all' OR u.instrument = p.audience_instrument)) as eligible_count
       FROM polls p
       LEFT JOIN locations l ON p.location_id = l.id
       WHERE p.season_id = ?
       ORDER BY p.created_at DESC`,
      [seasonId]
    );
    return rows;
  },

  async options(pollId) {
    const [rows] = await pool.execute(
      `SELECT o.id, o.option_date,
              COUNT(CASE WHEN v.availability = 'yes' THEN 1 END) as yes_count,
              COUNT(CASE WHEN v.availability = 'maybe' THEN 1 END) as maybe_count,
              COUNT(CASE WHEN v.availability = 'no' THEN 1 END) as no_count
       FROM poll_options o
       LEFT JOIN poll_votes v ON v.option_id = o.id
       WHERE o.poll_id = ?
       GROUP BY o.id, o.option_date
       ORDER BY o.option_date ASC`,
      [pollId]
    );
    return rows;
  },

  // Everyone the poll is addressed to, whether or not they have answered.
  async eligibleVoters(pollId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.instrument, u.part
       FROM users u
       JOIN polls p ON p.id = ?
       WHERE ${PLAYS_IN_ORCHESTRA}
         AND (p.audience = 'all' OR u.instrument = p.audience_instrument)
       ORDER BY u.name`,
      [pollId]
    );
    return rows;
  },

  async votes(pollId) {
    const [rows] = await pool.execute(
      `SELECT v.option_id, v.user_id, v.availability
       FROM poll_votes v
       JOIN poll_options o ON v.option_id = o.id
       WHERE o.poll_id = ?`,
      [pollId]
    );
    return rows;
  },

  async isEligible(pollId, userId) {
    const [rows] = await pool.execute(
      `SELECT 1
       FROM users u
       JOIN polls p ON p.id = ?
       WHERE u.id = ?
         AND ${PLAYS_IN_ORCHESTRA}
         AND (p.audience = 'all' OR u.instrument = p.audience_instrument)`,
      [pollId, userId]
    );
    return rows.length > 0;
  },

  // Open polls this user is asked to answer, newest first.
  async findOpenForUser(userId) {
    const [rows] = await pool.execute(
      `SELECT p.*, s.name as season_name, l.name as location_name,
              (SELECT COUNT(*) FROM poll_options o WHERE o.poll_id = p.id) as option_count,
              (SELECT COUNT(*) FROM poll_votes v
                 JOIN poll_options o ON v.option_id = o.id
                WHERE o.poll_id = p.id AND v.user_id = u.id) as my_vote_count
       FROM polls p
       JOIN seasons s ON p.season_id = s.id
       JOIN users u ON u.id = ?
       LEFT JOIN locations l ON p.location_id = l.id
       WHERE p.status = 'open'
         AND ${PLAYS_IN_ORCHESTRA}
         AND (p.audience = 'all' OR u.instrument = p.audience_instrument)
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async create({ season_id, title, description, rehearsal_type, location_id, duration_minutes,
                 audience, audience_instrument, closes_at, created_by, options }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        `INSERT INTO polls (season_id, title, description, rehearsal_type, location_id,
                            duration_minutes, audience, audience_instrument, closes_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [season_id, title, description || null,
         rehearsal_type === 'sectionelle' ? 'sectionelle' : 'tutti',
         location_id || null, duration_minutes || 120,
         audience === 'instrument' ? 'instrument' : 'all',
         audience === 'instrument' ? (audience_instrument || null) : null,
         closes_at || null, created_by || null]
      );
      for (const date of options) {
        await conn.execute(
          'INSERT INTO poll_options (poll_id, option_date) VALUES (?, ?)',
          [result.insertId, toSqlDate(date)]
        );
      }
      await conn.commit();
      return this.findById(result.insertId);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async update(id, fields) {
    const allowed = ['title', 'description', 'rehearsal_type', 'location_id', 'duration_minutes',
                     'audience', 'audience_instrument', 'closes_at'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      // An 'all' poll must not keep a stale instrument from a previous edit.
      if (key === 'audience_instrument' && fields.audience === 'all') {
        updates.push('audience_instrument = ?');
        values.push(null);
        continue;
      }
      if (fields[key] === undefined) continue;
      updates.push(`${key} = ?`);
      values.push(fields[key] === '' ? null : fields[key]);
    }
    if (updates.length === 0) return this.findById(id);
    values.push(id);
    await pool.execute(`UPDATE polls SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  // Options the poll no longer offers are dropped along with their votes;
  // options that survive keep their id, and so keep the votes already cast.
  async replaceOptions(pollId, dates) {
    const wanted = dates.map(toSqlDate);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      if (wanted.length === 0) {
        await conn.execute('DELETE FROM poll_options WHERE poll_id = ?', [pollId]);
      } else {
        const placeholders = wanted.map(() => '?').join(', ');
        await conn.execute(
          `DELETE FROM poll_options WHERE poll_id = ? AND option_date NOT IN (${placeholders})`,
          [pollId, ...wanted]
        );
        for (const stamp of wanted) {
          await conn.execute(
            'INSERT IGNORE INTO poll_options (poll_id, option_date) VALUES (?, ?)',
            [pollId, stamp]
          );
        }
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
    return this.options(pollId);
  },

  async vote(optionId, userId, availability) {
    if (!AVAILABILITY.includes(availability)) return null;
    await pool.execute(
      `INSERT INTO poll_votes (option_id, user_id, availability)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE availability = VALUES(availability)`,
      [optionId, userId, availability]
    );
    return true;
  },

  async optionBelongsToPoll(optionId, pollId) {
    const [rows] = await pool.execute(
      'SELECT 1 FROM poll_options WHERE id = ? AND poll_id = ?',
      [optionId, pollId]
    );
    return rows.length > 0;
  },

  // Closing turns the winning slot into a rehearsal and carries every vote on
  // that slot over as an attendance answer.
  async close(pollId, optionId) {
    const poll = await this.findById(pollId);
    const [optionRows] = await pool.execute(
      `SELECT id, DATE_FORMAT(option_date, '%Y-%m-%d %H:%i:%s') as option_date
       FROM poll_options WHERE id = ? AND poll_id = ?`,
      [optionId, pollId]
    );
    const option = optionRows[0];
    if (!poll || !option) return null;

    const rehearsal = await Rehearsal.create({
      season_id: poll.season_id,
      title: poll.title,
      rehearsal_type: poll.rehearsal_type,
      location_id: poll.location_id,
      rehearsal_date: option.option_date,
      duration_minutes: poll.duration_minutes,
      notes: poll.description,
    });

    const [votes] = await pool.execute(
      'SELECT user_id, availability FROM poll_votes WHERE option_id = ?',
      [optionId]
    );
    for (const vote of votes) {
      await Attendance.upsert({
        rehearsal_id: rehearsal.id,
        user_id: vote.user_id,
        status: AVAILABILITY_TO_ATTENDANCE[vote.availability],
      });
    }

    await pool.execute(
      `UPDATE polls SET status = 'closed', winning_option_id = ?, rehearsal_id = ? WHERE id = ?`,
      [optionId, rehearsal.id, pollId]
    );
    return { poll: await this.findById(pollId), rehearsal };
  },

  // Reopening leaves the rehearsal that was created alone — deleting it would
  // throw away attendance answers given since the poll closed.
  async reopen(id) {
    await pool.execute(
      `UPDATE polls SET status = 'open', winning_option_id = NULL WHERE id = ?`,
      [id]
    );
    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('DELETE FROM polls WHERE id = ?', [id]);
  },
};

module.exports = Poll;
module.exports.AVAILABILITY = AVAILABILITY;
