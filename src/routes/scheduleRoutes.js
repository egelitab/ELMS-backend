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

router.get("/my-schedule",
    verifyToken(),
    scheduleController.getMySchedules
);

router.get("/",
    verifyToken(),
    scheduleController.getAllSchedules
);

router.delete("/:id",
    verifyToken(),
    authorizeRoles("admin"),
    scheduleController.deleteSchedule
);

router.patch("/:id/content",
    verifyToken(),
    authorizeRoles("admin"),
    scheduleController.updateDigitalContent
);

module.exports = router;
