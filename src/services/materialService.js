const pool = require("../config/db");

const uploadMaterial = async ({ course_id, title, description, file_path, file_type, file_size_bytes, uploaded_by }) => {
  // Now uploads are private by default in Uploads folder
  const instructorFileService = require("./instructorFileService");
  const uploadsFolderId = await instructorFileService.getOrCreateUploadsFolder(uploaded_by);

  const query = `
    INSERT INTO materials (title, description, file_path, file_type, file_size_bytes, uploaded_by, type, parent_id)
    VALUES ($1, $2, $3, $4, $5, $6, 'file', $7)
    RETURNING *;
  `;
  const values = [title, description, file_path, file_type, file_size_bytes, uploaded_by, uploadsFolderId];
  const { rows } = await pool.query(query, values);
  const material = rows[0];

  // If course_id is provided during upload (legacy or shortcut), share it immediately
  if (course_id) {
    await shareMaterials([material.id], course_id, null, null);
  }

  return material;
};

const getMaterialsByCourse = async (course_id) => {
  const query = `
    SELECT m.id, m.title, m.description, m.file_path, m.file_type, m.file_size_bytes, m.created_at
    FROM materials m
    JOIN material_shares ms ON m.id = ms.material_id
    WHERE ms.course_id = $1 AND m.is_deleted = false
    ORDER BY m.created_at DESC;
  `;
  const { rows } = await pool.query(query, [course_id]);
  return rows;
};

const getInstructorMaterials = async (instructor_id) => {
  const query = `
    SELECT m.id, m.title, m.description, m.file_path, m.file_type, m.file_size_bytes, m.uploaded_by, m.created_at, m.updated_at, m.is_deleted,
    CASE WHEN EXISTS (SELECT 1 FROM material_shares ms WHERE ms.material_id = m.id) THEN 'shared' ELSE 'storage' END as source
    FROM materials m
    WHERE m.uploaded_by = $1 AND m.is_deleted = false AND m.type = 'file'
    ORDER BY m.created_at DESC;
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

const shareMaterials = async (material_ids, course_id, department_id, section) => {
  const values = [];
  let queryText = "INSERT INTO material_shares (material_id, course_id, department_id, section) VALUES ";
  let paramIndex = 1;
  const placeholders = [];

  for (const mid of material_ids) {
    placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
    values.push(mid, course_id || null, department_id || null, section || null);
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
