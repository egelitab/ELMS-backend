const pool = require("./src/config/db");

async function run() {
    const q = `
            SELECT 
                g.id as group_id,
                g.name as group_name,
                gm.content as last_message,
                gm.created_at as last_message_at,
                u.first_name as sender_first_name
            FROM group_members gmem
            JOIN groups g ON gmem.group_id = g.id
            LEFT JOIN LATERAL (
                SELECT content, created_at, sender_id
                FROM group_messages
                WHERE group_id = g.id
                ORDER BY created_at DESC
                LIMIT 1
            ) gm ON true
            LEFT JOIN users u ON gm.sender_id = u.id
            WHERE g.id = '375b158d-9133-47ea-8acd-b222925db585';
  `;
    const res = await pool.query(q);
    console.dir(res.rows);
    process.exit(0);
}

run().catch(console.error);
