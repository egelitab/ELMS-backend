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
        const res = await pool.query(`
      SELECT DISTINCT u.section, d.name as dept_name
      FROM users u 
      JOIN departments d ON u.department_id = d.id 
      WHERE (d.name ILIKE '%Computer Science%' OR d.name ILIKE '%Information System%')
      AND u.role = 'student'
      ORDER BY d.name, u.section
    `);
        console.log("Sections by Department:");
        res.rows.forEach(r => console.log(` - ${r.dept_name}: ${r.section}`));

        const internetEnrolls = await pool.query(`
      SELECT DISTINCT u.section, d.name as dept_name
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN departments d ON u.department_id = d.id
      JOIN courses c ON e.course_id = c.id
      WHERE c.title ILIKE '%Internet programming%'
    `);
        console.log("\nActual Sections Enrolled in Internet Programming:");
        internetEnrolls.rows.forEach(r => console.log(` - ${r.dept_name}: ${r.section}`));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
