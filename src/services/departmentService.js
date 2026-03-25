const pool = require("../config/db");

exports.getAllDepartments = async () => {
  const result = await pool.query(`
    SELECT id, name
    FROM departments 
    ORDER BY name ASC
  `);
  return result.rows;
};
