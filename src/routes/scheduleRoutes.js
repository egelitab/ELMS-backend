const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

// All schedule routes require admin or instructor roles, but usually admin for global uploads
router.post("/upload",
    verifyToken(),
    authorizeRoles("admin"),
    upload.single("file"),
    scheduleController.uploadSchedule
);

router.get("/",
    verifyToken(),
    scheduleController.getAllSchedules
);

module.exports = router;
