const express = require("express");
const router = express.Router();
const materialController = require("../controllers/materialController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Only instructors can upload materials
router.post(
    "/",
    verifyToken(),
    authorizeRoles("instructor"),
    upload.single("file"), // the name attribute in form-data should be 'file'
    materialController.uploadMaterial
);

// Any logged-in user can view materials for a specific course
router.get("/course/:courseId", verifyToken(), materialController.getMaterialsByCourse);

// Get all materials uploaded by the instructor
router.get(
    "/instructor",
    verifyToken(),
    authorizeRoles("instructor"),
    materialController.getInstructorMaterials
);

// Only instructors can delete their materials
router.delete(
    "/:id",
    verifyToken(),
    authorizeRoles("instructor"),
    materialController.deleteMaterial
);

// Only instructors can rename their materials
router.patch(
    "/:id/rename",
    verifyToken(),
    authorizeRoles("instructor"),
    materialController.renameMaterial
);

// Instructors can share their materials with specific target sections
router.post(
    "/share",
    verifyToken(),
    authorizeRoles("instructor"),
    materialController.shareMaterials
);

module.exports = router;
