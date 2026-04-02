const pool = require("../config/db");

exports.getAllDepartments = async () => {
  const result = await pool.query(`
    SELECT d.id, d.name, f.name as faculty_name 
    FROM departments d
    LEFT JOIN faculties f ON d.faculty_id = f.id
    ORDER BY d.name ASC
  `);
  return result.rows;
};

exports.getAllFaculties = async () => {
  const result = await pool.query(`
    SELECT id, name
    FROM faculties
    ORDER BY name ASC
  `);
  return result.rows;
};

exports.addDepartment = async (departmentData) => {
  const { name, faculty_id } = departmentData;
  const result = await pool.query(`
    INSERT INTO departments (name, faculty_id)
    VALUES ($1, $2)
    RETURNING *
  `, [name, faculty_id]);
  return result.rows[0];
};
