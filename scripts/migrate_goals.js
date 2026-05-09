const pool = require("../src/config/db");

async function migrate() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS course_goals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          target_hours NUMERIC(5, 2),
          target_score NUMERIC(5, 2),
          target_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("Table course_goals created successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
