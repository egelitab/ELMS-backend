const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/Eku/Documents/GitHub/ELMS-backend/.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
});

async function query() {
    try {
        const deptRes = await pool.query("SELECT id, name FROM departments WHERE name ILIKE '%Computer Science%'");
        if (deptRes.rows.length === 0) {
            console.log("Department not found.");
            return;
        }

        const deptId = deptRes.rows[0].id;
        const sectRes = await pool.query("SELECT DISTINCT section FROM users WHERE department_id = $1 AND section IS NOT NULL", [deptId]);

        console.log(`Department: ${deptRes.rows[0].name}`);
        console.log(`Sections: ${sectRes.rows.map(r => r.section).join(', ')}`);
        console.log(`Count: ${sectRes.rows.length}`);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

query();
