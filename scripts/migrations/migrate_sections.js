const pool = require("./src/config/db");

async function migrate() {
    try {
        console.log("Adding 'sections' column to 'schedules' table...");
        await pool.query("ALTER TABLE schedules ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'");
        console.log("Column added successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

migrate();
