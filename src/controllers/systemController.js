const systemService = require("../services/systemService");

exports.getStats = async (req, res) => {
    try {
        const stats = await systemService.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLogs = async (req, res) => {
    try {
        const logs = await systemService.getActivityLogs();
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTickets = async (req, res) => {
    try {
        const supportService = require("../services/supportService");
        const tickets = await supportService.getAllTickets();
        res.json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.triggerBackup = async (req, res) => {
    try {
        const result = await systemService.triggerBackup();
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.exportUserActivity = async (req, res) => {
    try {
        const data = await systemService.getUserActivityExport();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.exportEnrollments = async (req, res) => {
    try {
        const data = await systemService.getEnrollmentExport();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await systemService.getSettings();
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body; // Expecting { key: value, ... }
        const results = [];
        for (const [key, value] of Object.entries(updates)) {
            const result = await systemService.updateSetting(key, value);
            results.push(result);
        }
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
