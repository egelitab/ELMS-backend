const pool = require("./src/config/db");

async function checkDeptCourses() {
    try {
        const res = await pool.query(`
            SELECT c.title, d.name as dept_name 
            FROM courses c 
            JOIN departments d ON c.department_id = d.id 
            WHERE d.name = 'Computer Science'
        `);
        console.log("Courses in Computer Science:");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkDeptCourses();
