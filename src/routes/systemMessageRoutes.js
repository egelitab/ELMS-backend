const express = require("express");
const router = express.Router();
const systemMessageController = require("../controllers/systemMessageController");
const verifyToken = require("../middleware/authMiddleware");

// Admin routes
router.post("/send", verifyToken(['admin']), systemMessageController.sendSystemMessage);
router.get("/sent", verifyToken(['admin']), systemMessageController.getAdminSentMessages);

// User route (for both students and instructors)
router.get("/my-messages", verifyToken(), systemMessageController.getMessagesForUser);

module.exports = router;
