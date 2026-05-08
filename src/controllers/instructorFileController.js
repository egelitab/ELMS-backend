const instructorFileService = require("../services/instructorFileService");
const { logActivity } = require("../services/activityLogger");

exports.createFolder = async (req, res) => {
    try {
        const { name, parent_id } = req.body;
        const folder = await instructorFileService.createFolder(name, parent_id, req.user.id);

        await logActivity(req.user.id, 'CREATE_FOLDER', folder.id, 'folder');
        res.status(201).json({ success: true, data: folder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStorageContents = async (req, res) => {
    try {
        const { folder_id } = req.query;

        const [folders, files, stats, recent] = await Promise.all([
            instructorFileService.getFolders(req.user.id, folder_id),
            instructorFileService.getFiles(req.user.id, folder_id),
            instructorFileService.getStorageStats(req.user.id),
            instructorFileService.getRecentFiles(req.user.id)
        ]);

        res.json({ success: true, data: { folders, files, stats, recent } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.uploadInstructorFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const file = await instructorFileService.uploadFile({
            name: req.file.originalname,
            folder_id: req.body.folder_id || null,
            instructor_id: req.user.id,
            file_path: `/uploads/materials/${req.file.filename}`,
            file_type: req.file.mimetype.split("/")[1],
            file_size_bytes: req.file.size
        });

        await logActivity(req.user.id, 'UPLOAD_MATERIAL', file.id, 'material');
        res.status(201).json({ success: true, data: file });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.renameFolder = async (req, res) => {
    try {
        const folder = await instructorFileService.renameFolder(req.params.id, req.body.name, req.user.id);
        res.json({ success: true, data: folder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.renameFile = async (req, res) => {
    try {
        const file = await instructorFileService.renameFile(req.params.id, req.body.name, req.user.id);
        res.json({ success: true, data: file });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteFolder = async (req, res) => {
    try {
        await instructorFileService.softDeleteFolder(req.params.id, req.user.id);
        res.json({ success: true, message: "Folder moved to recycle bin" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteFile = async (req, res) => {
    try {
        await instructorFileService.softDeleteFile(req.params.id, req.user.id);
        res.json({ success: true, message: "File moved to recycle bin" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.moveEntry = async (req, res) => {
    try {
        const { id, type, target_folder_id } = req.body;
        const entry = await instructorFileService.moveEntry(id, type, target_folder_id, req.user.id);
        res.json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.duplicateEntry = async (req, res) => {
    try {
        const { id, type, target_folder_id, new_name } = req.body;
        const entry = await instructorFileService.duplicateEntry(id, type, target_folder_id, req.user.id, new_name);
        res.status(201).json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getRecycleBin = async (req, res) => {
    try {
        const items = await instructorFileService.getRecycleBin(req.user.id);
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.restoreEntry = async (req, res) => {
    try {
        const { id, type } = req.body;
        const item = await instructorFileService.restoreEntry(id, type, req.user.id);
        res.json({ success: true, data: item, message: "Item restored successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.permanentlyDeleteEntry = async (req, res) => {
    try {
        const { id, type } = req.params;
        await instructorFileService.permanentlyDeleteEntry(id, type, req.user.id);
        res.json({ success: true, message: "Item permanently deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
