const pool = require("./src/config/db");

async function patch() {
    try {
        const cs = await pool.query("SELECT id FROM departments WHERE name = 'Computer Science'");
        const is = await pool.query("SELECT id FROM departments WHERE name = 'Information System'");

        if (cs.rows.length > 0 && is.rows.length > 0) {
            const csId = cs.rows[0].id;
            const isId = is.rows[0].id;

            console.log(`CS ID: ${csId}, IS ID: ${isId}`);

            await pool.query(`
                UPDATE courses 
                SET department_ids = jsonb_build_array($1::uuid, $2::uuid)
                WHERE title ILIKE '%Internet Programming%'
            `, [csId, isId]);

            console.log("Internet Programming course updated to include CS and IS departments.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

patch();
