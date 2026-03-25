const pool = require('./src/config/db');

async function updateDb() {
    try {
        console.log("Adding institutional_id and middle_name columns to users table if they don't exist...");
        await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS institutional_id VARCHAR(50) UNIQUE,
      ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
    `);
        console.log("Database schema updated successfully.");
    } catch (err) {
        console.error("Error updating database:", err);
    } finally {
        pool.end();
    }
}

updateDb();
