const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Upload academic calendar (admin only)
router.post("/upload", authMiddleware(["admin"]), upload.single("file"), calendarController.uploadCalendar);

// Get all calendars
router.get("/", authMiddleware(), calendarController.getAllCalendars);

// Delete a calendar (admin only)
router.delete("/:id", authMiddleware(["admin"]), calendarController.deleteCalendar);

module.exports = router;
