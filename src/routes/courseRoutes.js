const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Only instructor can create course
router.post(
  "/",
  verifyToken(),
  authorizeRoles("instructor"),
  courseController.createCourse
);

// Anyone logged in can view courses
router.get("/", verifyToken(), courseController.getAllCourses);

// Instructor-specific courses
router.get(
  "/instructor",
  verifyToken(),
  authorizeRoles("instructor"),
  courseController.getInstructorCourses
);

// Instructor-specific targets (departments / sections)
router.get(
  "/instructor/targets",
  verifyToken(),
  authorizeRoles("instructor"),
  courseController.getInstructorTargets
);

// Student-specific courses
router.get(
  "/student",
  verifyToken(),
  authorizeRoles("student"),
  courseController.getStudentCourses
);

const upload = require("../middleware/uploadMiddleware");

// ... existing routes ...

router.get(
  "/:courseId/enrollment-stats",
  verifyToken(),
  courseController.getCourseEnrollmentStats
);

// Course Guide (PDF)
router.put(
  "/:courseId/guide",
  verifyToken(),
  authorizeRoles("admin"),
  upload.single("guide"),
  courseController.uploadCourseGuide
);

// Chapters
router.get(
  "/:courseId/chapters",
  verifyToken(),
  courseController.getCourseChapters
);

router.post(
  "/:courseId/chapters",
  verifyToken(),
  authorizeRoles("admin"),
  courseController.addCourseChapter
);

module.exports = router;