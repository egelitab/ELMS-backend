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
