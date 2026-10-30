// Create a single admin user — for bootstrapping a fresh instance without the
// sample season, musicians and rehearsals that seedDatabase.js inserts.
//
//   node seeds/createAdmin.js "you@example.com" "Your Name"
//
// Login is passwordless (emailed code), so no password is set. Re-running for
// an existing email promotes that account to admin rather than failing.
require('dotenv').config();
const { pool } = require('../src/config/database');

async function main() {
  const [, , email, name] = process.argv;
  if (!email || !name) {
    console.error('Usage: node seeds/createAdmin.js "<email>" "<name>"');
    process.exit(1);
  }

  const [existing] = await pool.execute('SELECT id, role FROM users WHERE email = ?', [email]);
  if (existing.length) {
    await pool.execute("UPDATE users SET role = 'admin', active = TRUE WHERE id = ?", [existing[0].id]);
    console.log(`✓ ${email} already existed (role was ${existing[0].role}) — promoted to admin`);
  } else {
    await pool.execute(
      "INSERT INTO users (email, name, role, active) VALUES (?, ?, 'admin', TRUE)",
      [email, name]
    );
    console.log(`✓ admin created: ${email}`);
  }
  console.log('  Sign in with the 6-digit code sent to that address.');
  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
