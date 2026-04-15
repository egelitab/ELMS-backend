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
