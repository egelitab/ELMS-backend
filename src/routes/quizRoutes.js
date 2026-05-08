const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");
const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// Instructor Routes
// ==========================================

// Create a quiz
router.post("/", authMiddleware(["instructor"]), quizController.createQuiz);

// Add a question to a quiz
router.post("/:quizId/questions", authMiddleware(["instructor"]), quizController.addQuestion);

// Publish a quiz
router.put("/:quizId/publish", authMiddleware(["instructor"]), quizController.publishQuiz);

// Delete a quiz
router.delete("/:quizId", authMiddleware(["instructor"]), quizController.deleteQuiz);

// Delete a question
router.delete("/questions/:questionId", authMiddleware(["instructor"]), quizController.deleteQuestion);

// ==========================================
// Shared Routes
// ==========================================

// Get quizzes for a course (instructors see unpublished too)
router.get("/course/:courseId", authMiddleware(), quizController.getQuizzesByCourse);

// Get quiz with questions
router.get("/:quizId", authMiddleware(), quizController.getQuiz);

// ==========================================
// Student Routes
// ==========================================

// Start a quiz attempt
router.post("/:quizId/start", authMiddleware(["student"]), quizController.startAttempt);

// Submit a quiz attempt
router.post("/attempts/:attemptId/submit", authMiddleware(["student"]), quizController.submitAttempt);

// Get my attempts for a quiz
router.get("/:quizId/my-attempts", authMiddleware(["student"]), quizController.getMyAttempts);

// Get attempt detail (with answers)
router.get("/attempts/:attemptId", authMiddleware(), quizController.getAttemptDetail);

module.exports = router;
