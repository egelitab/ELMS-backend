const express = require("express");
const router = express.Router();
const systemMessageController = require("../controllers/systemMessageController");
const authMiddleware = require("../middleware/authMiddleware");

// Admin routes
router.post("/send", authMiddleware(["admin"]), systemMessageController.sendSystemMessage);
router.get("/sent", authMiddleware(["admin"]), systemMessageController.getAdminSentMessages);

// User route (for both students and instructors)
router.get("/my-messages", authMiddleware(), systemMessageController.getMessagesForUser);

module.exports = router;
