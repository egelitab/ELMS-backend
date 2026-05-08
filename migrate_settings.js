const pool = require("./src/config/db");

const migrateSettings = async () => {
    try {
        console.log("Starting settings migration...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key VARCHAR(255) PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            INSERT INTO system_settings (key, value) VALUES 
            ('current_academic_year', '2025/26'),
            ('current_semester', '2'),
            ('maintenance_mode', 'false'),
            ('allow_registration', 'true')
            ON CONFLICT (key) DO NOTHING;
        `);

        console.log("Settings migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
};

migrateSettings();
