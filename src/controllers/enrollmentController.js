const enrollmentService = require("../services/enrollmentService");
const { logActivity } = require("../services/activityLogger");

exports.enrollStudent = async (req, res) => {
    try {
        const { course_id, user_id } = req.body;
        if (!course_id || !user_id) {
            return res.status(400).json({ success: false, message: "course_id and user_id are required" });
        }
        const enrollment = await enrollmentService.enrollStudent(course_id, user_id);
        await logActivity(req.user.id, 'ENROLL_STUDENT', enrollment.id, 'enrollment');
        res.status(201).json({ success: true, data: enrollment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.unenrollStudent = async (req, res) => {
    try {
        const { course_id, user_id } = req.body;
        if (!course_id || !user_id) {
            return res.status(400).json({ success: false, message: "course_id and user_id are required" });
        }
        await enrollmentService.unenrollStudent(course_id, user_id);
        await logActivity(req.user.id, 'UNENROLL_STUDENT', user_id, 'enrollment');
        res.json({ success: true, message: "Student unenrolled successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getEnrollmentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const enrollments = await enrollmentService.getEnrollmentsByCourse(courseId);
        res.json({ success: true, data: enrollments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.bulkEnroll = async (req, res) => {
    try {
        const { course_id, user_ids } = req.body;
        if (!course_id || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ success: false, message: "course_id and user_ids array are required" });
        }
        const result = await enrollmentService.bulkEnroll(course_id, user_ids);
        await logActivity(req.user.id, 'BULK_ENROLL', course_id, 'enrollment');
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.bulkEnrollByDepartment = async (req, res) => {
    try {
        const { course_id, department_id, year, section } = req.body;
        if (!course_id || !department_id) {
            return res.status(400).json({ success: false, message: "course_id and department_id are required" });
        }
        const result = await enrollmentService.bulkEnrollByDepartment(course_id, department_id, year, section);
        await logActivity(req.user.id, 'BULK_ENROLL_DEPT', course_id, 'enrollment');
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
