const pool = require("../config/db");

const uploadMaterial = async ({ course_id, title, description, file_path, file_type, file_size_bytes, uploaded_by }) => {
  // Ensure the material is placed in the 'Uploads' system folder in the unified table
  const instructorFileService = require("./instructorFileService");
  const uploadsFolderId = await instructorFileService.getOrCreateUploadsFolder(uploaded_by);

  const query = `
    INSERT INTO materials (course_id, title, description, file_path, file_type, file_size_bytes, uploaded_by, type, parent_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'file', $8)
    RETURNING *;
  `;

  const values = [course_id, title, description, file_path, file_type, file_size_bytes, uploaded_by, uploadsFolderId];

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
    SELECT id, course_id, title, description, file_path, file_type, file_size_bytes, uploaded_by, created_at, updated_at, is_deleted,
    CASE WHEN course_id IS NOT NULL THEN 'material' ELSE 'storage' END as source
    FROM materials
    WHERE uploaded_by = $1 AND is_deleted = false AND type = 'file'
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [instructor_id]);
  return rows;
};

const deleteMaterial = async (id, instructor_id) => {
  const query = "SELECT id, file_path FROM materials WHERE id = $1 AND uploaded_by = $2";
  const { rows } = await pool.query(query, [id, instructor_id]);

  if (rows.length > 0) {
    const filePath = rows[0].file_path;
    await pool.query("UPDATE materials SET is_deleted = true, deleted_at = NOW() WHERE id = $1", [id]);
    return filePath;
  }

  throw new Error("Unauthorized or material not found");
};

const renameMaterial = async (id, instructor_id, new_title) => {
  const query = "UPDATE materials SET title = $1 WHERE id = $2 AND uploaded_by = $3 RETURNING *";
  const { rows } = await pool.query(query, [new_title, id, instructor_id]);

  if (rows.length === 0) {
    throw new Error("Unauthorized or material not found");
  }
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
