const materialService = require("../services/materialService");
const { logActivity } = require("../services/activityLogger");
const fs = require("fs");
const path = require("path");

exports.uploadMaterial = async (req, res) => {
    try {
        const { course_id, title, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file provided" });
        }

        if (!title) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: "Title is required" });
        }

        const material = await materialService.uploadMaterial({
            course_id, title, description,
            file_path: "/uploads/materials/" + req.file.filename,
            file_type: req.file.mimetype,
            file_size_bytes: req.file.size,
            uploaded_by: req.user.id,
        });

        await logActivity(req.user.id, 'UPLOAD_MATERIAL', material.id, 'material');
        res.status(201).json({ success: true, message: "Material uploaded successfully", data: material });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMaterialsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { chapter_id } = req.query;
        const materials = await materialService.getMaterialsByCourse(courseId, chapter_id);
        res.json({ success: true, data: materials });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getInstructorMaterials = async (req, res) => {
    try {
        const materials = await materialService.getInstructorMaterials(req.user.id);
        res.json({ success: true, data: materials });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const filePath = await materialService.deleteMaterial(id, req.user.id);

        const fullPath = path.join(__dirname, "..", "..", filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        await logActivity(req.user.id, 'DELETE_MATERIAL', id, 'material');
        res.json({ success: true, message: "Material deleted successfully" });
    } catch (error) {
        res.status(403).json({ success: false, message: error.message });
    }
};

exports.renameMaterial = async (req, res) => {
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

exports.shareMaterials = async (req, res) => {
    try {
        const { material_ids, course_id, department_id, section, chapter_id } = req.body;
        if (!material_ids || material_ids.length === 0) {
            return res.status(400).json({ success: false, message: "Materials are required" });
        }
        if (!course_id && !department_id) {
            return res.status(400).json({ success: false, message: "Either Course or Department is required for sharing" });
        }

        await materialService.shareMaterials(material_ids, course_id, department_id, section, chapter_id);

        for (const id of material_ids) {
            await logActivity(req.user.id, 'SHARE_MATERIAL', id, 'material');
        }

        res.json({ success: true, message: "Materials shared successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.unshareMaterials = async (req, res) => {
    try {
        const { material_ids, course_id } = req.body;
        if (!material_ids || material_ids.length === 0) {
            return res.status(400).json({ success: false, message: "Materials are required" });
        }
        if (!course_id) {
            return res.status(400).json({ success: false, message: "Course ID is required" });
        }

        await materialService.unshareMaterials(material_ids, course_id);

        for (const id of material_ids) {
            await logActivity(req.user.id, 'UNSHARE_MATERIAL', id, 'material');
        }

        res.json({ success: true, message: "Materials unshared successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
