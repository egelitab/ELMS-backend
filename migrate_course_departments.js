const pool = require("./src/config/db");

async function migrate() {
    try {
        console.log("Migrating courses table to support multiple departments...");

        // 1. Add department_ids column
        await pool.query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS department_ids JSONB DEFAULT '[]'");

        // 2. Migrate existing department_id to the new array column
        await pool.query(`
            UPDATE courses 
            SET department_ids = jsonb_build_array(department_id) 
            WHERE department_id IS NOT NULL AND (department_ids IS NULL OR jsonb_array_length(department_ids) = 0)
        `);

        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

migrate();
