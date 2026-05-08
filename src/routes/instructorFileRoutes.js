const express = require("express");
const router = express.Router();
const instructorFileController = require("../controllers/instructorFileController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", authMiddleware(["instructor"]), instructorFileController.getStorageContents);
router.post("/folder", authMiddleware(["instructor"]), instructorFileController.createFolder);
router.post("/upload", authMiddleware(["instructor"]), upload.single("file"), instructorFileController.uploadInstructorFile);
router.patch("/folder/:id/rename", authMiddleware(["instructor"]), instructorFileController.renameFolder);
router.patch("/file/:id/rename", authMiddleware(["instructor"]), instructorFileController.renameFile);
router.delete("/folder/:id", authMiddleware(["instructor"]), instructorFileController.deleteFolder);
router.delete("/file/:id", authMiddleware(["instructor"]), instructorFileController.deleteFile);
router.patch("/move", authMiddleware(["instructor"]), instructorFileController.moveEntry);
router.post("/duplicate", authMiddleware(["instructor"]), instructorFileController.duplicateEntry);
router.patch("/restore", authMiddleware(["instructor"]), instructorFileController.restoreEntry);
router.get("/recycle-bin", authMiddleware(["instructor"]), instructorFileController.getRecycleBin);
router.delete("/permanent/:type/:id", authMiddleware(["instructor"]), instructorFileController.permanentlyDeleteEntry);

module.exports = router;
