const pool = require("../config/db");
const path = require("path");
const fs = require("fs");

exports.uploadSchedule = async (req, res) => {
    try {
        const { type, academic_years, faculties, departments, title, sections, semester } = req.body;
        const file = req.file;

        const filePath = file ? file.path : 'DIGITAL_ENTRY';

        // Parse JSON strings if they come from FormData
        const parsedYears = typeof academic_years === 'string' ? JSON.parse(academic_years) : academic_years;
        const parsedFaculties = typeof faculties === 'string' ? JSON.parse(faculties) : faculties;
        const parsedDepartments = typeof departments === 'string' ? JSON.parse(departments) : departments;
        const parsedSections = typeof sections === 'string' ? JSON.parse(sections) : (sections || []);

        const result = await pool.query(
            `INSERT INTO schedules (type, file_path, academic_years, faculties, departments, sections, uploaded_by, title, semester)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                type,
                filePath,
                JSON.stringify(parsedYears || []),
                JSON.stringify(parsedFaculties || []),
                JSON.stringify(parsedDepartments || []),
                JSON.stringify(parsedSections),
                req.user.id,
                title || null,
                semester || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Schedule uploaded successfully",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("Error uploading schedule:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllSchedules = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM schedules ORDER BY created_at DESC");
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const findRes = await pool.query("SELECT file_path FROM schedules WHERE id = $1", [id]);

        if (findRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Schedule not found" });
        }

        const filePath = findRes.rows[0].file_path;

        await pool.query("DELETE FROM schedules WHERE id = $1", [id]);

        if (filePath && filePath !== 'DIGITAL_ENTRY') {
            const absolutePath = path.resolve(filePath);
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
        }

        res.json({ success: true, message: "Schedule deleted successfully" });
    } catch (err) {
        console.error("Error deleting schedule:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateDigitalContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        await pool.query(
            "UPDATE schedules SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
            [typeof content === 'string' ? content : JSON.stringify(content), id]
        );

        res.json({ success: true, message: "Schedule updated successfully" });
    } catch (err) {
        console.error("Error updating schedule:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
