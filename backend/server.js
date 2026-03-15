require('dotenv').config();

const app = require('./src/app');
const { testConnection } = require('./src/config/database');
const env = require('./src/config/env');

const PORT = env.port;

async function start() {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\n🎵 Orchestra Attendance API running on port ${PORT}`);
    console.log(`   Environment: ${env.nodeEnv}`);
    console.log(`   Frontend URL: ${env.frontendUrl}\n`);
  });
}

start();
