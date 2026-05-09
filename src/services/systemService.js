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
    const onlineUsersResult = await pool.query(`
        SELECT DISTINCT ON (l.user_id) 
            u.id, u.first_name, u.last_name, u.email, u.role, 
            d.name as department, l.ip_address, l.created_at as last_activity
        FROM activity_logs l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE l.created_at > NOW() - INTERVAL '15 minutes'
        ORDER BY l.user_id, l.created_at DESC
    `);

    const onlineUsers = onlineUsersResult.rows;
    const activeSessions = onlineUsers.length;

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

    // Course Completion Rate Calculation
    // Based on graded submissions vs expected submissions (enrollments * assignments)
    const totalEnrollments = await pool.query("SELECT COUNT(*)::int FROM enrollments");
    const totalAssignments = await pool.query("SELECT COUNT(*)::int FROM assignments");
    const expectedSubmissions = (totalEnrollments.rows[0].count || 0) * (totalAssignments.rows[0].count || 0);
    const gradedSubmissions = await pool.query("SELECT COUNT(*)::int FROM submissions WHERE grade IS NOT NULL");

    let completionRate = 0;
    if (expectedSubmissions > 0) {
        completionRate = Math.round((gradedSubmissions.rows[0].count / expectedSubmissions) * 100);
    } else {
        completionRate = 85; // Fallback demo value
    }

    return {
        totalUsers: userCount.rows[0].count,
        totalCourses: courseCount.rows[0].count,
        totalDepartments: deptCount.rows[0].count,
        activeSessions: activeSessions,
        onlineUsers: onlineUsers,
        systemStatus: "Healthy",
        completionRate: completionRate,
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
    try {
        const backupDir = path.join(__dirname, "..", "..", "backups");
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const fileName = `db_backup_${Date.now()}.sql`;
        const filePath = path.join(backupDir, fileName);

        // List of tables to export
        const tables = [
            'institutions', 'faculties', 'departments', 'users', 'courses',
            'course_chapters', 'enrollments', 'materials', 'material_shares',
            'assignments', 'groups', 'group_members', 'submissions',
            'announcements', 'activity_logs', 'schedules', 'system_settings'
        ];

        let sqlContent = `-- ELMS Database Export\n-- Generated: ${new Date().toISOString()}\n\n`;
        sqlContent += "SET statement_timeout = 0;\nSET lock_timeout = 0;\nSET client_encoding = 'UTF8';\n\n";

        for (const table of tables) {
            try {
                const { rows } = await pool.query(`SELECT * FROM ${table}`);
                if (rows.length > 0) {
                    sqlContent += `-- Data for table: ${table}\n`;
                    const columns = Object.keys(rows[0]);

                    for (const row of rows) {
                        const values = columns.map(col => {
                            const val = row[col];
                            if (val === null) return 'NULL';
                            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                            if (val instanceof Date) return `'${val.toISOString()}'`;
                            if (typeof val === 'object') {
                                return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                            }
                            return val;
                        });
                        sqlContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
                    }
                    sqlContent += "\n";
                }
            } catch (tableErr) {
                console.warn(`Table ${table} skipped:`, tableErr.message);
                sqlContent += `-- Table ${table} skipped during backup.\n\n`;
            }
        }

        fs.writeFileSync(filePath, sqlContent);

        return {
            success: true,
            message: `Backup successfully saved with real data to ${path.normalize(filePath)}`,
            fileName: fileName,
            timestamp: new Date()
        };
    } catch (error) {
        console.error("Backup failed:", error);
        throw new Error("Failed to generate backup: " + error.message);
    }
};

const { logActivity } = require("./activityLogger");
exports.logActivity = logActivity;

exports.getSettings = async () => {
    const { rows } = await pool.query("SELECT key, value FROM system_settings");
    // Convert to object { key: value }
    return rows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
    }, {});
};

exports.updateSetting = async (key, value) => {
    const query = `
        INSERT INTO system_settings (key, value) 
        VALUES ($1, $2) 
        ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [key, value.toString()]);
    return rows[0];
};

exports.getUserActivityExport = async () => {
    const query = `
        SELECT l.created_at, u.email, u.first_name || ' ' || u.last_name as user_name, l.action, l.ip_address, l.entity_type
        FROM activity_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

exports.getEnrollmentExport = async () => {
    const query = `
        SELECT c.course_code, c.title as course_title, u.institutional_id, u.first_name || ' ' || u.last_name as student_name, u.email, d.name as department, e.enrolled_at
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON e.user_id = u.id
        JOIN departments d ON u.department_id = d.id
        ORDER BY c.course_code, u.last_name
    `;
    const { rows } = await pool.query(query);
    return rows;
};
