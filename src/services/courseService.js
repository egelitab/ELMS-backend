const pool = require("../config/db");

const createCourse = async ({ course_code, title, description, instructor_id, department_id, year, semester }) => {
  const query = `
    INSERT INTO courses (course_code, title, description, instructor_id, department_id, year, semester)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [course_code, title, description, instructor_id, department_id, year, semester];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

const updateCourseGuide = async (courseId, guideUrl) => {
  const query = "UPDATE courses SET course_guide_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *";
  const { rows } = await pool.query(query, [guideUrl, courseId]);
  return rows[0];
};

const addChapter = async (courseId, title, orderIndex) => {
  const query = `
    INSERT INTO course_chapters (course_id, title, order_index)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [courseId, title, orderIndex]);
  return rows[0];
};

const getCourseChapters = async (courseId) => {
  const query = "SELECT * FROM course_chapters WHERE course_id = $1 ORDER BY order_index ASC";
  const { rows } = await pool.query(query, [courseId]);
  return rows;
};

const getAllCourses = async (filters = {}) => {
  let query = `
    SELECT c.*, d.name as department_name, f.name as faculty_name, i.name as institution_name,
           u.first_name || ' ' || u.last_name as instructor_name
    FROM courses c
    JOIN departments d ON c.department_id = d.id
    JOIN faculties f ON d.faculty_id = f.id
    JOIN institutions i ON f.institution_id = i.id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE 1=1
  `;
  const values = [];
  let paramCount = 1;

  if (filters.department_id) {
    query += ` AND c.department_id = $${paramCount++}`;
    values.push(filters.department_id);
  }
  if (filters.faculty_id) {
    query += ` AND d.faculty_id = $${paramCount++}`;
    values.push(filters.faculty_id);
  }
  if (filters.institution_id) {
    query += ` AND f.institution_id = $${paramCount++}`;
    values.push(filters.institution_id);
  }
  if (filters.year) {
    query += ` AND c.year = $${paramCount++}`;
    values.push(filters.year);
  }
  if (filters.semester) {
    query += ` AND c.semester = $${paramCount++}`;
    values.push(filters.semester);
  }
  if (filters.search) {
    query += ` AND (c.title ILIKE $${paramCount} OR c.course_code ILIKE $${paramCount})`;
    values.push(`%${filters.search}%`);
    paramCount++;
  }

  let orderBy = 'c.created_at DESC';
  if (filters.sort === 'code') orderBy = 'c.course_code ASC';
  else if (filters.sort === 'title') orderBy = 'c.title ASC';
  else if (filters.sort === 'newest') orderBy = 'c.created_at DESC';

  query += ` ORDER BY ${orderBy}`;

  const { rows } = await pool.query(query, values);
  return rows;
};

const getInstructorCourses = async (instructor_id) => {
  const query = `
    SELECT c.*, COUNT(e.student_id)::int as student_count
    FROM courses c
    LEFT JOIN enrollments e ON c.id = e.course_id
    WHERE c.instructor_id = $1
    GROUP BY c.id
  `;
  const { rows } = await pool.query(query, [instructor_id]);
  return rows;
};

const getInstructorTargets = async (instructor_id) => {
  const query = `
    SELECT DISTINCT d.id as department_id, d.name as department_name, u.section 
    FROM enrollments e 
    JOIN users u ON e.student_id = u.id 
    JOIN courses c ON e.course_id = c.id 
    JOIN departments d ON u.department_id = d.id
    WHERE c.instructor_id = $1 AND u.section IS NOT NULL
    ORDER BY d.name, u.section
  `;

  const { rows } = await pool.query(query, [instructor_id]);

  // Group results by department
  const deptsMap = {};
  rows.forEach(row => {
    if (!deptsMap[row.department_id]) {
      deptsMap[row.department_id] = {
        id: row.department_id,
        name: row.department_name,
        sections: []
      };
    }
    if (!deptsMap[row.department_id].sections.includes(row.section)) {
      deptsMap[row.department_id].sections.push(row.section);
    }
  });

  return Object.values(deptsMap);
};

const getCourseEnrollmentStats = async (course_id) => {
  const query = `
    SELECT d.id as department_id, d.name as department_name, u.section, COUNT(e.student_id)::int as student_count
    FROM enrollments e
    JOIN users u ON e.student_id = u.id
    JOIN departments d ON u.department_id = d.id
    WHERE e.course_id = $1
    GROUP BY d.id, d.name, u.section
  `;
  const { rows } = await pool.query(query, [course_id]);
  return rows;
};

const getStudentCourses = async (studentId) => {
  const query = `
    SELECT c.*, u.first_name || ' ' || u.last_name as instructor_name
    FROM courses c
    JOIN enrollments e ON c.id = e.course_id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE e.student_id = $1
  `;
  const { rows } = await pool.query(query, [studentId]);
  return rows;
};

module.exports = {
  createCourse,
  getAllCourses,
  getInstructorCourses,
  getStudentCourses,
  getInstructorTargets,
  getCourseEnrollmentStats,
  updateCourseGuide,
  addChapter,
  getCourseChapters,
};