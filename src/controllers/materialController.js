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
        const { chapter_id } = req.query;
        const materials = await materialService.getMaterialsByCourse(courseId, chapter_id);
        res.json({ success: true, data: materials });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getInstructorMaterials = async (req, res) => {
    try {
        const instructor_id = req.user.id;
        const materials = await materialService.getInstructorMaterials(instructor_id);
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

const renameMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        if (!title) return res.status(400).json({ success: false, message: "Title is required" });

        const material = await materialService.renameMaterial(id, req.user.id, title);
        res.json({ success: true, message: "Material renamed successfully", data: material });
    } catch (error) {
        res.status(403).json({ success: false, message: error.message });
    }
};

const shareMaterials = async (req, res) => {
    try {
        const { material_ids, course_id, department_id, section, chapter_id } = req.body;
        if (!material_ids || material_ids.length === 0) {
            return res.status(400).json({ success: false, message: "Materials are required" });
        }

        if (!course_id && !department_id) {
            return res.status(400).json({ success: false, message: "Either Course or Department is required for sharing" });
        }

        await materialService.shareMaterials(material_ids, course_id, department_id, section, chapter_id);
        res.json({ success: true, message: "Materials shared successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const unshareMaterials = async (req, res) => {
    try {
        const { material_ids, course_id } = req.body;
        if (!material_ids || material_ids.length === 0) {
            return res.status(400).json({ success: false, message: "Materials are required" });
        }
        if (!course_id) {
            return res.status(400).json({ success: false, message: "Course ID is required" });
        }

        await materialService.unshareMaterials(material_ids, course_id);
        res.json({ success: true, message: "Materials unshared successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    uploadMaterial,
    getMaterialsByCourse,
    getInstructorMaterials,
    deleteMaterial,
    renameMaterial,
    shareMaterials,
    unshareMaterials
};
