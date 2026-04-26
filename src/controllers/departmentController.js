const departmentService = require("../services/departmentService");
const { logActivity } = require("../services/activityLogger");

exports.getAllDepartments = async (req, res) => {
    try {
        const departments = await departmentService.getAllDepartments();
        res.json({ success: true, data: departments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllFaculties = async (req, res) => {
    try {
        const faculties = await departmentService.getAllFaculties();
        res.json({ success: true, data: faculties });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addDepartment = async (req, res) => {
    try {
        const newDept = await departmentService.addDepartment(req.body);

        // Log activity
        await logActivity(req.user.id, 'ADD_DEPARTMENT', newDept.id, 'department');

        res.status(201).json({ success: true, data: newDept });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllInstitutions = async (req, res) => {
    try {
        const institutions = await departmentService.getAllInstitutions();
        res.json({ success: true, data: institutions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
