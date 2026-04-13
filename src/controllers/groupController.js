const groupService = require("../services/groupService");

const generateGroups = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { studentsPerGroup, departmentId, section, method, title } = req.body;

        if (!studentsPerGroup || studentsPerGroup <= 0) {
            return res.status(400).json({ success: false, message: "Valid students_per_group is required" });
        }

        // You could verify instructor-course ownership here

        const groups = await groupService.generateGroups(courseId, parseInt(studentsPerGroup, 10), departmentId, section, method, title);

        res.status(201).json({
            success: true,
            message: "Groups auto-generated successfully",
            data: groups,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getGroups = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Any enrolled student or instructor can view the groups
        // Should add participation check here optionally

        const groups = await groupService.getGroupsByCourse(courseId);
        res.json({ success: true, data: groups });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    generateGroups,
    getGroups
};
