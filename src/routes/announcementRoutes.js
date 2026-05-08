const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware(["instructor"]), announcementController.createAnnouncement);
router.get("/instructor", authMiddleware(["instructor"]), announcementController.getInstructorAnnouncements);
router.get("/student", authMiddleware(["student"]), announcementController.getStudentAnnouncements);
router.put("/:id", authMiddleware(["instructor"]), announcementController.updateAnnouncement);
router.delete("/:id", authMiddleware(["instructor"]), announcementController.deleteAnnouncement);

module.exports = router;
