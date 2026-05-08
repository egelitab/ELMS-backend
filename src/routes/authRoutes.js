const router = require("express").Router();
const authController = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimiter");

// Apply rate limiting to all auth routes
router.use(authLimiter);

router.post("/register", authController.register);
router.post("/login", authController.login);

// Password reset flow
router.post("/forgot-password", authController.requestPasswordReset);
router.post("/verify-reset-code", authController.verifyResetCode);
router.post("/reset-password", authController.resetPassword);

module.exports = router;