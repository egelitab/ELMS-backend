const pool = require("../config/db");
const path = require("path");
const fs = require("fs");

exports.uploadCalendar = async (req, res) => {
    try {
        const { title, academic_year } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const result = await pool.query(
            `INSERT INTO academic_calendars (title, academic_year, file_path, uploaded_by)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                title,
                academic_year,
                file.path,
                req.user.id
            ]
        );

        res.status(201).json({
            success: true,
            message: "Calendar uploaded successfully",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("Error uploading calendar:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllCalendars = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, u.first_name || ' ' || u.last_name as uploaded_by_name 
            FROM academic_calendars c
            LEFT JOIN users u ON c.uploaded_by = u.id
            ORDER BY c.created_at DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Error fetching calendars:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const findRes = await pool.query("SELECT file_path FROM academic_calendars WHERE id = $1", [id]);

        if (findRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Calendar not found" });
        }

        const filePath = findRes.rows[0].file_path;

        await pool.query("DELETE FROM academic_calendars WHERE id = $1", [id]);

        if (filePath) {
            const absolutePath = path.resolve(filePath);
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
        }

        res.json({ success: true, message: "Calendar deleted successfully" });
    } catch (err) {
        console.error("Error deleting calendar:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
