const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware(), notificationController.getNotifications);
router.put("/mark-all-read", authMiddleware(), notificationController.markAllAsRead);
router.put("/:id/read", authMiddleware(), notificationController.markAsRead);
router.get("/settings", authMiddleware(), notificationController.getSettings);
router.put("/settings", authMiddleware(), notificationController.updateSettings);

module.exports = router;
