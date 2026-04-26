const pool = require("./src/config/db");

async function cleanupSections() {
    try {
        console.log("Cleaning up 'section' column in 'users' table...");
        const res = await pool.query(`
            UPDATE users 
            SET section = TRIM(REPLACE(section, 'Section', ''))
            WHERE section ILIKE 'Section%'
        `);
        console.log(`${res.rowCount} rows updated.`);

        // Also cleanup group table and material_shares if they exist
        console.log("Checking groups table...");
        try {
            await pool.query(`
                UPDATE groups 
                SET section = TRIM(REPLACE(section, 'Section', ''))
                WHERE section ILIKE 'Section%'
            `);
        } catch (e) {
            console.log("Groups table update skipped (might not have section column or table doesn't exist yet)");
        }

        console.log("Cleaning up 'title' column in 'schedules' table...");
        await pool.query(`
            UPDATE schedules 
            SET title = REPLACE(title, 'Section Section', 'Section')
            WHERE title LIKE '%Section Section %'
        `);
        console.log("Schedules title cleaned up.");

    } catch (err) {
        console.error("Cleanup failed:", err);
    } finally {
        pool.end();
    }
}

cleanupSections();
