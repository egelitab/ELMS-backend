const materialService = require("../services/materialService");
const fs = require("fs");
const path = require("path");

const uploadMaterial = async (req, res) => {
    try {
        const { course_id, title, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file provided" });
        }

        if (!course_id || !title) {
            // cleanup the uploaded file if we fail validation
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: "Course ID and Title are required" });
        }

        // Usually, you should also verify here if the instructor owns the course
        // const instructorOwnsCourse = await courseService.verifyInstructorOwnership(course_id, req.user.id);
        // if (!instructorOwnsCourse) { ... }

        const material = await materialService.uploadMaterial({
            course_id,
            title,
            description,
            file_path: "/uploads/" + req.file.filename,
            file_type: req.file.mimetype,
            file_size_bytes: req.file.size,
            uploaded_by: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: "Material uploaded successfully",
            data: material,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMaterialsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const materials = await materialService.getMaterialsByCourse(courseId);
        res.json({ success: true, data: materials });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const filePath = await materialService.deleteMaterial(id, req.user.id);

        // Delete physical file
        const fullPath = path.join(__dirname, "..", "..", filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        res.json({ success: true, message: "Material deleted successfully" });
    } catch (error) {
        res.status(403).json({ success: false, message: error.message });
    }
}

module.exports = {
    uploadMaterial,
    getMaterialsByCourse,
    deleteMaterial
};
