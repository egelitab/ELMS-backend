const pool = require('./src/config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting migration...");

        await client.query(`
      ALTER TABLE groups 
      ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS section VARCHAR(50),
      ADD COLUMN IF NOT EXISTS batch_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS method VARCHAR(50);
    `);

        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
