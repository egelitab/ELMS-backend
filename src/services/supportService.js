const pool = require("../config/db");

exports.getAllTickets = async () => {
    const { rows } = await pool.query(`
        SELECT t.*, 
            u.email as user_email,
            u.first_name || ' ' || u.last_name as user_name
        FROM support_tickets t
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
    `);
    return rows;
};

exports.getTicketsByUser = async (user_id) => {
    const { rows } = await pool.query(
        "SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC",
        [user_id]
    );
    return rows;
};

exports.getTicketById = async (id) => {
    const { rows } = await pool.query(
        `SELECT t.*, u.email as user_email, u.first_name || ' ' || u.last_name as user_name
         FROM support_tickets t
         LEFT JOIN users u ON t.user_id = u.id
         WHERE t.id = $1`,
        [id]
    );
    if (rows.length === 0) throw new Error("Ticket not found");
    return rows[0];
};

exports.createTicket = async ({ user_id, subject, description, priority = 'Medium' }) => {
    const { rows } = await pool.query(
        "INSERT INTO support_tickets (user_id, subject, description, priority) VALUES ($1, $2, $3, $4) RETURNING *",
        [user_id, subject, description, priority]
    );
    return rows[0];
};

exports.updateTicketStatus = async (id, status) => {
    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    const { rows } = await pool.query(
        "UPDATE support_tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        [status, id]
    );
    if (rows.length === 0) throw new Error("Ticket not found");
    return rows[0];
};

exports.deleteTicket = async (id) => {
    const { rows } = await pool.query(
        "DELETE FROM support_tickets WHERE id = $1 RETURNING *",
        [id]
    );
    if (rows.length === 0) throw new Error("Ticket not found");
    return rows[0];
};
