const pool = require('./src/config/db');

async function createTable() {
    try {
        console.log("Creating academic_calendars table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS academic_calendars (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Table created successfully.");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        pool.end();
    }
}

createTable();
