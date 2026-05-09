const pool = require("../src/config/db");

async function migrate() {
    try {
        await pool.query(`
      ALTER TABLE course_goals ADD COLUMN IF NOT EXISTS recurrence VARCHAR(50) DEFAULT 'Weekly';
    `);

        // We can conditionally drop target_date but it might fail if it doesn't exist, so we do it safely:
        try {
            await pool.query(`ALTER TABLE course_goals DROP COLUMN target_date;`);
        } catch (e) { }

        console.log("Table course_goals updated with recurrence.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
