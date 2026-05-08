const analyticsService = require("../services/analyticsService");

exports.getStudentOverview = async (req, res) => {
    try {
        const data = await analyticsService.getStudentOverview(req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStudentGradesByCourse = async (req, res) => {
    try {
        const data = await analyticsService.getStudentGradesByCourse(req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getInstructorOverview = async (req, res) => {
    try {
        const data = await analyticsService.getInstructorOverview(req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseAnalytics = async (req, res) => {
    try {
        const { courseId } = req.params;
        const data = await analyticsService.getCourseAnalytics(courseId);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
