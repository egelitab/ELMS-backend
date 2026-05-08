const userService = require("../services/userService");
const { logActivity } = require("../services/activityLogger");

exports.getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);

        // Log activity
        await logActivity(req.user.id, 'CREATE_USER', user.id, 'user');

        res.status(201).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        const user = await userService.updateUserStatus(id, is_active);

        // Log activity
        await logActivity(req.user.id, is_active ? 'ENABLE_USER' : 'DISABLE_USER', id, 'user');

        res.json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await userService.deleteUser(id);

        // Log activity
        await logActivity(req.user.id, 'DELETE_USER', id, 'user');

        res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const updatedUser = await userService.updateUser(userId, req.body);

        // Create a support ticket for admin approval
        const supportService = require("../services/supportService");
        await supportService.createTicket({
            user_id: userId,
            subject: 'Profile Update Request',
            description: `User requested to update personal information. New data: ${JSON.stringify(req.body, null, 2)}`,
            priority: 'High'
        });

        res.json({ success: true, data: updatedUser });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Missing current or new password" });
        }
        await userService.changePassword(req.user.id, currentPassword, newPassword);
        res.json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
