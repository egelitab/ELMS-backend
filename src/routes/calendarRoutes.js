const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/upload",
    verifyToken(),
    authorizeRoles("admin"),
    upload.single("file"),
    calendarController.uploadCalendar
);

router.get("/",
    verifyToken(),
    calendarController.getAllCalendars
);

router.delete("/:id",
    verifyToken(),
    authorizeRoles("admin"),
    calendarController.deleteCalendar
);

module.exports = router;
