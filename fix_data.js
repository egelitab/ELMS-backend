const pool = require('./src/config/db');

async function fix() {
    try {
        // 1. Get Abebe
        const { rows: instructors } = await pool.query("SELECT id FROM users WHERE email = 'abebe.bekele@bdu.edu.et'");
        if (instructors.length === 0) {
            console.log("Abebe not found. Cannot reassign.");
            return;
        }
        const abebeId = instructors[0].id;
        console.log(`Reassigning all courses to Abebe (ID: ${abebeId})...`);

        // 2. Reassign all courses
        await pool.query("UPDATE courses SET instructor_id = $1", [abebeId]);
        console.log("All courses reassigned.");

        // 3. Reassign all materials
        await pool.query("UPDATE materials SET uploaded_by = $1 WHERE type != 'folder' OR title = 'Uploads'", [abebeId]);
        console.log("Storage items reassigned.");

        // 4. Clear any soft deletes just in case
        await pool.query("UPDATE materials SET is_deleted = false, deleted_at = NULL");
        console.log("Cleared all soft deletes.");

        console.log("Fix completed successfully.");

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

fix();
