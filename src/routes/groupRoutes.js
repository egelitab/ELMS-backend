const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Generate generic groups for a course
router.post(
    "/:courseId/generate",
    verifyToken(),
    authorizeRoles("instructor"),
    groupController.generateGroups
);

// View groups for a generic course
router.get(
    "/:courseId",
    verifyToken(),
    groupController.getGroups
);

module.exports = router;
