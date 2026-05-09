const pool = require("../config/db");

const logActivity = async (user_id, action, entity_id = null, entity_type = null, ip_address = null) => {
    try {
        // For frequent actions like HEARTBEAT, only log once every 10 minutes to save space
        if (action === 'HEARTBEAT') {
            const recent = await pool.query(
                "SELECT id FROM activity_logs WHERE user_id = $1 AND action = $2 AND created_at > NOW() - INTERVAL '10 minutes'",
                [user_id, action]
            );
            if (recent.rows.length > 0) return;
        }

        const query = `
            INSERT INTO activity_logs (user_id, action, entity_id, entity_type, ip_address)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await pool.query(query, [user_id, action, entity_id, entity_type, ip_address]);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

module.exports = { logActivity };
