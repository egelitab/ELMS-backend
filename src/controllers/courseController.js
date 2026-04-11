const courseService = require("../services/courseService");

const createCourse = async (req, res) => {
  try {
    const { course_code, title, description, department_id } = req.body;

    if (!course_code || !title) {
      return res.status(400).json({
        success: false,
        message: "Course code and title are required",
      });
    }

    const instructor_id = req.user.id; // from JWT middleware

    const course = await courseService.createCourse({
      course_code,
      title,
      description,
      instructor_id,
      department_id,
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await courseService.getAllCourses();
    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getInstructorCourses = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const courses = await courseService.getInstructorCourses(instructor_id);
    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getInstructorTargets = async (req, res) => {
  try {
    const instructor_id = req.user.id;
    const targets = await courseService.getInstructorTargets(instructor_id);
    res.json({
      success: true,
      data: targets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getInstructorCourses,
  getInstructorTargets,
};