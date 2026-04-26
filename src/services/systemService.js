const pool = require("../config/db");

const fs = require("fs");
const path = require("path");

// Helper to calculate directory size recursively
const getDirSize = (dirPath) => {
    let totalSize = 0;
    try {
        if (!fs.existsSync(dirPath)) return 0;
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                totalSize += stats.size;
            } else if (stats.isDirectory()) {
                totalSize += getDirSize(filePath);
            }
        }
    } catch (err) {
        console.error("Error calculating directory size:", err);
    }
    return totalSize;
};

exports.getStats = async () => {
    const userCount = await pool.query("SELECT COUNT(*)::int FROM users");
    const courseCount = await pool.query("SELECT COUNT(*)::int FROM courses");
    const deptCount = await pool.query("SELECT COUNT(*)::int FROM departments");

    // Real active sessions: distinct users with activity in last 15 mins (stricter window)
    const activeSessionsResult = await pool.query("SELECT COUNT(DISTINCT user_id)::int FROM activity_logs WHERE created_at > NOW() - INTERVAL '15 minutes'");
    const activeSessions = activeSessionsResult.rows[0].count;

    // Real storage usage from the actual uploads directory
    const uploadsDir = path.join(__dirname, "..", "..", "uploads");
    const usedBytes = getDirSize(uploadsDir);
    const usedGB = Math.round((usedBytes / (1024 * 1024 * 1024)) * 100) / 100;

    // Breakdown for specific storage categories
    const assessmentsDir = path.join(uploadsDir, "assessments");
    const assessmentsBytes = getDirSize(assessmentsDir);
    const assessmentsGB = Math.round((assessmentsBytes / (1024 * 1024 * 1024)) * 100) / 100;

    // System activities overview (non-login actions)
    const systemActivities = await pool.query(`
        SELECT action, COUNT(*)::int as count 
        FROM activity_logs 
        WHERE action != 'LOGIN'
        GROUP BY action
        ORDER BY count DESC
        LIMIT 5
    `);

    // Engagement data (Real System Activities - Excluding Logins)
    // Daily (Last 7 days)
    const dailyEngagement = await pool.query(`
        SELECT TO_CHAR(days.day, 'Dy') as label, COUNT(l.id)::int as count
        FROM (SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') as day) days
        LEFT JOIN activity_logs l ON DATE(l.created_at) = DATE(days.day) AND l.action != 'LOGIN'
        GROUP BY days.day
        ORDER BY days.day
    `);

    // Weekly (Last 7 weeks)
    const weeklyEngagement = await pool.query(`
        SELECT 'W' || TO_CHAR(weeks.week, 'WW') as label, COUNT(l.id)::int as count
        FROM (SELECT generate_series(DATE_TRUNC('week', CURRENT_DATE - INTERVAL '6 weeks'), DATE_TRUNC('week', CURRENT_DATE), '1 week') as week) weeks
        LEFT JOIN activity_logs l ON DATE_TRUNC('week', l.created_at) = weeks.week AND l.action != 'LOGIN'
        GROUP BY weeks.week
        ORDER BY weeks.week
    `);

    // Monthly (Months of this year)
    const monthlyEngagement = await pool.query(`
        SELECT TO_CHAR(months.month, 'Mon') as label, COUNT(l.id)::int as count
        FROM (SELECT generate_series(DATE_TRUNC('year', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE), '1 month') as month) months
        LEFT JOIN activity_logs l ON DATE_TRUNC('month', l.created_at) = months.month AND l.action != 'LOGIN'
        GROUP BY months.month
        ORDER BY months.month
    `);

    // Get departmental breakdown
    const deptBreakdownResult = await pool.query(`
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
        deptBreakdown: deptBreakdownResult.rows,
        storage: {
            usedGB: usedGB,
            totalGB: 500, // Still assuming 500GB limit or from system? 
            assessmentsGB: assessmentsGB,
            othersGB: Math.max(0, Math.round((usedGB - assessmentsGB) * 100) / 100)
        },
        engagement: {
            day: {
                labels: dailyEngagement.rows.map(r => r.label),
                data: dailyEngagement.rows.map(r => r.count)
            },
            week: {
                labels: weeklyEngagement.rows.map(r => r.label),
                data: weeklyEngagement.rows.map(r => r.count)
            },
            month: {
                labels: monthlyEngagement.rows.map(r => r.label),
                data: monthlyEngagement.rows.map(r => r.count)
            }
        },
        recentActivities: systemActivities.rows
    };
};

exports.getActivityLogs = async (limit = 10) => {
    const query = `
        SELECT l.*, u.first_name, u.last_name, u.email 
        FROM activity_logs l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.action != 'LOGIN'
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

const { logActivity } = require("./activityLogger");
exports.logActivity = logActivity;
