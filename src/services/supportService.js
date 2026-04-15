const pool = require("../config/db");

exports.getAllTickets = async () => {
    // Check if table exists first OR just try to query and handle error
    try {
        const { rows } = await pool.query(`
            SELECT t.*, u.email as user_email 
            FROM support_tickets t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        `);
        return rows;
    } catch (error) {
        if (error.code === '42P01') { // undefined_table
            // Return mock data if table doesn't exist yet
            return [
                { id: '1', user_email: 'a.smith@university.edu', subject: 'Forgot Password', status: 'Open', created_at: new Date() },
                { id: '2', user_email: 'faculty.john@university.edu', subject: 'Cannot upload PDF', status: 'Open', created_at: new Date() }
            ];
        }
        throw error;
    }
};

exports.updateTicketStatus = async (id, status) => {
    const { rows } = await pool.query(
        "UPDATE support_tickets SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
    );
    return rows[0];
};
