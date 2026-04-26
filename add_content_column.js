const pool = require("./src/config/db");

async function addContentColumn() {
    try {
        console.log("Adding content column to schedules...");
        await pool.query("ALTER TABLE schedules ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'");
        console.log("Success!");
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

addContentColumn();
