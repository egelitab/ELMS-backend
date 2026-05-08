const bcrypt = require("bcrypt");
const pool = require("./src/config/db");
const dotenv = require("dotenv");
dotenv.config();

async function updateAdminPassword() {
    const email = "admin@bdu.edu.et";
    const newPassword = "123321";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        const result = await pool.query(
            `UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING *`,
            [hashedPassword, email]
        );

        if (result.rows.length > 0) {
            console.log("Admin password updated successfully!");
            console.log("Email:", email);
            console.log("New Password:", newPassword);
        } else {
            console.log("Admin user not found.");
        }
    } catch (error) {
        console.error("Error updating admin password:", error);
    } finally {
        pool.end();
    }
}

updateAdminPassword();
