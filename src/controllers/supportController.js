const supportService = require("../services/supportService");

exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await supportService.getAllTickets();
        res.json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await supportService.getTicketsByUser(req.user.id);
        res.json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTicket = async (req, res) => {
    try {
        const ticket = await supportService.getTicketById(req.params.id);
        res.json({ success: true, data: ticket });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

exports.createTicket = async (req, res) => {
    try {
        const { subject, description, priority } = req.body;
        if (!subject) {
            return res.status(400).json({ success: false, message: "Subject is required" });
        }
        const ticket = await supportService.createTicket({
            user_id: req.user.id,
            subject,
            description,
            priority,
        });
        res.status(201).json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required" });
        }
        const ticket = await supportService.updateTicketStatus(req.params.id, status);
        res.json({ success: true, data: ticket });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteTicket = async (req, res) => {
    try {
        await supportService.deleteTicket(req.params.id);
        res.json({ success: true, message: "Ticket deleted successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
