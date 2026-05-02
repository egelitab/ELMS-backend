const pool = require("./src/config/db");

async function run() {
    const user_id = 'de2911e3-feff-4d00-8425-8a1dcbdca10b';

    const userQ = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);
    console.log("Fikre Information:", userQ.rows[0]);

    const enrolls = await pool.query(`
    SELECT e.course_id, c.title, c.course_code 
    FROM enrollments e 
    JOIN courses c ON e.course_id = c.id
    WHERE e.user_id = $1
  `, [user_id]);
    console.log("Fikre Enrollments:", enrolls.rows);

    process.exit(0);
}

run().catch(console.error);
