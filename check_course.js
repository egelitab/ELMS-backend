const pool = require("./src/config/db");

async function checkCourse() {
    try {
        const res = await pool.query(`
            SELECT c.id, c.title, c.course_code, c.year, c.semester, d.name as dept_name 
            FROM courses c 
            JOIN departments d ON c.department_id = d.id 
            WHERE c.title ILIKE '%Internet Programming%'
        `);
        console.log("Matching Courses:");
        console.table(res.rows);
    } catch (err) {
        console.error("Failed to check course:", err);
    } finally {
        pool.end();
    }
}

checkCourse();
