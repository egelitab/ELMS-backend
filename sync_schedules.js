const pool = require("./src/config/db");

async function sync() {
    try {
        console.log("Checking and syncing schedules table schema...");
        await pool.query("ALTER TABLE schedules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        console.log("updated_at column added or verified.");
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

sync();
