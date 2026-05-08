const attendanceService = require("../services/attendanceService");

exports.createSession = async (req, res) => {
    try {
        const { course_id, title, session_date } = req.body;
        if (!course_id) {
            return res.status(400).json({ success: false, message: "course_id is required" });
        }
        const session = await attendanceService.createSession(course_id, req.user.id, title, session_date);
        res.status(201).json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSessions = async (req, res) => {
    try {
        const { courseId } = req.params;
        const sessions = await attendanceService.getSessions(courseId);
        res.json({ success: true, data: sessions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSessionDetail = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const data = await attendanceService.getSessionWithRecords(sessionId);
        res.json({ success: true, data });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

exports.markAttendance = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { records } = req.body;
        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ success: false, message: "records array is required" });
        }
        const result = await attendanceService.markAttendance(sessionId, records);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStudentAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const records = await attendanceService.getStudentAttendance(req.user.id, courseId);
        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        await attendanceService.deleteSession(sessionId, req.user.id);
        res.json({ success: true, message: "Session deleted" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
