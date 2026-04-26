const pool = require("./src/config/db");

async function checkCSY3S1() {
    try {
        const res = await pool.query(`
            SELECT c.title, c.year, c.semester 
            FROM courses c 
            JOIN departments d ON c.department_id = d.id 
            WHERE d.name = 'Computer Science' AND c.year = 3 AND c.semester = 1
        `);
        console.log("CS Year 3 Sem 1 Courses:");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkCSY3S1();
