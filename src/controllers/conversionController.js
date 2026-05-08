const conversionService = require("../services/conversionService");

exports.convertTextToPdf = async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: "title and content are required" });
        }

        const result = await conversionService.textToPdf({
            title,
            content,
            author: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Instructor',
        });

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.convertFileToPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "A text file must be uploaded" });
        }

        const title = req.body.title || req.file.originalname;
        const result = await conversionService.fileToPdf(req.file.path, title);

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.downloadConverted = async (req, res) => {
    try {
        const { filename } = req.params;
        const path = require("path");
        const filePath = path.join(__dirname, "..", "..", "uploads", "converted", filename);
        const fs = require("fs");

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "File not found" });
        }

        res.download(filePath, filename);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
