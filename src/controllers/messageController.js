const messageService = require("../services/messageService");

const sendMessage = async (req, res) => {
    try {
        const { receiver_id, content } = req.body;
        const sender_id = req.user.id;
        const message = await messageService.sendMessage({ sender_id, receiver_id, content });
        res.status(201).json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getInbox = async (req, res) => {
    try {
        const user_id = req.user.id;
        const inbox = await messageService.getInbox(user_id);
        res.status(200).json({ success: true, data: inbox });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const user1_id = req.user.id;
        const { user2_id } = req.params;
        const history = await messageService.getChatHistory(user1_id, user2_id);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    sendMessage,
    getInbox,
    getChatHistory
};
