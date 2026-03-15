require('dotenv').config();
const { pool } = require('../src/config/database');
const { hashPassword } = require('../src/services/passwordService');

async function seed() {
  try {
    console.log('Seeding database...');

    // Create admin user (maestro)
    const adminPassword = await hashPassword('admin123');
    const [adminResult] = await pool.execute(
      `INSERT INTO users (email, name, password_hash, instrument, role)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      ['maestro@orchestra.com', 'Maestro', adminPassword, null, 'admin']
    );
    const adminId = adminResult.insertId || 1;
    console.log('✓ Admin user created (maestro@orchestra.com / admin123)');

    // Create a sample season
    const [seasonResult] = await pool.execute(
      'INSERT INTO seasons (name, maestro, active, season_fee, created_by) VALUES (?, ?, ?, ?, ?)',
      ['June 2026 Concert', 'Maestro', true, 50.00, adminId]
    );
    const seasonId = seasonResult.insertId;

    // Add concert dates
    await pool.execute(
      'INSERT INTO concerts (season_id, concert_date, label, venue, venue_address) VALUES (?, ?, ?, ?, ?)',
      [seasonId, '2026-06-20', 'Main Concert', 'Concert Hall', 'Rue de la Montagne 10, Brussels']
    );
    await pool.execute(
      'INSERT INTO concerts (season_id, concert_date, label, venue, venue_address) VALUES (?, ?, ?, ?, ?)',
      [seasonId, '2026-06-21', 'Matinee', 'Concert Hall', 'Rue de la Montagne 10, Brussels']
    );
    console.log('✓ Sample season created with 2 concerts');

    // Create sample rehearsals
    const rehearsals = [
      ['First rehearsal - Full orchestra', 'Concert Hall', '2026-03-10 19:00:00', 120],
      ['Strings section', 'Rehearsal Room A', '2026-03-17 19:00:00', 90],
      ['Winds & Brass', 'Rehearsal Room B', '2026-03-24 19:00:00', 90],
      ['Full orchestra - Program run', 'Concert Hall', '2026-03-31 19:00:00', 150],
      ['Full orchestra', 'Concert Hall', '2026-04-07 19:00:00', 120],
      ['Full orchestra', 'Concert Hall', '2026-04-14 19:00:00', 120],
      ['Full orchestra', 'Concert Hall', '2026-04-21 19:00:00', 120],
      ['Dress rehearsal', 'Concert Hall', '2026-06-19 18:00:00', 180],
    ];

    for (const [title, location, date, duration] of rehearsals) {
      await pool.execute(
        'INSERT INTO rehearsals (season_id, title, location, rehearsal_date, duration_minutes) VALUES (?, ?, ?, ?, ?)',
        [seasonId, title, location, date, duration]
      );
    }
    console.log(`✓ ${rehearsals.length} sample rehearsals created`);

    // Create sample musicians (no passwords — they use login codes)
    const musicians = [
      ['violin1@orchestra.com', 'Ana García', 'Violin'],
      ['violin2@orchestra.com', 'Carlos López', 'Violin'],
      ['viola1@orchestra.com', 'Maria Santos', 'Viola'],
      ['cello1@orchestra.com', 'Pedro Fernández', 'Cello'],
      ['flute1@orchestra.com', 'Laura Martín', 'Flute'],
      ['oboe1@orchestra.com', 'Rodrigo Silva', 'Oboe'],
      ['clarinet1@orchestra.com', 'Sofia Alves', 'Clarinet'],
      ['trumpet1@orchestra.com', 'João Costa', 'Trumpet'],
    ];

    for (const [email, name, instrument] of musicians) {
      await pool.execute(
        `INSERT INTO users (email, name, password_hash, instrument, role)
         VALUES (?, ?, NULL, ?, 'musician')
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [email, name, instrument]
      );
    }
    console.log(`✓ ${musicians.length} sample musicians created (passwordless — use login codes)`);

    console.log('\nSeeding complete!');
    console.log('\nAdmin login: maestro@orchestra.com / admin123 (password)');
    console.log('Admin can also use code login like everyone else.');
    console.log('Musicians: use any sample email, login codes print to console when SMTP is not configured.\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
