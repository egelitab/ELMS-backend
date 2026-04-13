const pool = require("../config/db");

const sendMessage = async ({ sender_id, receiver_id, content }) => {
    const query = `
        INSERT INTO messages (sender_id, receiver_id, content)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [sender_id, receiver_id, content]);
    return rows[0];
};

const getInbox = async (user_id) => {
    const query = `
        SELECT DISTINCT ON (conversation_user_id)
            m.id,
            m.content,
            m.created_at,
            m.is_read,
            CASE 
                WHEN m.sender_id = $1 THEN m.receiver_id 
                ELSE m.sender_id 
            END as conversation_user_id,
            u.first_name,
            u.last_name,
            u.role
        FROM messages m
        JOIN users u ON u.id = (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
        WHERE m.sender_id = $1 OR m.receiver_id = $1
        ORDER BY conversation_user_id, m.created_at DESC;
    `;
    const { rows } = await pool.query(query, [user_id]);
    return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const getChatHistory = async (user1_id, user2_id) => {
    const query = `
        SELECT m.*, u.first_name, u.last_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1)
        ORDER BY created_at ASC;
    `;
    const { rows } = await pool.query(query, [user1_id, user2_id]);
    return rows;
};

module.exports = {
    sendMessage,
    getInbox,
    getChatHistory
};
