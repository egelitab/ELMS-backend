const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log("Checking if course_chapters table exists...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_chapters (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                order_index INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(course_id, order_index)
            );
        `);
        console.log("course_chapters table ensured.");

        // Also ensure materials table has chapter_id
        console.log("Ensuring chapter_id in materials and material_shares...");
        await pool.query(`
            ALTER TABLE materials ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES course_chapters(id) ON DELETE SET NULL;
            ALTER TABLE material_shares ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES course_chapters(id) ON DELETE SET NULL;
        `);

        console.log("Database migration completed successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
