const announcementService = require("../services/announcementService");

const createAnnouncement = async (req, res) => {
    try {
        const { course_id, title, content, section, attachments } = req.body;
        const posted_by = req.user.id;
        const announcement = await announcementService.createAnnouncement({ course_id, title, content, posted_by, section, attachments });
        res.status(201).json({ success: true, data: announcement });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getInstructorAnnouncements = async (req, res) => {
    try {
        const instructor_id = req.user.id;
        const announcements = await announcementService.getInstructorAnnouncements(instructor_id);
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getStudentAnnouncements = async (req, res) => {
    try {
        const student_id = req.user.id;
        const announcements = await announcementService.getStudentAnnouncements(student_id);
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createAnnouncement,
    getInstructorAnnouncements,
    getStudentAnnouncements
};
