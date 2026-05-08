const pool = require("../config/db");

exports.getNotifications = async (userId, limit = 50) => {
    const { rows } = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
        [userId, limit]
    );
    return rows;
};

exports.markAsRead = async (notificationId) => {
    await pool.query(
        "UPDATE notifications SET is_read = TRUE WHERE id = $1",
        [notificationId]
    );
    return true;
};

exports.markAllAsRead = async (userId) => {
    await pool.query(
        "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
        [userId]
    );
    return true;
};

exports.createNotification = async ({ userId, type, title, content, relatedId }) => {
    // Check if user has this notification type enabled
    const userSettings = await pool.query(
        "SELECT notify_chat, notify_announcement, notify_material_task, notify_system FROM users WHERE id = $1",
        [userId]
    );

    if (userSettings.rows.length === 0) return null;
    const settings = userSettings.rows[0];

    let shouldNotify = true;
    if (type === 'chat' && !settings.notify_chat) shouldNotify = false;
    if (type === 'announcement' && !settings.notify_announcement) shouldNotify = false;
    if (['material', 'task'].includes(type) && !settings.notify_material_task) shouldNotify = false;
    if (type === 'system' && !settings.notify_system) shouldNotify = false;

    if (!shouldNotify) return null;

    const { rows } = await pool.query(
        `INSERT INTO notifications (user_id, type, title, content, related_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, type, title, content, relatedId]
    );
    return rows[0];
};

exports.createNotificationsBatch = async ({ userIds, type, title, content, relatedId }) => {
    if (!userIds || userIds.length === 0) return [];

    // Filter users who have suppressed this notification type
    let settingColumn = 'notify_system';
    if (type === 'chat') settingColumn = 'notify_chat';
    else if (type === 'announcement') settingColumn = 'notify_announcement';
    else if (['material', 'task'].includes(type)) settingColumn = 'notify_material_task';

    const { rows: allowedUsers } = await pool.query(
        `SELECT id FROM users WHERE id = ANY($1) AND ${settingColumn} = TRUE`,
        [userIds]
    );

    const targetIds = allowedUsers.map(u => u.id);
    if (targetIds.length === 0) return [];

    // Construct batch insert
    const values = [];
    const placeholders = [];
    targetIds.forEach((id, idx) => {
        const base = idx * 5;
        placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
        values.push(id, type, title, content, relatedId);
    });

    const query = `
        INSERT INTO notifications (user_id, type, title, content, related_id)
        VALUES ${placeholders.join(', ')}
        RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    return rows;
};

exports.getSettings = async (userId) => {
    const { rows } = await pool.query(
        "SELECT notify_chat, notify_announcement, notify_material_task, notify_system FROM users WHERE id = $1",
        [userId]
    );
    return rows[0];
};

exports.updateSettings = async (userId, settings) => {
    const { notify_chat, notify_announcement, notify_material_task, notify_system } = settings;
    const { rows } = await pool.query(
        `UPDATE users 
         SET notify_chat = COALESCE($1, notify_chat),
             notify_announcement = COALESCE($2, notify_announcement),
             notify_material_task = COALESCE($3, notify_material_task),
             notify_system = COALESCE($4, notify_system)
         WHERE id = $5
         RETURNING notify_chat, notify_announcement, notify_material_task, notify_system`,
        [notify_chat, notify_announcement, notify_material_task, notify_system, userId]
    );
    return rows[0];
};
