const express = require("express");
const router = express.Router();
const goalController = require("../controllers/goalController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/:courseId", authMiddleware(["instructor"]), goalController.createGoal);
router.put("/:goalId", authMiddleware(["instructor"]), goalController.updateGoal);
router.get("/:courseId", authMiddleware(), goalController.getGoalsByCourse);
router.delete("/:goalId", authMiddleware(["instructor"]), goalController.deleteGoal);

module.exports = router;
