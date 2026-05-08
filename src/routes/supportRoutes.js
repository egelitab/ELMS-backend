const express = require("express");
const router = express.Router();
const supportController = require("../controllers/supportController");
const authMiddleware = require("../middleware/authMiddleware");

// Get all tickets (admin only)
router.get("/", authMiddleware(["admin"]), supportController.getAllTickets);

// Get my tickets (any logged-in user)
router.get("/my-tickets", authMiddleware(), supportController.getMyTickets);

// Get single ticket
router.get("/:id", authMiddleware(), supportController.getTicket);

// Create a ticket (any logged-in user)
router.post("/", authMiddleware(), supportController.createTicket);

// Update ticket status (admin only)
router.patch("/:id/status", authMiddleware(["admin"]), supportController.updateStatus);

// Delete a ticket (admin only)
router.delete("/:id", authMiddleware(["admin"]), supportController.deleteTicket);

module.exports = router;
