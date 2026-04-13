const pool = require("../config/db");

const createAssignment = async ({ course_id, title, description, due_date, file_path, is_group_assignment, created_by }) => {
    const query = `
    INSERT INTO assignments (course_id, title, description, due_date, file_path, is_group_assignment, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
    const values = [course_id, title, description, due_date, file_path, is_group_assignment, created_by];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const getAssignmentsByCourse = async (course_id) => {
    const query = `
    SELECT a.*, c.title as course_title 
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.course_id = $1
    ORDER BY a.due_date ASC;
  `;
    const { rows } = await pool.query(query, [course_id]);
    return rows;
};

const submitAssignment = async ({ assignment_id, user_id, group_id, file_path }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Fetch assignment to check due date and group requirements
        const assignRes = await client.query("SELECT due_date, is_group_assignment FROM assignments WHERE id = $1", [assignment_id]);
        if (assignRes.rows.length === 0) throw new Error("Assignment not found");

        const assignment = assignRes.rows[0];
        const isLate = new Date() > new Date(assignment.due_date);

        // 2. Validate user_id or group_id
        if (assignment.is_group_assignment && !group_id) {
            throw new Error("This is a group assignment. A group_id must be provided.");
        }
        if (!assignment.is_group_assignment && !user_id) {
            throw new Error("This is an individual assignment. A user_id must be provided.");
        }

        // 3. Upsert submission (if replacing previous submission, handle logic here, or just insert new row)
        // For simplicity, we just insert.
        const query = `
      INSERT INTO submissions (assignment_id, user_id, group_id, file_path, is_late)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
        const values = [assignment_id, user_id || null, group_id || null, file_path, isLate];
        const { rows } = await client.query(query, values);

        await client.query('COMMIT');
        return rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getSubmissionsByAssignment = async (assignment_id) => {
    const query = `
        SELECT s.*, 
            u.first_name, u.last_name,
            g.name as group_name
        FROM submissions s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN groups g ON s.group_id = g.id
        WHERE s.assignment_id = $1
        ORDER BY s.submission_date DESC;
    `;
    const { rows } = await pool.query(query, [assignment_id]);
    return rows;
};

const gradeSubmission = async ({ submission_id, grade, feedback, graded_by }) => {
    const query = `
        UPDATE submissions
        SET grade = $1, feedback = $2, graded_by = $3, graded_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *;
    `;
    const values = [grade, feedback, graded_by, submission_id];
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) throw new Error("Submission not found");
    return rows[0];
};


module.exports = {
    createAssignment,
    getAssignmentsByCourse,
    submitAssignment,
    getSubmissionsByAssignment,
    gradeSubmission
};
