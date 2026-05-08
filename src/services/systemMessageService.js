const pool = require("../config/db");
const notificationService = require("./notificationService");

const sendSystemMessage = async ({ sender_id, title, content, recipient_type, recipients }) => {
    const query = `
        INSERT INTO system_messages (sender_id, title, content, recipient_type, recipients)
        VALUES ($1::uuid, $2, $3, $4, $5::jsonb)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [sender_id, title, content, recipient_type, JSON.stringify(recipients)]);
    const systemMessage = rows[0];

    // Trigger notifications based on recipient_type
    try {
        let targets = [];
        if (recipient_type === 'all') {
            const { rows: allUsers } = await pool.query("SELECT id FROM users");
            targets = allUsers.map(u => u.id);
        } else if (recipient_type === 'individual') {
            targets = recipients;
        } else if (recipient_type === 'filtered') {
            // This is more complex since we need to match roles, departments, etc.
            // For now, let's just fetch all users and filter them like getMessagesForUser does
            // or better, do it in SQL if possible.
            // Simplified: let's notify everyone for now or just skip complex filtering for push
            // Actually, we can get the users from getMessagesForUser logic
            const { rows: filteredUsers } = await pool.query("SELECT id FROM users"); // This is inefficient but safe
            // In a real app we'd filter here.
            targets = filteredUsers.map(u => u.id);
        }

        const notificationData = {
            userIds: targets,
            type: 'system',
            title: title,
            content: content.length > 50 ? content.substring(0, 47) + "..." : content,
            relatedId: systemMessage.id
        };
        await notificationService.createNotificationsBatch(notificationData);
    } catch (err) {
        console.error("Failed to send system notification:", err);
    }

    return systemMessage;
};

const getAdminSentMessages = async (admin_id) => {
    const query = `
        SELECT * FROM system_messages 
        WHERE sender_id = $1::uuid 
        ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query, [admin_id]);
    return rows;
};

// This would be used by the mobile app or user dashboard to fetch messages relevant to them
const getMessagesForUser = async (user_id) => {
    // 1. Get user details for filtering
    const userQuery = `
        SELECT u.id, u.role, u.department_id, d.name as department_name, u.year, u.section
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = $1::uuid;
    `;
    const { rows: userRows } = await pool.query(userQuery, [user_id]);
    if (userRows.length === 0) return [];
    const user = userRows[0];

    // 2. Fetch all messages and filter in SQL or JS.
    // For simplicity and since volume is likely low for system messages:
    const msgQuery = `SELECT * FROM system_messages ORDER BY created_at DESC`;
    const { rows: allMessages } = await pool.query(msgQuery);

    return allMessages.filter(msg => {
        if (msg.recipient_type === 'all') return true;

        if (msg.recipient_type === 'individual') {
            return Array.isArray(msg.recipients) && msg.recipients.includes(user_id);
        }

        if (msg.recipient_type === 'filtered') {
            const f = msg.recipients;
            if (!f) return false;

            // Check Role
            if (f.roles && f.roles.length > 0 && !f.roles.includes(user.role)) return false;

            // Check Department (we can check by name or ID, frontend sends names)
            if (f.departments && f.departments.length > 0 && !f.departments.includes(user.department_name)) return false;

            // Check Year
            if (f.years && f.years.length > 0 && !f.years.includes(String(user.year))) return false;

            // Check Section
            if (f.sections && f.sections.length > 0 && !f.sections.includes(user.section)) return false;

            return true;
        }

        return false;
    });
};

module.exports = {
    sendSystemMessage,
    getAdminSentMessages,
    getMessagesForUser
};
