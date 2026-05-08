const pool = require("../config/db");

const enrollStudent = async (course_id, user_id) => {
    // Check if already enrolled
    const existing = await pool.query(
        "SELECT id FROM enrollments WHERE course_id = $1 AND user_id = $2",
        [course_id, user_id]
    );
    if (existing.rows.length > 0) {
        throw new Error("Student is already enrolled in this course");
    }

    // Check that user is a student
    const userRes = await pool.query("SELECT role FROM users WHERE id = $1", [user_id]);
    if (userRes.rows.length === 0) throw new Error("User not found");
    if (userRes.rows[0].role !== 'student') throw new Error("Only students can be enrolled");

    const { rows } = await pool.query(
        "INSERT INTO enrollments (course_id, user_id) VALUES ($1, $2) RETURNING *",
        [course_id, user_id]
    );
    return rows[0];
};

const unenrollStudent = async (course_id, user_id) => {
    const { rows } = await pool.query(
        "DELETE FROM enrollments WHERE course_id = $1 AND user_id = $2 RETURNING *",
        [course_id, user_id]
    );
    if (rows.length === 0) throw new Error("Enrollment not found");
    return rows[0];
};

const getEnrollmentsByCourse = async (course_id) => {
    const { rows } = await pool.query(
        `SELECT e.id, e.enrolled_at,
            u.id as user_id, u.first_name, u.last_name, u.email,
            u.institutional_id, u.section, u.year,
            d.name as department_name
         FROM enrollments e
         JOIN users u ON e.user_id = u.id
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE e.course_id = $1
         ORDER BY u.last_name, u.first_name`,
        [course_id]
    );
    return rows;
};

const bulkEnroll = async (course_id, user_ids) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const results = [];
        const errors = [];

        for (const user_id of user_ids) {
            try {
                const existing = await client.query(
                    "SELECT id FROM enrollments WHERE course_id = $1 AND user_id = $2",
                    [course_id, user_id]
                );
                if (existing.rows.length > 0) {
                    errors.push({ user_id, error: "Already enrolled" });
                    continue;
                }

                const { rows } = await client.query(
                    "INSERT INTO enrollments (course_id, user_id) VALUES ($1, $2) RETURNING *",
                    [course_id, user_id]
                );
                results.push(rows[0]);
            } catch (err) {
                errors.push({ user_id, error: err.message });
            }
        }

        await client.query('COMMIT');
        return { enrolled: results, errors };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const bulkEnrollByDepartment = async (course_id, department_id, year, section) => {
    let query = "SELECT id FROM users WHERE role = 'student' AND department_id = $1";
    const params = [department_id];

    if (year) {
        params.push(year);
        query += ` AND year = $${params.length}`;
    }
    if (section) {
        params.push(section);
        query += ` AND section = $${params.length}`;
    }

    const { rows: students } = await pool.query(query, params);

    if (students.length === 0) {
        throw new Error("No matching students found");
    }

    return await bulkEnroll(course_id, students.map(s => s.id));
};

module.exports = {
    enrollStudent,
    unenrollStudent,
    getEnrollmentsByCourse,
    bulkEnroll,
    bulkEnrollByDepartment,
};
