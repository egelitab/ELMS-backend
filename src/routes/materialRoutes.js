const express = require("express");
const router = express.Router();
const materialController = require("../controllers/materialController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Only instructors can upload materials
router.post("/", authMiddleware(["instructor"]), upload.single("file"), materialController.uploadMaterial);

// Any logged-in user can view materials for a course
router.get("/course/:courseId", authMiddleware(), materialController.getMaterialsByCourse);

// Get all materials uploaded by the instructor
router.get("/instructor", authMiddleware(["instructor"]), materialController.getInstructorMaterials);

// Only instructors can delete their materials
router.delete("/:id", authMiddleware(["instructor"]), materialController.deleteMaterial);

// Only instructors can rename their materials
router.patch("/:id/rename", authMiddleware(["instructor"]), materialController.renameMaterial);

// Instructors can share/unshare materials
router.post("/share", authMiddleware(["instructor"]), materialController.shareMaterials);
router.post("/unshare", authMiddleware(["instructor"]), materialController.unshareMaterials);

module.exports = router;
