const express = require("express");
const router = express.Router();
const instructorFileController = require("../controllers/instructorFileController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", verifyToken(), authorizeRoles("instructor"), instructorFileController.getStorageContents);
router.post("/folder", verifyToken(), authorizeRoles("instructor"), instructorFileController.createFolder);
router.post("/upload", verifyToken(), authorizeRoles("instructor"), upload.single("file"), instructorFileController.uploadInstructorFile);
router.patch("/folder/:id/rename", verifyToken(), authorizeRoles("instructor"), instructorFileController.renameFolder);
router.patch("/file/:id/rename", verifyToken(), authorizeRoles("instructor"), instructorFileController.renameFile);
router.delete("/folder/:id", verifyToken(), authorizeRoles("instructor"), instructorFileController.deleteFolder);
router.delete("/file/:id", verifyToken(), authorizeRoles("instructor"), instructorFileController.deleteFile);
router.patch("/move", verifyToken(), authorizeRoles("instructor"), instructorFileController.moveEntry);
router.post("/duplicate", verifyToken(), authorizeRoles("instructor"), instructorFileController.duplicateEntry);
router.patch("/restore", verifyToken(), authorizeRoles("instructor"), instructorFileController.restoreEntry);
router.get("/recycle-bin", verifyToken(), authorizeRoles("instructor"), instructorFileController.getRecycleBin);

module.exports = router;
