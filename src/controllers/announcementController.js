const announcementService = require("../services/announcementService");

exports.createAnnouncement = async (req, res) => {
    try {
        const { course_id, title, content, section, attachments } = req.body;
        const announcement = await announcementService.createAnnouncement({ course_id, title, content, posted_by: req.user.id, section, attachments });
        res.status(201).json({ success: true, data: announcement });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, section, attachments } = req.body;
        const announcement = await announcementService.updateAnnouncement(id, { title, content, section, attachments });
        res.json({ success: true, data: announcement });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await announcementService.deleteAnnouncement(id);
        res.json({ success: true, message: "Announcement deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getInstructorAnnouncements = async (req, res) => {
    try {
        const announcements = await announcementService.getInstructorAnnouncements(req.user.id);
        res.json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStudentAnnouncements = async (req, res) => {
    try {
        const announcements = await announcementService.getStudentAnnouncements(req.user.id);
        res.json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
