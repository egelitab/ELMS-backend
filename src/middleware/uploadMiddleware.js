const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let targetDir = uploadsDir;

    // Check if it's an assessment submission
    if (req.originalUrl.includes("/api/assignments/submit")) {
      targetDir = path.join(uploadsDir, "assessments");
    } else if (req.originalUrl.includes("/api/instructor-files") || req.originalUrl.includes("/api/materials")) {
      targetDir = path.join(uploadsDir, "materials");
    } else if (req.originalUrl.includes("/api/schedules")) {
      targetDir = path.join(uploadsDir, "schedules");
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // Unique filename to prevent overwriting
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

// File filter (Optional, to restrict file types)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/zip",
    "application/vnd.ms-powerpoint", // .ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "video/mp4", // .mp4
    "image/jpeg", // .jpg, .jpeg
    "image/png", // .png
    "image/gif", // .gif
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "text/plain", // .txt
  ];

  const allowedExtensions = [".pdf", ".doc", ".docx", ".zip", ".ppt", ".pptx", ".mp4", ".jpg", ".jpeg", ".png", ".gif", ".xls", ".xlsx", ".txt"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${ext} (${file.mimetype}). Allowed: PDF, Word, PPT, Excel, TXT, ZIP, MP4, Images.`), false);
  }
};

// Initialize multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
});

module.exports = upload;
