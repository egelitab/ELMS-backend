const courseService = require("../services/courseService");
const { logActivity } = require("../services/activityLogger");

const createCourse = async (req, res) => {
  try {
    const { course_code, title, description, department_id, department_ids, instructor_id, year, semester } = req.body;

    if (!course_code || !title) {
      return res.status(400).json({
        success: false,
        message: "Course code and title are required",
      });
    }

    // If an admin is creating the course, they might provide an instructor_id.
    // Otherwise, use the ID of the person making the request.
    const final_instructor_id = instructor_id || req.user.id;

    const course = await courseService.createCourse({
      course_code,
      title,
      description,
      instructor_id: final_instructor_id,
      department_id,
      department_ids,
      year,
      semester
    });

    // Log activity
    await logActivity(req.user.id, 'CREATE_COURSE', course.id, 'course');

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
    const filters = {
      department_id: req.query.department_id,
      faculty_id: req.query.faculty_id,
      institution_id: req.query.institution_id,
      year: req.query.year,
      semester: req.query.semester,
      search: req.query.search,
      sort: req.query.sort
    };
    const courses = await courseService.getAllCourses(filters);
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

const getCourseEnrollmentStats = async (req, res) => {
  try {
    const { courseId } = req.params;
    const stats = await courseService.getCourseEnrollmentStats(courseId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const uploadCourseGuide = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF file uploaded" });
    }

    const guideUrl = `/uploads/${req.file.filename}`;
    const course = await courseService.updateCourseGuide(courseId, guideUrl);

    // Log activity
    await logActivity(req.user.id, 'UPLOAD_COURSE_GUIDE', courseId, 'course');

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCourseChapters = async (req, res) => {
  try {
    const { courseId } = req.params;
    const chapters = await courseService.getCourseChapters(courseId);
    res.json({
      success: true,
      data: chapters
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addCourseChapter = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, order_index } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Chapter title is required" });
    }

    const chapter = await courseService.addChapter(courseId, title, order_index || 0);

    // Log activity
    await logActivity(req.user.id, 'ADD_CHAPTER', chapter.id, 'chapter');

    res.status(201).json({
      success: true,
      data: chapter
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentCourses = async (req, res) => {
  try {
    const student_id = req.user.id;
    const courses = await courseService.getStudentCourses(student_id);
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

module.exports = {
  createCourse,
  getAllCourses,
  getInstructorCourses,
  getStudentCourses,
  getInstructorTargets,
  getCourseEnrollmentStats,
  uploadCourseGuide,
  getCourseChapters,
  addCourseChapter,
};