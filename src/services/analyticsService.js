const pool = require("../config/db");

// ==========================================
// STUDENT ANALYTICS
// ==========================================

exports.getStudentOverview = async (studentId) => {
    const client = await pool.connect();
    try {
        // Enrolled courses count
        const { rows: courseRows } = await client.query(
            "SELECT COUNT(*)::int as count FROM enrollments WHERE user_id = $1", [studentId]
        );

        // Completed assignments (submissions)
        const { rows: submissionRows } = await client.query(
            "SELECT COUNT(*)::int as count FROM submissions WHERE student_id = $1", [studentId]
        );

        // Pending assignments (no submission yet)
        const { rows: pendingRows } = await client.query(
            `SELECT COUNT(*)::int as count FROM assignments a
             JOIN enrollments e ON a.course_id = e.course_id AND e.user_id = $1
             WHERE NOT EXISTS (SELECT 1 FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = $1)`,
            [studentId]
        );

        // Average grade
        const { rows: gradeRows } = await client.query(
            `SELECT COALESCE(AVG(g.points_earned::float / NULLIF(g.total_points, 0) * 100), 0) as avg_grade
             FROM grades g WHERE g.student_id = $1 AND g.total_points > 0`,
            [studentId]
        );

        // Attendance rate
        const { rows: attendanceRows } = await client.query(
            `SELECT 
                COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::int as present,
                COUNT(CASE WHEN ar.status = 'late' THEN 1 END)::int as late,
                COUNT(*)::int as total
             FROM attendance_records ar WHERE ar.student_id = $1`,
            [studentId]
        );

        // Quiz stats
        const { rows: quizRows } = await client.query(
            `SELECT COUNT(*)::int as attempts,
                    COALESCE(AVG(CASE WHEN total_points > 0 THEN score::float / total_points * 100 END), 0) as avg_score
             FROM quiz_attempts WHERE student_id = $1 AND status = 'submitted'`,
            [studentId]
        );

        const att = attendanceRows[0];
        const attendanceRate = att.total > 0 ? ((att.present + att.late) / att.total * 100) : 0;

        return {
            courses_enrolled: courseRows[0].count,
            assignments_completed: submissionRows[0].count,
            assignments_pending: pendingRows[0].count,
            average_grade: parseFloat(gradeRows[0].avg_grade).toFixed(1),
            attendance_rate: parseFloat(attendanceRate).toFixed(1),
            attendance_present: att.present,
            attendance_late: att.late,
            attendance_total: att.total,
            quiz_attempts: quizRows[0].attempts,
            quiz_avg_score: parseFloat(quizRows[0].avg_score).toFixed(1),
        };
    } finally {
        client.release();
    }
};

exports.getStudentGradesByCourse = async (studentId) => {
    const { rows } = await pool.query(
        `SELECT c.title as course_title, c.course_code,
                COUNT(g.id)::int as graded_count,
                COALESCE(AVG(g.points_earned::float / NULLIF(g.total_points, 0) * 100), 0) as avg_grade
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         LEFT JOIN grades g ON g.student_id = $1 AND g.course_id = c.id AND g.total_points > 0
         WHERE e.user_id = $1
         GROUP BY c.id, c.title, c.course_code
         ORDER BY c.title`,
        [studentId]
    );
    return rows.map(r => ({ ...r, avg_grade: parseFloat(r.avg_grade).toFixed(1) }));
};

// ==========================================
// INSTRUCTOR ANALYTICS
// ==========================================

exports.getInstructorOverview = async (instructorId) => {
    const client = await pool.connect();
    try {
        // Courses taught
        const { rows: courseRows } = await client.query(
            "SELECT COUNT(*)::int as count FROM courses WHERE instructor_id = $1", [instructorId]
        );

        // Total enrolled students
        const { rows: enrollRows } = await client.query(
            `SELECT COUNT(DISTINCT e.user_id)::int as count
             FROM enrollments e JOIN courses c ON e.course_id = c.id
             WHERE c.instructor_id = $1`,
            [instructorId]
        );

        // Total assignments created
        const { rows: assignRows } = await client.query(
            `SELECT COUNT(*)::int as count FROM assignments a
             JOIN courses c ON a.course_id = c.id WHERE c.instructor_id = $1`,
            [instructorId]
        );

        // Submissions received
        const { rows: subRows } = await client.query(
            `SELECT COUNT(*)::int as count FROM submissions s
             JOIN assignments a ON s.assignment_id = a.id
             JOIN courses c ON a.course_id = c.id WHERE c.instructor_id = $1`,
            [instructorId]
        );

        // Quizzes created
        const { rows: quizRows } = await client.query(
            "SELECT COUNT(*)::int as count FROM quizzes WHERE created_by = $1", [instructorId]
        );

        // Attendance sessions
        const { rows: attRows } = await client.query(
            "SELECT COUNT(*)::int as count FROM attendance_sessions WHERE instructor_id = $1", [instructorId]
        );

        // Materials uploaded
        const { rows: matRows } = await client.query(
            "SELECT COUNT(*)::int as count FROM materials WHERE uploaded_by = $1", [instructorId]
        );

        return {
            courses_taught: courseRows[0].count,
            total_students: enrollRows[0].count,
            assignments_created: assignRows[0].count,
            submissions_received: subRows[0].count,
            quizzes_created: quizRows[0].count,
            attendance_sessions: attRows[0].count,
            materials_uploaded: matRows[0].count,
        };
    } finally {
        client.release();
    }
};

exports.getCourseAnalytics = async (courseId) => {
    const client = await pool.connect();
    try {
        // Enrollment count
        const { rows: enrollRows } = await client.query(
            "SELECT COUNT(*)::int as count FROM enrollments WHERE course_id = $1", [courseId]
        );

        // Assignment submission rate
        const { rows: assignStats } = await client.query(
            `SELECT 
                COUNT(DISTINCT a.id)::int as assignment_count,
                COUNT(DISTINCT s.id)::int as submission_count
             FROM assignments a
             LEFT JOIN submissions s ON s.assignment_id = a.id
             WHERE a.course_id = $1`,
            [courseId]
        );

        // Average grade for this course
        const { rows: gradeStats } = await client.query(
            `SELECT COALESCE(AVG(g.points_earned::float / NULLIF(g.total_points, 0) * 100), 0) as avg_grade
             FROM grades g WHERE g.course_id = $1 AND g.total_points > 0`,
            [courseId]
        );

        // Attendance overview
        const { rows: attStats } = await client.query(
            `SELECT 
                COUNT(DISTINCT s.id)::int as session_count,
                COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::int as present_total,
                COUNT(CASE WHEN ar.status = 'late' THEN 1 END)::int as late_total,
                COUNT(CASE WHEN ar.status = 'absent' THEN 1 END)::int as absent_total
             FROM attendance_sessions s
             LEFT JOIN attendance_records ar ON ar.session_id = s.id
             WHERE s.course_id = $1`,
            [courseId]
        );

        // Quiz performance
        const { rows: quizStats } = await client.query(
            `SELECT COUNT(DISTINCT q.id)::int as quiz_count,
                    COALESCE(AVG(CASE WHEN qa.total_points > 0 THEN qa.score::float / qa.total_points * 100 END), 0) as avg_quiz_score
             FROM quizzes q
             LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.status = 'submitted'
             WHERE q.course_id = $1`,
            [courseId]
        );

        // Top performers (top 5 by average grade)
        const { rows: topStudents } = await client.query(
            `SELECT u.first_name, u.last_name,
                    COALESCE(AVG(g.points_earned::float / NULLIF(g.total_points, 0) * 100), 0) as avg_grade
             FROM enrollments e
             JOIN users u ON e.user_id = u.id
             LEFT JOIN grades g ON g.student_id = u.id AND g.course_id = $1 AND g.total_points > 0
             WHERE e.course_id = $1
             GROUP BY u.id, u.first_name, u.last_name
             HAVING COUNT(g.id) > 0
             ORDER BY avg_grade DESC LIMIT 5`,
            [courseId]
        );

        const att = attStats[0];
        return {
            enrolled_students: enrollRows[0].count,
            assignment_count: assignStats[0].assignment_count,
            submission_count: assignStats[0].submission_count,
            average_grade: parseFloat(gradeStats[0].avg_grade).toFixed(1),
            session_count: att.session_count,
            attendance_present: att.present_total,
            attendance_late: att.late_total,
            attendance_absent: att.absent_total,
            quiz_count: quizStats[0].quiz_count,
            avg_quiz_score: parseFloat(quizStats[0].avg_quiz_score).toFixed(1),
            top_students: topStudents.map(s => ({
                name: `${s.first_name} ${s.last_name}`,
                avg_grade: parseFloat(s.avg_grade).toFixed(1)
            })),
        };
    } finally {
        client.release();
    }
};
