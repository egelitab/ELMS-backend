const pool = require('./src/config/db');

async function fix() {
    try {
        const { rows: instructors } = await pool.query("SELECT id FROM users WHERE email = 'abebe.bekele@bdu.edu.et'");
        if (instructors.length > 0) {
            const abebeId = instructors[0].id;
            await pool.query("UPDATE courses SET instructor_id = $1 WHERE title ILIKE '%Internet programming%' OR title ILIKE '%Analysis of Algorithms%'", [abebeId]);
            console.log("Abebe's courses restored.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

fix();
