const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Upload a schedule (admin only)
router.post("/upload", authMiddleware(["admin"]), upload.single("file"), scheduleController.uploadSchedule);

// Get schedules for the current user
router.get("/my-schedule", authMiddleware(), scheduleController.getMySchedules);

// Get all schedules
router.get("/", authMiddleware(), scheduleController.getAllSchedules);

// Delete a schedule (admin only)
router.delete("/:id", authMiddleware(["admin"]), scheduleController.deleteSchedule);

// Update digital schedule content (admin only)
router.patch("/:id/content", authMiddleware(["admin"]), scheduleController.updateDigitalContent);

module.exports = router;
