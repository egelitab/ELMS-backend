const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.post("/", verifyToken(), authorizeRoles("instructor"), announcementController.createAnnouncement);
router.get("/instructor", verifyToken(), authorizeRoles("instructor"), announcementController.getInstructorAnnouncements);
router.get("/student", verifyToken(), authorizeRoles("student"), announcementController.getStudentAnnouncements);

module.exports = router;
