const pool = require("../src/config/db");

async function migrate() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS reading_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
          material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
          duration_seconds INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log("Table reading_logs created.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
