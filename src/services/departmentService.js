const pool = require("../config/db");

exports.getAllDepartments = async () => {
  const result = await pool.query(`
    SELECT d.id, d.name, d.description, f.name as faculty_name,
           u.first_name || ' ' || u.last_name as person_in_charge
    FROM departments d
    LEFT JOIN faculties f ON d.faculty_id = f.id
    LEFT JOIN users u ON d.head_of_department_id = u.id
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

exports.getAllInstitutions = async () => {
  const result = await pool.query(`
    SELECT id, name
    FROM institutions
    ORDER BY name ASC
  `);
  return result.rows;
};

exports.getDepartmentSections = async (departmentId) => {
  const result = await pool.query(`
    SELECT DISTINCT section
    FROM users
    WHERE department_id = $1 AND section IS NOT NULL AND section != ''
    ORDER BY section ASC
  `, [departmentId]);
  return result.rows.map(r => r.section);
};
