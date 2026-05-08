const notificationService = require("../services/notificationService");

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getNotifications(req.user.id);
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await notificationService.markAsRead(req.params.id);
        res.json({ success: true, message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.user.id);
        res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await notificationService.getSettings(req.user.id);
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const settings = await notificationService.updateSettings(req.user.id, req.body);
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
