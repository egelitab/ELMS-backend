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

module.exports = {
  createCourse,
  getAllCourses,
};