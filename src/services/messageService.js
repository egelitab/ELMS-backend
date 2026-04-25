const pool = require("../config/db");

// --- One-to-One Messages ---
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

// --- Group Messages ---

const sendGroupMessage = async ({ group_id, sender_id, content }) => {
    const query = `
        INSERT INTO group_messages (group_id, sender_id, content)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [group_id, sender_id, content]);
    return rows[0];
};

/**
 * For instructors: Get all groups they teach, and the last message from each if it exists.
 * For students: Get all groups they belong to, and the last message from each.
 */
const getGroupInbox = async (user_id, role) => {
    let query;
    if (role === 'instructor') {
        query = `
            SELECT 
                g.id as group_id,
                g.name as group_name,
                g.section,
                c.title as course_title,
                c.course_code,
                gm.content as last_message,
                gm.created_at as last_message_at,
                u.first_name as sender_first_name,
                u.last_name as sender_last_name
            FROM groups g
            JOIN courses c ON g.course_id = c.id
            LEFT JOIN LATERAL (
                SELECT content, created_at, sender_id
                FROM group_messages
                WHERE group_id = g.id
                ORDER BY created_at DESC
                LIMIT 1
            ) gm ON true
            LEFT JOIN users u ON gm.sender_id = u.id
            WHERE c.instructor_id = $1
            ORDER BY COALESCE(gm.created_at, g.created_at) DESC;
        `;
    } else {
        query = `
            SELECT 
                g.id as group_id,
                g.name as group_name,
                g.section,
                c.title as course_title,
                c.course_code,
                gm.content as last_message,
                gm.created_at as last_message_at,
                u.first_name as sender_first_name,
                u.last_name as sender_last_name
            FROM group_members gmem
            JOIN groups g ON gmem.group_id = g.id
            JOIN courses c ON g.course_id = c.id
            LEFT JOIN LATERAL (
                SELECT content, created_at, sender_id
                FROM group_messages
                WHERE group_id = g.id
                ORDER BY created_at DESC
                LIMIT 1
            ) gm ON true
            LEFT JOIN users u ON gm.sender_id = u.id
            WHERE gmem.user_id = $1
            ORDER BY COALESCE(gm.created_at, g.created_at) DESC;
        `;
    }
    const { rows } = await pool.query(query, [user_id]);
    return rows;
};

const getGroupChatHistory = async (group_id) => {
    const query = `
        SELECT gm.*, u.first_name, u.last_name, u.role
        FROM group_messages gm
        LEFT JOIN users u ON gm.sender_id = u.id
        WHERE gm.group_id = $1
        ORDER BY gm.created_at ASC;
    `;
    const { rows } = await pool.query(query, [group_id]);
    return rows;
};

const getAllFormedGroups = async (instructor_id) => {
    const query = `
    SELECT 
      g.id, g.name, g.section, g.batch_name,
      c.title as course_title, c.course_code,
      d.name as department_name
    FROM groups g
    JOIN courses c ON g.course_id = c.id
    LEFT JOIN departments d ON g.department_id = d.id
    WHERE c.instructor_id = $1
    ORDER BY c.course_code, g.section, g.name;
  `;
    const { rows } = await pool.query(query, [instructor_id]);
    return rows;
};

module.exports = {
    sendMessage,
    getInbox,
    getChatHistory,
    sendGroupMessage,
    getGroupInbox,
    getGroupChatHistory,
    getAllFormedGroups
};
