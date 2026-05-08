const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const authMiddleware = require("../middleware/authMiddleware");

// Instructor: create a new attendance session
router.post("/sessions", authMiddleware(["instructor"]), attendanceController.createSession);

// Instructor: get all sessions for a course
router.get("/course/:courseId/sessions", authMiddleware(["instructor"]), attendanceController.getSessions);

// Instructor: get session detail with student records
router.get("/sessions/:sessionId", authMiddleware(["instructor"]), attendanceController.getSessionDetail);

// Instructor: mark/update attendance for a session
router.put("/sessions/:sessionId/mark", authMiddleware(["instructor"]), attendanceController.markAttendance);

// Instructor: delete a session
router.delete("/sessions/:sessionId", authMiddleware(["instructor"]), attendanceController.deleteSession);

// Student: view own attendance for a course
router.get("/student/course/:courseId", authMiddleware(["student"]), attendanceController.getStudentAttendance);

module.exports = router;
