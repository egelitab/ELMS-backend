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
    SELECT id, course_id, title, description, file_path, file_type, file_size_bytes, uploaded_by, created_at, updated_at, is_deleted, 'material' as source
    FROM materials
    WHERE uploaded_by = $1 AND is_deleted = false
    UNION ALL
    SELECT id, NULL as course_id, name as title, '' as description, file_path, file_type, file_size_bytes, instructor_id as uploaded_by, created_at, updated_at, is_deleted, 'storage' as source
    FROM instructor_files
    WHERE instructor_id = $1 AND is_deleted = false
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [instructor_id]);
  return rows;
};

const deleteMaterial = async (id, instructor_id) => {
  // Try to find in materials first
  let query = "SELECT id, file_path FROM materials WHERE id = $1 AND uploaded_by = $2";
  let { rows } = await pool.query(query, [id, instructor_id]);

  if (rows.length > 0) {
    const filePath = rows[0].file_path;
    await pool.query("UPDATE materials SET is_deleted = true, deleted_at = NOW() WHERE id = $1", [id]);
    return filePath;
  }

  // Try in instructor_files
  query = "SELECT id, file_path FROM instructor_files WHERE id = $1 AND instructor_id = $2";
  const { rows: files } = await pool.query(query, [id, instructor_id]);
  if (files.length > 0) {
    const filePath = files[0].file_path;
    await pool.query("UPDATE instructor_files SET is_deleted = true, deleted_at = NOW() WHERE id = $1", [id]);
    return filePath;
  }

  throw new Error("Unauthorized or material not found");
};

const renameMaterial = async (id, instructor_id, new_title) => {
  // Try materials
  let query = "UPDATE materials SET title = $1 WHERE id = $2 AND uploaded_by = $3 RETURNING *";
  let { rows } = await pool.query(query, [new_title, id, instructor_id]);

  if (rows.length === 0) {
    // Try instructor_files
    query = "UPDATE instructor_files SET name = $1 WHERE id = $2 AND instructor_id = $3 RETURNING *";
    const result = await pool.query(query, [new_title, id, instructor_id]);
    if (result.rows.length > 0) {
      return { ...result.rows[0], title: result.rows[0].name };
    }
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
