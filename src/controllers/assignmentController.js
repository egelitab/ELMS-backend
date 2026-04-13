const assignmentService = require("../services/assignmentService");

// ------------------------
// INSTRUCTOR ACTIONS
// ------------------------

exports.createAssignment = async (req, res) => {
    try {
        const { course_id, title, description, due_date, is_group_assignment } = req.body;
        let file_path = req.file ? `/uploads/${req.file.filename}` : null;

        if (!course_id || !title || !due_date) {
            return res.status(400).json({ success: false, message: "Course ID, title, and due_date are required" });
        }

        const assignment = await assignmentService.createAssignment({
            course_id, title, description, due_date, file_path,
            is_group_assignment: is_group_assignment === 'true' || is_group_assignment === true,
            created_by: req.user.id
        });

        res.status(201).json({ success: true, data: assignment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAssignments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const assignments = await assignmentService.getAssignmentsByCourse(courseId);
        res.json({ success: true, data: assignments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.viewSubmissions = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const submissions = await assignmentService.getSubmissionsByAssignment(assignmentId);
        res.json({ success: true, data: submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.gradeSubmission = async (req, res) => {
    try {
        const { id } = req.params; // submission id
        const { grade, feedback } = req.body;

        const submission = await assignmentService.gradeSubmission({
            submission_id: id,
            grade,
            feedback,
            graded_by: req.user.id
        });

        res.json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getGradingOverview = async (req, res) => {
    try {
        const overview = await assignmentService.getGradingOverview(req.user.id);
        res.json({ success: true, data: overview });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}


// ------------------------
// STUDENT ACTIONS
// ------------------------

exports.submitAssignment = async (req, res) => {
    try {
        const { assignment_id, group_id } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "A file must be uploaded for submission." });
        }

        const submission = await assignmentService.submitAssignment({
            assignment_id,
            user_id: req.user.role === 'student' ? req.user.id : null,
            group_id: group_id || null, // Provided if it's a group submission
            file_path: `/uploads/${req.file.filename}`
        });

        res.status(201).json({ success: true, message: "Assignment submitted successfully", data: submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
