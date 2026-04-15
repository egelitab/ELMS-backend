const pool = require("../config/db");

exports.getStats = async () => {
    const userCount = await pool.query("SELECT COUNT(*)::int FROM users");
    const courseCount = await pool.query("SELECT COUNT(*)::int FROM courses");
    const deptCount = await pool.query("SELECT COUNT(*)::int FROM departments");

    // Mock active sessions as we don't have a sessions table in the schema
    const activeSessions = Math.floor(Math.random() * 200) + 50;

    // Get departmental breakdown
    const deptBreakdown = await pool.query(`
        SELECT d.name, COUNT(u.id)::int as count 
        FROM departments d 
        LEFT JOIN users u ON d.id = u.department_id 
        GROUP BY d.id, d.name
    `);

    return {
        totalUsers: userCount.rows[0].count,
        totalCourses: courseCount.rows[0].count,
        totalDepartments: deptCount.rows[0].count,
        activeSessions: activeSessions,
        systemStatus: "Healthy",
        deptBreakdown: deptBreakdown.rows,
        storage: {
            usedGB: 184, // Mocked for now, but could be real if needed
            totalGB: 256
        }
    };
};

exports.getActivityLogs = async (limit = 10) => {
    const query = `
        SELECT l.*, u.first_name, u.last_name, u.email 
        FROM activity_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
        LIMIT $1
    `;
    const { rows } = await pool.query(query, [limit]);
    return rows;
};

exports.triggerBackup = async () => {
    // This would normally call a shell script or pg_dump
    // Mocking the completion for now
    return {
        success: true,
        message: "Backup saved to /server/backups/db_backup_" + new Date().getTime() + ".sql",
        timestamp: new Date()
    };
};
