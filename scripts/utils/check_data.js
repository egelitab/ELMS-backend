const pool = require('./src/config/db');

async function check() {
    try {
        const courses = await pool.query("SELECT title, instructor_id FROM courses");
        console.log("Current Course Assignments:");
        courses.rows.forEach(c => console.log(`${c.title}: ${c.instructor_id}`));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
