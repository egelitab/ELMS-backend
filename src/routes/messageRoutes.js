const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const verifyToken = require("../middleware/authMiddleware");

// One-to-One
router.post("/", verifyToken(), messageController.sendMessage);
router.get("/inbox", verifyToken(), messageController.getInbox);
router.get("/history/:user2_id", verifyToken(), messageController.getChatHistory);

// Group Chat
router.post("/group", verifyToken(), messageController.sendGroupMessage);
router.get("/group/inbox", verifyToken(), messageController.getGroupInbox);
router.get("/group/history/:group_id", verifyToken(), messageController.getGroupChatHistory);
router.get("/instructor/groups", verifyToken(), messageController.getAllGroupsForInstructor);

module.exports = router;
