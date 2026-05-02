const pool = require("./src/config/db");
const messageService = require("./src/services/messageService");

async function run() {
    const role = 'student';
    const query = `
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
      LIMIT 10;
  `;
    const { rows } = await pool.query(query);
    console.dir(rows, { depth: null });
    process.exit(0);
}

run().catch(console.error);
