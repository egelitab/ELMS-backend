const router = require("express").Router();
const departmentController = require("../controllers/departmentController");

// Get all departments
router.get("/", departmentController.getAllDepartments);

// Get all faculties
router.get("/faculties", departmentController.getAllFaculties);

// Get all institutions
router.get("/institutions", departmentController.getAllInstitutions);

// Add a new department
router.post("/", departmentController.addDepartment);

module.exports = router;
