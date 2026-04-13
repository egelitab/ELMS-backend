const instructorFileService = require("../services/instructorFileService");

const createFolder = async (req, res) => {
    try {
        const { name, parent_id } = req.body;
        const instructor_id = req.user.id;
        const folder = await instructorFileService.createFolder(name, parent_id, instructor_id);
        res.status(201).json({ success: true, data: folder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getStorageContents = async (req, res) => {
    try {
        const instructor_id = req.user.id;
        const { folder_id } = req.query;

        const [folders, files, stats, recent] = await Promise.all([
            instructorFileService.getFolders(instructor_id, folder_id),
            instructorFileService.getFiles(instructor_id, folder_id),
            instructorFileService.getStorageStats(instructor_id),
            instructorFileService.getRecentFiles(instructor_id)
        ]);

        res.status(200).json({
            success: true,
            data: {
                folders,
                files,
                stats,
                recent
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const uploadInstructorFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const { folder_id } = req.body;
        const instructor_id = req.user.id;
        const fileData = {
            name: req.file.originalname,
            folder_id: folder_id || null,
            instructor_id,
            file_path: `/uploads/${req.file.filename}`,
            file_type: req.file.mimetype.split("/")[1],
            file_size_bytes: req.file.size
        };

        const file = await instructorFileService.uploadFile(fileData);
        res.status(201).json({ success: true, data: file });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createFolder,
    getStorageContents,
    uploadInstructorFile
};
