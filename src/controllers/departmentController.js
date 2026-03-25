const departmentService = require("../services/departmentService");

exports.getAllDepartments = async (req, res) => {
    try {
        const departments = await departmentService.getAllDepartments();
        res.json({ success: true, data: departments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
