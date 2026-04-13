const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignmentController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ========================
// Instructor Routes
// ========================

// Get overview of all assignments and grading status
router.get(
    "/grading-overview",
    verifyToken(),
    authorizeRoles("instructor"),
    assignmentController.getGradingOverview
);

// Create an assignment
router.post(
    "/",
    verifyToken(),
    authorizeRoles("instructor"),
    upload.single("file"), // Optional attachment when creating assignment
    assignmentController.createAssignment
);

// Get all assignments for a specific course
router.get("/course/:courseId", verifyToken(), assignmentController.getAssignments);

// View all submissions for a specific assignment
router.get(
    "/:assignmentId/submissions",
    verifyToken(),
    authorizeRoles("instructor"),
    assignmentController.viewSubmissions
);

// Grade a specific submission
router.put(
    "/submissions/:id/grade",
    verifyToken(),
    authorizeRoles("instructor"),
    assignmentController.gradeSubmission
);

// ========================
// Student Routes
// ========================

// Submit an assignment
router.post(
    "/submit",
    verifyToken(),
    authorizeRoles("student"),
    upload.single("file"), // the submitted work
    assignmentController.submitAssignment
);

module.exports = router;
