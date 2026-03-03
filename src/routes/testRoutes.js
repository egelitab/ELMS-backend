const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");

// Test route for instructors only
router.get("/instructor-only", authMiddleware(["instructor"]), (req, res) => {
  res.json({
    success: true,
    message: `Hello ${req.user.role}, you have access to instructor-only content!`,
    user: req.user,
  });
});

// Test route for students only
router.get("/student-only", authMiddleware(["student"]), (req, res) => {
  res.json({
    success: true,
    message: `Hello ${req.user.role}, you have access to student-only content!`,
    user: req.user,
  });
});

// Test route for any authenticated user
router.get("/any-auth", authMiddleware(), (req, res) => {
  res.json({
    success: true,
    message: `Hello ${req.user.role}, you are authenticated!`,
    user: req.user,
  });
});

module.exports = router;