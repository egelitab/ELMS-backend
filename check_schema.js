const pool = require('./src/config/db');

async function check() {
    try {
        const tables = ['enrollments', 'materials', 'course_chapters', 'material_shares'];
        for (const table of tables) {
            const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
            console.log(`${table} columns:`, res.rows.map(r => r.column_name));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
