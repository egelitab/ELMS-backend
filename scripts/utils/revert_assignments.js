const pool = require('./src/config/db');

async function revert() {
    try {
        console.log("Reverting instructor assignments for diagnostic courses...");

        // Keep Abebe assigned to his original courses
        const keepTitles = ['Internet programming', 'Analysis of Algorithms'];

        const result = await pool.query(`
            UPDATE courses 
            SET instructor_id = NULL 
            WHERE title NOT ILIKE ANY($1)
        `, [keepTitles.map(t => `%${t}%`)]);

        console.log(`Successfully cleared assignments for ${result.rowCount} courses.`);
        console.log("Internet Programming and Analysis of Algorithms remain assigned to Abebe.");

    } catch (err) {
        console.error("Revert failed:", err);
    } finally {
        await pool.end();
    }
}

revert();
