const messageService = require("../services/messageService");

// One-to-One messaging

exports.sendMessage = async (req, res) => {
    try {
        const { receiver_id, content } = req.body;
        const message = await messageService.sendMessage({ sender_id: req.user.id, receiver_id, content });
        res.status(201).json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getInbox = async (req, res) => {
    try {
        const inbox = await messageService.getInbox(req.user.id);
        res.json({ success: true, data: inbox });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getChatHistory = async (req, res) => {
    try {
        const { user2_id } = req.params;
        const history = await messageService.getChatHistory(req.user.id, user2_id);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Group Chat

exports.sendGroupMessage = async (req, res) => {
    try {
        const { group_id, content } = req.body;
        const message = await messageService.sendGroupMessage({ group_id, sender_id: req.user.id, content });
        res.status(201).json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getGroupInbox = async (req, res) => {
    try {
        const data = await messageService.getGroupInbox(req.user.id, req.user.role);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getGroupChatHistory = async (req, res) => {
    try {
        const { group_id } = req.params;
        const history = await messageService.getGroupChatHistory(group_id);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllGroupsForInstructor = async (req, res) => {
    try {
        const groups = await messageService.getAllFormedGroups(req.user.id);
        res.json({ success: true, data: groups });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
