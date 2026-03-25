const router = require("express").Router();
const departmentController = require("../controllers/departmentController");

// Get all departments
router.get("/", departmentController.getAllDepartments);

module.exports = router;
