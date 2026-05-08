const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Only instructor can create course
router.post("/", authMiddleware(["instructor"]), courseController.createCourse);

// Anyone logged in can view courses
router.get("/", authMiddleware(), courseController.getAllCourses);

// Instructor-specific courses
router.get("/instructor", authMiddleware(["instructor"]), courseController.getInstructorCourses);

// Instructor-specific targets (departments / sections)
router.get("/instructor/targets", authMiddleware(["instructor"]), courseController.getInstructorTargets);

// Student-specific courses
router.get("/student", authMiddleware(["student"]), courseController.getStudentCourses);

// Course enrollment stats
router.get("/:courseId/enrollment-stats", authMiddleware(), courseController.getCourseEnrollmentStats);

// Course Guide (PDF) — admin only
router.put("/:courseId/guide", authMiddleware(["admin"]), upload.single("guide"), courseController.uploadCourseGuide);

// Chapters
router.get("/:courseId/chapters", authMiddleware(), courseController.getCourseChapters);
router.post("/:courseId/chapters", authMiddleware(["admin"]), courseController.addCourseChapter);

module.exports = router;