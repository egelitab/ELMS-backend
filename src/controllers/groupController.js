const groupService = require("../services/groupService");

exports.generateGroups = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { studentsPerGroup, departmentId, section, method, title } = req.body;

        if (!studentsPerGroup || studentsPerGroup <= 0) {
            return res.status(400).json({ success: false, message: "Valid students_per_group is required" });
        }

        const groups = await groupService.generateGroups(courseId, parseInt(studentsPerGroup, 10), departmentId, section, method, title);
        res.status(201).json({ success: true, message: "Groups auto-generated successfully", data: groups });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getGroups = async (req, res) => {
    try {
        const { courseId } = req.params;
        const groups = await groupService.getGroupsByCourse(courseId);
        res.json({ success: true, data: groups });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteBatch = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { batchName } = req.query;

        await groupService.deleteGroupsByBatch(courseId, batchName);
        res.json({ success: true, message: "Group set deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStudentGroups = async (req, res) => {
    try {
        const groups = await groupService.getGroupsForUser(req.user.id);
        res.json({ success: true, data: groups });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
