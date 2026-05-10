const pool = require("../config/db");

exports.createGoal = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description, target_hours, target_score, recurrence } = req.body;

        const course = await pool.query("SELECT * FROM courses WHERE id = $1 AND instructor_id = $2", [courseId, req.user.id]);
        if (course.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized to add goals to this course" });
        }

        const newGoal = await pool.query(
            `INSERT INTO course_goals (course_id, title, description, target_hours, target_score, recurrence)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [courseId, title, description, target_hours || null, target_score || null, recurrence || 'Weekly']
        );

        res.status(201).json({ success: true, goal: newGoal.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.updateGoal = async (req, res) => {
    try {
        const { goalId } = req.params;
        const { title, description, target_hours, target_score, recurrence } = req.body;

        const goal = await pool.query("SELECT * FROM course_goals WHERE id = $1", [goalId]);
        if (goal.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Goal not found" });
        }

        const course = await pool.query("SELECT * FROM courses WHERE id = $1 AND instructor_id = $2", [goal.rows[0].course_id, req.user.id]);
        if (course.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const updatedGoal = await pool.query(
            `UPDATE course_goals 
       SET title = $1, description = $2, target_hours = $3, target_score = $4, recurrence = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
            [title, description, target_hours || null, target_score || null, recurrence || 'Weekly', goalId]
        );

        res.json({ success: true, goal: updatedGoal.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getGoalsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const goals = await pool.query("SELECT * FROM course_goals WHERE course_id = $1 ORDER BY created_at DESC", [courseId]);
        res.json(goals.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getMyGoals = async (req, res) => {
    try {
        const goals = await pool.query(`
            SELECT cg.*, c.title as course_title,
            ROUND((
                SELECT COALESCE(SUM(duration_seconds) / 3600.0, 0)
                FROM reading_logs rl
                WHERE rl.course_id = cg.course_id 
                  AND rl.user_id = e.user_id
                  AND rl.created_at >= CASE 
                      WHEN cg.recurrence = 'Daily' THEN date_trunc('day', current_date)
                      WHEN cg.recurrence = 'Monthly' THEN date_trunc('month', current_date)
                      ELSE date_trunc('week', current_date)
                  END
            ), 1) as progress_hours
            FROM course_goals cg 
            JOIN enrollments e ON cg.course_id = e.course_id 
            JOIN courses c ON c.id = cg.course_id
            WHERE e.user_id = $1
            ORDER BY cg.created_at DESC
        `, [req.user.id]);
        res.json(goals.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.logReading = async (req, res) => {
    try {
        const { courseId, materialId, durationSeconds } = req.body;
        await pool.query(
            "INSERT INTO reading_logs (user_id, course_id, material_id, duration_seconds) VALUES ($1, $2, $3, $4)",
            [req.user.id, courseId, materialId, durationSeconds]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.deleteGoal = async (req, res) => {
    try {
        const { goalId } = req.params;
        const goal = await pool.query("SELECT * FROM course_goals WHERE id = $1", [goalId]);
        if (goal.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Goal not found" });
        }

        const course = await pool.query("SELECT * FROM courses WHERE id = $1 AND instructor_id = $2", [goal.rows[0].course_id, req.user.id]);
        if (course.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        await pool.query("DELETE FROM course_goals WHERE id = $1", [goalId]);
        res.json({ success: true, message: "Goal deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getUserStarCount = async (req, res) => {
    try {
        const userId = req.user.id;
        // Logic: Count stars for each goal where progress >= 50% (1 star), 75% (2nd star), 100% (3rd star)
        const result = await pool.query(`
            WITH progress_data AS (
                SELECT cg.id, cg.target_hours, 
                (
                    SELECT COALESCE(SUM(duration_seconds) / 3600.0, 0)
                    FROM reading_logs rl
                    WHERE rl.course_id = cg.course_id 
                      AND rl.user_id = $1
                      AND rl.created_at >= CASE 
                          WHEN cg.recurrence = 'Daily' THEN date_trunc('day', current_date)
                          WHEN cg.recurrence = 'Monthly' THEN date_trunc('month', current_date)
                          ELSE date_trunc('week', current_date)
                      END
                ) as progress_hours
                FROM course_goals cg
                JOIN enrollments e ON cg.course_id = e.course_id
                WHERE e.user_id = $1
            )
            SELECT 
                SUM(CASE WHEN target_hours > 0 AND progress_hours >= (target_hours * 1.0) THEN 3
                         WHEN target_hours > 0 AND progress_hours >= (target_hours * 0.75) THEN 2
                         WHEN target_hours > 0 AND progress_hours >= (target_hours * 0.5) THEN 1
                         ELSE 0 END) as total_stars
            FROM progress_data
        `, [userId]);

        res.json({ success: true, total_stars: parseInt(result.rows[0].total_stars || 0) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
