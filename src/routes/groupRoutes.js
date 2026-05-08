const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");
const authMiddleware = require("../middleware/authMiddleware");

// Generate groups for a course
router.post("/:courseId/generate", authMiddleware(["instructor"]), groupController.generateGroups);

// View groups the student belongs to
router.get("/student/my-groups", authMiddleware(), groupController.getStudentGroups);

// View groups for a course
router.get("/:courseId", authMiddleware(), groupController.getGroups);

// Delete a batch of groups
router.delete("/:courseId/batch", authMiddleware(["instructor"]), groupController.deleteBatch);

module.exports = router;
