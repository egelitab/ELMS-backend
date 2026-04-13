const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/", verifyToken(), messageController.sendMessage);
router.get("/inbox", verifyToken(), messageController.getInbox);
router.get("/history/:user2_id", verifyToken(), messageController.getChatHistory);

module.exports = router;
