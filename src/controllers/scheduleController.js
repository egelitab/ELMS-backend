const pool = require("../config/db");
const path = require("path");

exports.uploadSchedule = async (req, res) => {
    try {
        const { type, academic_years, faculties, departments } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // Parse JSON strings if they come from FormData
        const parsedYears = typeof academic_years === 'string' ? JSON.parse(academic_years) : academic_years;
        const parsedFaculties = typeof faculties === 'string' ? JSON.parse(faculties) : faculties;
        const parsedDepartments = typeof departments === 'string' ? JSON.parse(departments) : departments;

        const result = await pool.query(
            `INSERT INTO schedules (type, file_path, academic_years, faculties, departments, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                type,
                file.path,
                parsedYears || [],
                parsedFaculties || [],
                parsedDepartments || [],
                req.user.id
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
