const router = require("express").Router();
const departmentController = require("../controllers/departmentController");
const authMiddleware = require("../middleware/authMiddleware");

// Get all departments
router.get("/", authMiddleware(), departmentController.getAllDepartments);

// Get all faculties
router.get("/faculties", authMiddleware(), departmentController.getAllFaculties);

// Get all institutions
router.get("/institutions", authMiddleware(), departmentController.getAllInstitutions);

// Add a new department (admin only)
router.post("/", authMiddleware(["admin"]), departmentController.addDepartment);

// Get sections for a department
router.get("/:departmentId/sections", authMiddleware(), departmentController.getDepartmentSections);

module.exports = router;
