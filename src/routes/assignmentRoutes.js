const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignmentController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ========================
// Instructor Routes
// ========================

// Get grading overview
router.get("/grading-overview", authMiddleware(["instructor"]), assignmentController.getGradingOverview);

// Create an assignment
router.post("/", authMiddleware(["instructor"]), upload.single("file"), assignmentController.createAssignment);

// Get all assignments for a course
router.get("/course/:courseId", authMiddleware(), assignmentController.getAssignments);

// View submissions for an assignment
router.get("/:assignmentId/submissions", authMiddleware(["instructor"]), assignmentController.viewSubmissions);

// Grade a submission
router.put("/submissions/:id/grade", authMiddleware(["instructor"]), assignmentController.gradeSubmission);

// ========================
// Student Routes
// ========================

// Submit an assignment
router.post("/submit", authMiddleware(["student"]), upload.single("file"), assignmentController.submitAssignment);

// Get all assignments for the logged-in student
router.get("/student/my-assignments", authMiddleware(["student"]), assignmentController.getStudentAssignments);

module.exports = router;
