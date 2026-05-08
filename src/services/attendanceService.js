const pool = require("../config/db");

exports.createSession = async (course_id, instructor_id, title, session_date) => {
    const { rows } = await pool.query(
        `INSERT INTO attendance_sessions (course_id, instructor_id, title, session_date)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [course_id, instructor_id, title || `Session ${new Date(session_date).toLocaleDateString()}`, session_date || new Date()]
    );
    return rows[0];
};

exports.getSessions = async (course_id) => {
    const { rows } = await pool.query(
        `SELECT s.*,
            (SELECT COUNT(*)::int FROM attendance_records r WHERE r.session_id = s.id AND r.status = 'present') as present_count,
            (SELECT COUNT(*)::int FROM attendance_records r WHERE r.session_id = s.id AND r.status = 'late') as late_count,
            (SELECT COUNT(*)::int FROM attendance_records r WHERE r.session_id = s.id AND r.status = 'absent') as absent_count,
            (SELECT COUNT(*)::int FROM attendance_records r WHERE r.session_id = s.id) as total_count
         FROM attendance_sessions s
         WHERE s.course_id = $1
         ORDER BY s.session_date DESC`,
        [course_id]
    );
    return rows;
};

exports.getSessionWithRecords = async (session_id) => {
    // Get session info
    const sessionRes = await pool.query(
        "SELECT * FROM attendance_sessions WHERE id = $1", [session_id]
    );
    if (sessionRes.rows.length === 0) throw new Error("Session not found");
    const session = sessionRes.rows[0];

    // Get all enrolled students with their attendance status
    const { rows: records } = await pool.query(
        `SELECT u.id as student_id, u.first_name, u.last_name, u.institutional_id, u.section,
                COALESCE(ar.status, 'unmarked') as status,
                ar.marked_at
         FROM enrollments e
         JOIN users u ON e.user_id = u.id
         LEFT JOIN attendance_records ar ON ar.session_id = $1 AND ar.student_id = u.id
         WHERE e.course_id = $2
         ORDER BY u.last_name, u.first_name`,
        [session_id, session.course_id]
    );

    return { session, records };
};

exports.markAttendance = async (session_id, records) => {
    // records: [{ student_id, status }]
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const record of records) {
            await client.query(
                `INSERT INTO attendance_records (session_id, student_id, status)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (session_id, student_id) 
                 DO UPDATE SET status = $3, marked_at = CURRENT_TIMESTAMP`,
                [session_id, record.student_id, record.status]
            );
        }

        await client.query('COMMIT');
        return { message: "Attendance marked successfully", count: records.length };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

exports.getStudentAttendance = async (student_id, course_id) => {
    const { rows } = await pool.query(
        `SELECT s.session_date, s.title, COALESCE(ar.status, 'absent') as status
         FROM attendance_sessions s
         LEFT JOIN attendance_records ar ON ar.session_id = s.id AND ar.student_id = $1
         WHERE s.course_id = $2
         ORDER BY s.session_date DESC`,
        [student_id, course_id]
    );
    return rows;
};

exports.deleteSession = async (session_id, instructor_id) => {
    const { rows } = await pool.query(
        "DELETE FROM attendance_sessions WHERE id = $1 AND instructor_id = $2 RETURNING *",
        [session_id, instructor_id]
    );
    if (rows.length === 0) throw new Error("Session not found or you don't have permission");
    return rows[0];
};
