const pool = require("../config/db");

const uploadMaterial = async ({ course_id, title, description, file_path, file_type, file_size_bytes, uploaded_by }) => {
  const query = `
    INSERT INTO materials (course_id, title, description, file_path, file_type, file_size_bytes, uploaded_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [course_id, title, description, file_path, file_type, file_size_bytes, uploaded_by];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

const getMaterialsByCourse = async (course_id) => {
  const query = `
    SELECT id, title, description, file_path, file_type, file_size_bytes, created_at
    FROM materials
    WHERE course_id = $1
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [course_id]);
  return rows;
};

const getInstructorMaterials = async (instructor_id) => {
  const query = `
    SELECT *
    FROM materials
    WHERE uploaded_by = $1
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [instructor_id]);
  return rows;
};

const deleteMaterial = async (id, instructor_id) => {
  // First verify if the material belongs to a course the instructor owns
  const checkQuery = `
    SELECT m.file_path 
    FROM materials m
    JOIN courses c ON m.course_id = c.id
    WHERE m.id = $1 AND c.instructor_id = $2
  `;
  const checkResult = await pool.query(checkQuery, [id, instructor_id]);

  if (checkResult.rows.length === 0) {
    throw new Error("Unauthorized or material not found");
  }

  const filePath = checkResult.rows[0].file_path;

  // Delete from DB
  await pool.query("DELETE FROM materials WHERE id = $1", [id]);

  return filePath;
};

const renameMaterial = async (id, instructor_id, new_title) => {
  const checkQuery = `
    SELECT m.id 
    FROM materials m
    WHERE m.id = $1 AND m.uploaded_by = $2
  `;
  const checkResult = await pool.query(checkQuery, [id, instructor_id]);
  if (checkResult.rows.length === 0) {
    throw new Error("Unauthorized or material not found");
  }

  const query = `UPDATE materials SET title = $1 WHERE id = $2 RETURNING *`;
  const { rows } = await pool.query(query, [new_title, id]);
  return rows[0];
};

const shareMaterials = async (material_ids, department_id, section) => {
  const values = [];
  let queryText = "INSERT INTO material_shares (material_id, department_id, section) VALUES ";
  let paramIndex = 1;
  const placeholders = [];

  for (const mid of material_ids) {
    placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
    values.push(mid, department_id, section || null);
  }

  queryText += placeholders.join(", ");

  await pool.query(queryText, values);
};

module.exports = {
  uploadMaterial,
  getMaterialsByCourse,
  getInstructorMaterials,
  deleteMaterial,
  renameMaterial,
  shareMaterials,
};
