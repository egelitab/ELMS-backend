const express = require("express");
const router = express.Router();
const materialController = require("../controllers/materialController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Only instructors can upload materials
router.post(
    "/",
    verifyToken,
    authorizeRoles("instructor"),
    upload.single("file"), // the name attribute in form-data should be 'file'
    materialController.uploadMaterial
);

// Any logged-in user can view materials for a specific course
router.get("/course/:courseId", verifyToken, materialController.getMaterialsByCourse);

// Only instructors can delete their materials
router.delete(
    "/:id",
    verifyToken,
    authorizeRoles("instructor"),
    materialController.deleteMaterial
);

module.exports = router;
