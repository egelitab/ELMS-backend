const router = require("express").Router();
const userController = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

// Get all users
router.get("/", authMiddleware(["admin"]), userController.getAllUsers);

// Update own profile
router.patch("/me", authMiddleware(), userController.updateMe);

// Create a new user from admin panel
router.post("/", authMiddleware(["admin"]), userController.createUser);

// Toggle user status (active/suspended)
router.patch("/:id/status", authMiddleware(["admin"]), userController.toggleStatus);

// Delete user
router.delete("/:id", authMiddleware(["admin"]), userController.deleteUser);

module.exports = router;
