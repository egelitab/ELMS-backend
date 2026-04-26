const systemMessageService = require("../services/systemMessageService");

const sendSystemMessage = async (req, res) => {
    try {
        const { title, content, recipient_type, recipients } = req.body;
        const sender_id = req.user.id;

        const message = await systemMessageService.sendSystemMessage({
            sender_id,
            title,
            content,
            recipient_type,
            recipients
        });

        res.status(201).json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAdminSentMessages = async (req, res) => {
    try {
        const admin_id = req.user.id;
        const messages = await systemMessageService.getAdminSentMessages(admin_id);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMessagesForUser = async (req, res) => {
    try {
        const user_id = req.user.id;
        const messages = await systemMessageService.getMessagesForUser(user_id);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    sendSystemMessage,
    getAdminSentMessages,
    getMessagesForUser
};
