const pool = require("./src/config/db");

async function checkCols() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'schedules'");
        console.log("Schedules Columns:");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkCols();
