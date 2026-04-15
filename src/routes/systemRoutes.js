const router = require("express").Router();
const systemController = require("../controllers/systemController");
const authMiddleware = require("../middleware/authMiddleware");

// All system routes require admin role
router.get("/stats", authMiddleware(["admin"]), systemController.getStats);
router.get("/logs", authMiddleware(["admin"]), systemController.getLogs);
router.get("/tickets", authMiddleware(["admin"]), systemController.getTickets);
router.post("/backup", authMiddleware(["admin"]), systemController.triggerBackup);

module.exports = router;
