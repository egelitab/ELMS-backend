const bcrypt = require("bcrypt");
const pool = require("./src/config/db");
const dotenv = require("dotenv");
dotenv.config();

async function seedAdmin() {
    const email = "admin@bdu.edu.et";
    const password = "admin_password_2024";
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
            ["System", "Admin", email, hashedPassword, "admin"]
        );

        if (result.rows.length > 0) {
            console.log("Admin user created successfully!");
            console.log("Email:", email);
            console.log("Password:", password);
        } else {
            console.log("Admin user already exists or could not be created.");
        }
    } catch (error) {
        console.error("Error seeding admin:", error);
    } finally {
        pool.end();
    }
}

seedAdmin();
