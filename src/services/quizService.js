const pool = require("../config/db");
const notificationService = require("./notificationService");

// ==========================================
// INSTRUCTOR METHODS
// ==========================================

exports.createQuiz = async ({ course_id, title, description, duration_minutes, max_attempts, created_by }) => {
    const { rows } = await pool.query(
        `INSERT INTO quizzes (course_id, title, description, duration_minutes, max_attempts, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [course_id, title, description, duration_minutes || 30, max_attempts || 1, created_by]
    );
    return rows[0];
};

exports.addQuestion = async (quiz_id, { question_text, question_type, points, order_index, options }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows: questionRows } = await client.query(
            `INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [quiz_id, question_text, question_type || 'multiple_choice', points || 1, order_index || 0]
        );
        const question = questionRows[0];

        // Insert options if provided (for multiple_choice and true_false)
        if (options && options.length > 0) {
            for (const opt of options) {
                await client.query(
                    `INSERT INTO quiz_options (question_id, option_text, is_correct)
                     VALUES ($1, $2, $3)`,
                    [question.id, opt.option_text, opt.is_correct || false]
                );
            }
        }

        await client.query('COMMIT');

        // Fetch complete question with options
        const { rows: optRows } = await pool.query(
            "SELECT * FROM quiz_options WHERE question_id = $1", [question.id]
        );
        question.options = optRows;
        return question;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

exports.getQuizWithQuestions = async (quiz_id) => {
    const { rows: quizRows } = await pool.query("SELECT * FROM quizzes WHERE id = $1", [quiz_id]);
    if (quizRows.length === 0) throw new Error("Quiz not found");
    const quiz = quizRows[0];

    const { rows: questions } = await pool.query(
        "SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index ASC",
        [quiz_id]
    );

    for (const q of questions) {
        const { rows: options } = await pool.query(
            "SELECT * FROM quiz_options WHERE question_id = $1", [q.id]
        );
        q.options = options;
    }

    quiz.questions = questions;
    return quiz;
};

exports.getQuizzesByCourse = async (course_id, includeUnpublished = false) => {
    let query = `SELECT q.*, 
        (SELECT COUNT(*)::int FROM quiz_questions qq WHERE qq.quiz_id = q.id) as question_count,
        (SELECT COUNT(DISTINCT qa.student_id)::int FROM quiz_attempts qa WHERE qa.quiz_id = q.id) as attempt_count
        FROM quizzes q WHERE q.course_id = $1`;

    if (!includeUnpublished) {
        query += " AND q.is_published = true";
    }
    query += " ORDER BY q.created_at DESC";

    const { rows } = await pool.query(query, [course_id]);
    return rows;
};

exports.publishQuiz = async (quiz_id, instructor_id) => {
    const { rows } = await pool.query(
        "UPDATE quizzes SET is_published = true WHERE id = $1 AND created_by = $2 RETURNING *",
        [quiz_id, instructor_id]
    );
    if (rows.length === 0) throw new Error("Quiz not found or permission denied");

    // Notify enrolled students
    try {
        const quiz = rows[0];
        const { rows: students } = await pool.query(
            "SELECT user_id FROM enrollments WHERE course_id = $1", [quiz.course_id]
        );
        const { rows: courseInfo } = await pool.query(
            "SELECT title FROM courses WHERE id = $1", [quiz.course_id]
        );
        await notificationService.createNotificationsBatch({
            userIds: students.map(s => s.user_id),
            type: 'info',
            title: `New Quiz in ${courseInfo[0]?.title || 'Course'}`,
            content: quiz.title,
            relatedId: quiz.id,
        });
    } catch (err) {
        console.error("Failed to notify students about quiz:", err);
    }

    return rows[0];
};

exports.deleteQuiz = async (quiz_id, instructor_id) => {
    const { rows } = await pool.query(
        "DELETE FROM quizzes WHERE id = $1 AND created_by = $2 RETURNING *",
        [quiz_id, instructor_id]
    );
    if (rows.length === 0) throw new Error("Quiz not found or permission denied");
    return rows[0];
};

exports.deleteQuestion = async (question_id) => {
    const { rows } = await pool.query(
        "DELETE FROM quiz_questions WHERE id = $1 RETURNING *", [question_id]
    );
    if (rows.length === 0) throw new Error("Question not found");
    return rows[0];
};

// ==========================================
// STUDENT METHODS
// ==========================================

exports.startAttempt = async (quiz_id, student_id) => {
    // Check if quiz is published
    const { rows: quizRows } = await pool.query(
        "SELECT * FROM quizzes WHERE id = $1 AND is_published = true", [quiz_id]
    );
    if (quizRows.length === 0) throw new Error("Quiz not found or not published");
    const quiz = quizRows[0];

    // Check attempt count
    const { rows: attempts } = await pool.query(
        "SELECT COUNT(*)::int as count FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2 AND status = 'submitted'",
        [quiz_id, student_id]
    );
    if (attempts[0].count >= quiz.max_attempts) {
        throw new Error(`Maximum attempts (${quiz.max_attempts}) reached`);
    }

    // Check for existing in-progress attempt
    const { rows: inProgress } = await pool.query(
        "SELECT * FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2 AND status = 'in_progress'",
        [quiz_id, student_id]
    );
    if (inProgress.length > 0) return inProgress[0];

    // Create new attempt
    const { rows } = await pool.query(
        `INSERT INTO quiz_attempts (quiz_id, student_id) VALUES ($1, $2) RETURNING *`,
        [quiz_id, student_id]
    );
    return rows[0];
};

exports.submitAttempt = async (attempt_id, answers) => {
    // answers: [{ question_id, selected_option_id, text_answer }]
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verify attempt exists and is in progress
        const { rows: attemptRows } = await client.query(
            "SELECT * FROM quiz_attempts WHERE id = $1 AND status = 'in_progress'", [attempt_id]
        );
        if (attemptRows.length === 0) throw new Error("Attempt not found or already submitted");

        let totalScore = 0;
        let totalPoints = 0;

        for (const answer of answers) {
            let isCorrect = false;
            let pointsEarned = 0;

            // Get question info
            const { rows: qRows } = await client.query(
                "SELECT * FROM quiz_questions WHERE id = $1", [answer.question_id]
            );
            if (qRows.length === 0) continue;
            const question = qRows[0];
            totalPoints += question.points;

            // Auto-grade for multiple_choice and true_false
            if (answer.selected_option_id && (question.question_type === 'multiple_choice' || question.question_type === 'true_false')) {
                const { rows: optRows } = await client.query(
                    "SELECT is_correct FROM quiz_options WHERE id = $1", [answer.selected_option_id]
                );
                if (optRows.length > 0 && optRows[0].is_correct) {
                    isCorrect = true;
                    pointsEarned = question.points;
                }
            }

            totalScore += pointsEarned;

            await client.query(
                `INSERT INTO quiz_answers (attempt_id, question_id, selected_option_id, text_answer, is_correct, points_earned)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [attempt_id, answer.question_id, answer.selected_option_id || null, answer.text_answer || null, isCorrect, pointsEarned]
            );
        }

        // Update attempt
        const { rows: updated } = await client.query(
            `UPDATE quiz_attempts 
             SET submitted_at = CURRENT_TIMESTAMP, score = $1, total_points = $2, status = 'submitted'
             WHERE id = $3 RETURNING *`,
            [totalScore, totalPoints, attempt_id]
        );

        await client.query('COMMIT');
        return updated[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

exports.getStudentAttempts = async (quiz_id, student_id) => {
    const { rows } = await pool.query(
        `SELECT * FROM quiz_attempts 
         WHERE quiz_id = $1 AND student_id = $2 
         ORDER BY started_at DESC`,
        [quiz_id, student_id]
    );
    return rows;
};

exports.getAttemptDetail = async (attempt_id) => {
    const { rows: attemptRows } = await pool.query(
        "SELECT * FROM quiz_attempts WHERE id = $1", [attempt_id]
    );
    if (attemptRows.length === 0) throw new Error("Attempt not found");
    const attempt = attemptRows[0];

    const { rows: answers } = await pool.query(
        `SELECT qa.*, qq.question_text, qq.question_type, qq.points,
                qo.option_text as selected_option_text
         FROM quiz_answers qa
         JOIN quiz_questions qq ON qa.question_id = qq.id
         LEFT JOIN quiz_options qo ON qa.selected_option_id = qo.id
         WHERE qa.attempt_id = $1
         ORDER BY qq.order_index`,
        [attempt_id]
    );

    attempt.answers = answers;
    return attempt;
};
