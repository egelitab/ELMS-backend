const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.post("/", verifyToken(), authorizeRoles("instructor"), announcementController.createAnnouncement);
router.get("/instructor", verifyToken(), authorizeRoles("instructor"), announcementController.getInstructorAnnouncements);
router.get("/student", verifyToken(), authorizeRoles("student"), announcementController.getStudentAnnouncements);
router.put("/:id", verifyToken(), authorizeRoles("instructor"), announcementController.updateAnnouncement);
router.delete("/:id", verifyToken(), authorizeRoles("instructor"), announcementController.deleteAnnouncement);

module.exports = router;
