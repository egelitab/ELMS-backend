const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");
const authMiddleware = require("../middleware/authMiddleware");

// Enroll a single student (admin or instructor)
router.post("/", authMiddleware(["admin", "instructor"]), enrollmentController.enrollStudent);

// Unenroll a student (admin or instructor)
router.delete("/", authMiddleware(["admin", "instructor"]), enrollmentController.unenrollStudent);

// Get all enrollments for a course
router.get("/course/:courseId", authMiddleware(), enrollmentController.getEnrollmentsByCourse);

// Bulk enroll by user IDs
router.post("/bulk", authMiddleware(["admin", "instructor"]), enrollmentController.bulkEnroll);

// Bulk enroll by department/year/section filter
router.post("/bulk-department", authMiddleware(["admin", "instructor"]), enrollmentController.bulkEnrollByDepartment);

module.exports = router;
