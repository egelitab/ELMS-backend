const pool = require("./src/config/db");

async function run() {
    const query = `
      SELECT id, first_name, last_name, role
      FROM users
      WHERE first_name = 'Fikre' AND last_name = 'Sisay' OR first_name LIKE '%Fikre%' OR last_name LIKE '%Fikre%';
  `;
    const { rows } = await pool.query(query);
    console.log("Users found:", rows);

    if (rows.length > 0) {
        const user_id = rows[0].id;
        console.log("Querying for user:", user_id);

        const checkGroupMembers = await pool.query(`SELECT * FROM group_members WHERE user_id = $1`, [user_id]);
        console.log("Groups the user is in:", checkGroupMembers.rows);

        const inboxQuery = `
            SELECT 
                g.id as group_id,
                g.name as group_name,
                g.section,
                c.title as course_title,
                c.course_code,
                g.created_at as created_at,
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
        const res = await pool.query(inboxQuery, [user_id]);
        console.log("Inbox query returned rows:", res.rows.length);
        console.dir(res.rows);
    }
    process.exit(0);
}

run().catch(console.error);
