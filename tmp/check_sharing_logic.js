const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/Eku/Documents/GitHub/ELMS-backend/.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
});

async function check() {
    try {
        // 1. Total students in Section B
        const bCount = await pool.query("SELECT count(*) FROM users WHERE section = 'Section B' AND role = 'student'");
        console.log(`Total students in Section B: ${bCount.rows[0].count}`);

        // 2. Enrollments for Section B students
        const enrolls = await pool.query(`
      SELECT DISTINCT c.title, c.instructor_id, u.first_name || ' ' || u.last_name as instructor_name
      FROM enrollments e 
      JOIN users s ON e.student_id = s.id 
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.instructor_id = u.id
      WHERE s.section = 'Section B'
    `);

        console.log("\nSection B students are enrolled in these courses:");
        if (enrolls.rows.length === 0) {
            console.log(" - None (No enrollments for Section B students found!)");
        }
        enrolls.rows.forEach(r => {
            console.log(` - ${r.title} (Instructor: ${r.instructor_name})`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
