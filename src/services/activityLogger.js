const pool = require("../config/db");

const logActivity = async (user_id, action, entity_id = null, entity_type = null, ip_address = null) => {
    try {
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
