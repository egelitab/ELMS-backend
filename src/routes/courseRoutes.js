const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Only instructor can create course
router.post(
  "/",
  verifyToken,
  authorizeRoles("instructor"),
  courseController.createCourse
);

// Anyone logged in can view courses
router.get("/", verifyToken, courseController.getAllCourses);

module.exports = router;