const router = require("express").Router();
const userController = require("../controllers/userController");

// Get all users
router.get("/", userController.getAllUsers);

// Create a new user from admin panel
router.post("/", userController.createUser);

// Toggle user status (active/suspended)
router.patch("/:id/status", userController.toggleStatus);

// Delete user
router.delete("/:id", userController.deleteUser);

module.exports = router;
