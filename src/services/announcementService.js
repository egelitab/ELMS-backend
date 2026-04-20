const pool = require("../config/db");

const createAnnouncement = async ({ course_id, title, content, posted_by }) => {
    const query = `
        INSERT INTO announcements (course_id, title, content, posted_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [course_id, title, content, posted_by]);
    return rows[0];
};

const getInstructorAnnouncements = async (instructor_id) => {
    const query = `
        SELECT a.*, c.title as course_title, c.course_code
        FROM announcements a
        JOIN courses c ON a.course_id = c.id
        WHERE c.instructor_id = $1
        ORDER BY a.created_at DESC;
    `;
    const { rows } = await pool.query(query, [instructor_id]);
    return rows;
};

const getStudentAnnouncements = async (student_id) => {
    const query = `
        SELECT a.*, c.title as course_title, c.course_code, u.first_name as instructor_first_name, u.last_name as instructor_last_name
        FROM announcements a
        JOIN courses c ON a.course_id = c.id
        JOIN enrollments e ON e.course_id = c.id
        LEFT JOIN users u ON a.posted_by = u.id
        WHERE e.student_id = $1
        ORDER BY a.created_at DESC;
    `;
    const { rows } = await pool.query(query, [student_id]);
    return rows;
};

module.exports = {
    createAnnouncement,
    getInstructorAnnouncements,
    getStudentAnnouncements
};
