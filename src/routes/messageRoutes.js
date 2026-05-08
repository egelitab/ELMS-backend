const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

// One-to-One messaging
router.post("/", authMiddleware(), messageController.sendMessage);
router.get("/inbox", authMiddleware(), messageController.getInbox);
router.get("/history/:user2_id", authMiddleware(), messageController.getChatHistory);

// Group Chat
router.post("/group", authMiddleware(), messageController.sendGroupMessage);
router.get("/group/inbox", authMiddleware(), messageController.getGroupInbox);
router.get("/group/history/:group_id", authMiddleware(), messageController.getGroupChatHistory);
router.get("/instructor/groups", authMiddleware(), messageController.getAllGroupsForInstructor);

module.exports = router;
