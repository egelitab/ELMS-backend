const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.getAllUsers = async () => {
    const result = await pool.query(`
    SELECT u.id, u.institutional_id, u.title, u.first_name, u.middle_name, u.last_name, u.email, u.role, u.is_active, 
           u.year, u.section, d.name as department_name, f.name as faculty_name, u.department_id 
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN faculties f ON d.faculty_id = f.id
    ORDER BY u.created_at DESC
  `);
    return result.rows;
};

exports.createUser = async (data) => {
    let { institutional_id, title, first_name, middle_name, last_name, email, role, department_id, password } = data;

    // Default password logic based on institutional_id format + "#"
    if (!password) {
        if (institutional_id) {
            password = institutional_id + "#";
        } else {
            password = "123456"; // Fallback if no institutional_id provided
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle empty variables
    if (!department_id || department_id === "") department_id = null;
    if (!institutional_id || institutional_id === "") institutional_id = null;
    if (!middle_name || middle_name === "") middle_name = null;
    if (!title || title === "") title = null;

    const result = await pool.query(
        `INSERT INTO users (institutional_id, title, first_name, middle_name, last_name, email, password_hash, role, department_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, institutional_id, title, first_name, middle_name, last_name, email, role, is_active, department_id`,
        [institutional_id, title, first_name, middle_name, last_name, email, hashedPassword, role, department_id]
    );

    return result.rows[0];
};

exports.updateUserStatus = async (id, isActive) => {
    const result = await pool.query(
        `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, is_active`,
        [isActive, id]
    );
    if (result.rows.length === 0) throw new Error("User not found");
    return result.rows[0];
};

exports.deleteUser = async (id) => {
    const result = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) throw new Error("User not found");
    return result.rows[0];
};

exports.updateUser = async (id, data) => {
    const { title, first_name, middle_name, last_name, email } = data;

    const result = await pool.query(
        `UPDATE users 
         SET title = COALESCE($1, title), 
             first_name = COALESCE($2, first_name), 
             middle_name = COALESCE($3, middle_name), 
             last_name = COALESCE($4, last_name), 
             email = COALESCE($5, email)
         WHERE id = $6 
         RETURNING id, title, first_name, middle_name, last_name, email, role, department_id`,
        [title, first_name, middle_name, last_name, email, id]
    );

    if (result.rows.length === 0) throw new Error("User not found");
    return result.rows[0];
};
