const pool = require("../config/db");

const createCourse = async ({ course_code, title, description, instructor_id, department_id }) => {
  const query = `
    INSERT INTO courses (course_code, title, description, instructor_id, department_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [course_code, title, description, instructor_id, department_id];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

const getAllCourses = async () => {
  const { rows } = await pool.query("SELECT * FROM courses");
  return rows;
};

const getInstructorCourses = async (instructor_id) => {
  const { rows } = await pool.query("SELECT * FROM courses WHERE instructor_id = $1", [instructor_id]);
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

module.exports = {
  createCourse,
  getAllCourses,
  getInstructorCourses,
  getInstructorTargets,
};