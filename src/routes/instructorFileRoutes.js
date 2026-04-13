const express = require("express");
const router = express.Router();
const instructorFileController = require("../controllers/instructorFileController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", verifyToken(), authorizeRoles("instructor"), instructorFileController.getStorageContents);
router.post("/folder", verifyToken(), authorizeRoles("instructor"), instructorFileController.createFolder);
router.post("/upload", verifyToken(), authorizeRoles("instructor"), upload.single("file"), instructorFileController.uploadInstructorFile);

module.exports = router;
