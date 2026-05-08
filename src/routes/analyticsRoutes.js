const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");

// Student analytics
router.get("/student/overview", authMiddleware(["student"]), analyticsController.getStudentOverview);
router.get("/student/grades", authMiddleware(["student"]), analyticsController.getStudentGradesByCourse);

// Instructor analytics
router.get("/instructor/overview", authMiddleware(["instructor"]), analyticsController.getInstructorOverview);
router.get("/instructor/course/:courseId", authMiddleware(["instructor"]), analyticsController.getCourseAnalytics);

module.exports = router;
