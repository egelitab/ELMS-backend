const express = require("express");
const router = express.Router();
const conversionController = require("../controllers/conversionController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Convert text content to PDF
router.post("/text-to-pdf", authMiddleware(["instructor"]), conversionController.convertTextToPdf);

// Convert uploaded text file to PDF
router.post("/file-to-pdf", authMiddleware(["instructor"]), upload.single("file"), conversionController.convertFileToPdf);

// Download a converted file
router.get("/download/:filename", authMiddleware(), conversionController.downloadConverted);

module.exports = router;
