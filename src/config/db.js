const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  connectionTimeoutMillis: 5000, // 5 seconds max to wait for connection
  idleTimeoutMillis: 30000,
});

// Add a connection listener for debugging
pool.on('connect', () => {
  console.log('🐘 PostgreSQL connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;