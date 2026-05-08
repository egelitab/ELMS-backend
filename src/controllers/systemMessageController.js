const systemMessageService = require("../services/systemMessageService");

exports.sendSystemMessage = async (req, res) => {
    try {
        const { title, content, recipient_type, recipients } = req.body;
        const message = await systemMessageService.sendSystemMessage({
            sender_id: req.user.id, title, content, recipient_type, recipients
        });
        res.status(201).json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminSentMessages = async (req, res) => {
    try {
        const messages = await systemMessageService.getAdminSentMessages(req.user.id);
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMessagesForUser = async (req, res) => {
    try {
        const messages = await systemMessageService.getMessagesForUser(req.user.id);
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
