const pool = require("../config/db");

const createAnnouncement = async ({ course_id, title, content, posted_by, section, attachments }) => {
    const query = `
        INSERT INTO announcements (course_id, title, content, posted_by, section, attachments)
        VALUES ($1::uuid, $2, $3, $4::uuid, $5, $6::jsonb)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [course_id, title, content, posted_by, section || null, JSON.stringify(attachments || [])]);
    return rows[0];
};

const updateAnnouncement = async (id, { title, content, section, attachments }) => {
    const query = `
        UPDATE announcements
        SET title = $1, content = $2, section = $3, attachments = $4::jsonb, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5::uuid
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [title, content, section || null, JSON.stringify(attachments || []), id]);
    return rows[0];
};

const deleteAnnouncement = async (id) => {
    const query = 'DELETE FROM announcements WHERE id = $1::uuid';
    await pool.query(query, [id]);
};

const getInstructorAnnouncements = async (instructor_id) => {
    const query = `
        SELECT a.*, c.title as course_title, c.course_code
        FROM announcements a
        JOIN courses c ON a.course_id = c.id
        WHERE c.instructor_id = $1::uuid
        ORDER BY a.created_at DESC;
    `;
    const { rows } = await pool.query(query, [instructor_id]);

    // Enrich with file info
    for (const r of rows) {
        if (r.attachments && r.attachments.length > 0) {
            const { rows: files } = await pool.query("SELECT id, title as name, file_path, file_type FROM materials WHERE id = ANY($1::uuid[])", [r.attachments]);
            r.attachment_details = files;
        }
    }
    return rows;
};

const getStudentAnnouncements = async (student_id) => {
    const query = `
        SELECT a.*, c.title as course_title, c.course_code, u.first_name as instructor_first_name, u.last_name as instructor_last_name
        FROM announcements a
        JOIN courses c ON a.course_id = c.id
        JOIN enrollments e ON e.course_id = c.id
        JOIN users s ON e.student_id = s.id
        LEFT JOIN users u ON a.posted_by = u.id
        WHERE e.student_id = $1::uuid AND (a.section IS NULL OR a.section = s.section)
        ORDER BY a.created_at DESC;
    `;
    const { rows } = await pool.query(query, [student_id]);

    for (const r of rows) {
        if (r.attachments && r.attachments.length > 0) {
            const { rows: files } = await pool.query("SELECT id, title as name, file_path, file_type FROM materials WHERE id = ANY($1::uuid[])", [r.attachments]);
            r.attachment_details = files;
        }
    }
    return rows;
};

module.exports = {
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getInstructorAnnouncements,
    getStudentAnnouncements
};
