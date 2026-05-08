const pool = require("./src/config/db");

async function run() {
    const res = await pool.query('SELECT name, section, batch_name FROM groups');
    console.log("All groups in database:");
    console.table(res.rows);
    process.exit(0);
}

run().catch(console.error);
