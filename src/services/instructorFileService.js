const pool = require("../config/db");

const createFolder = async (name, parent_id, instructor_id) => {
    // Check for duplicate name in materials in the same path
    const checkQuery = parent_id
        ? "SELECT id FROM materials WHERE uploaded_by = $1 AND title = $2 AND parent_id = $3 AND is_deleted = false"
        : "SELECT id FROM materials WHERE uploaded_by = $1 AND title = $2 AND parent_id IS NULL AND is_deleted = false";

    const params = parent_id ? [instructor_id, name, parent_id] : [instructor_id, name];
    const { rows: existing } = await pool.query(checkQuery, params);

    if (existing.length > 0) {
        throw new Error("A folder or file with this name already exists in this location.");
    }

    const query = `
        INSERT INTO materials (title, parent_id, uploaded_by, type, file_path)
        VALUES ($1, $2, $3, 'folder', '')
        RETURNING id, title as name, parent_id, created_at;
    `;
    const { rows } = await pool.query(query, [name, parent_id || null, instructor_id]);
    return rows[0];
};

const getOrCreateUploadsFolder = async (instructor_id) => {
    const checkQuery = "SELECT id FROM materials WHERE uploaded_by = $1 AND title = 'Uploads' AND parent_id IS NULL AND type = 'folder'";
    const { rows } = await pool.query(checkQuery, [instructor_id]);

    if (rows.length > 0) return rows[0].id;

    const query = `
        INSERT INTO materials (title, parent_id, uploaded_by, type, file_path)
        VALUES ('Uploads', NULL, $1, 'folder', '')
        RETURNING id;
    `;
    const { rows: result } = await pool.query(query, [instructor_id]);
    return result[0].id;
};

const getFolders = async (instructor_id, parent_id) => {
    if (!parent_id) {
        await getOrCreateUploadsFolder(instructor_id);
    }

    const query = parent_id
        ? `SELECT m.id, m.title as name, m.parent_id, m.created_at, 
           (SELECT COUNT(*)::int FROM materials c WHERE c.parent_id = m.id AND c.is_deleted = false) as item_count 
           FROM materials m WHERE m.uploaded_by = $1 AND m.parent_id = $2 AND m.type = 'folder' AND m.is_deleted = false 
           ORDER BY m.created_at DESC`
        : `SELECT m.id, m.title as name, m.parent_id, m.created_at, 
           (SELECT COUNT(*)::int FROM materials c WHERE c.parent_id = m.id AND c.is_deleted = false) as item_count 
           FROM materials m WHERE m.uploaded_by = $1 AND m.parent_id IS NULL AND m.type = 'folder' AND m.is_deleted = false 
           ORDER BY m.created_at DESC`;
    const params = parent_id ? [instructor_id, parent_id] : [instructor_id];
    const { rows } = await pool.query(query, params);
    return rows;
};

const uploadFile = async ({ name, folder_id, instructor_id, file_path, file_type, file_size_bytes }) => {
    let targetFolderId = folder_id;
    if (!targetFolderId) {
        targetFolderId = await getOrCreateUploadsFolder(instructor_id);
    }

    let finalName = name;
    let nameWithoutExt = name;
    let ext = "";
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex > 0 && dotIndex < name.length - 1) {
        nameWithoutExt = name.substring(0, dotIndex);
        ext = name.substring(dotIndex);
    }

    let currentNameBase = nameWithoutExt;
    while (true) {
        const checkQuery = "SELECT id FROM materials WHERE uploaded_by = $1 AND title = $2 AND parent_id = $3 AND is_deleted = false";
        const { rows: existing } = await pool.query(checkQuery, [instructor_id, finalName, targetFolderId]);
        if (existing.length === 0) break;

        const match = currentNameBase.match(/_(\d+)$/);
        if (match) {
            const num = parseInt(match[1]) + 1;
            currentNameBase = currentNameBase.substring(0, match.index) + `_${num}`;
        } else {
            currentNameBase = `${currentNameBase}_1`;
        }
        finalName = `${currentNameBase}${ext}`;
    }

    const query = `
        INSERT INTO materials (title, parent_id, uploaded_by, file_path, file_type, file_size_bytes, type)
        VALUES ($1, $2, $3, $4, $5, $6, 'file')
        RETURNING id, title as name, parent_id as folder_id, file_path, file_type, file_size_bytes, created_at;
    `;
    const { rows } = await pool.query(query, [finalName, targetFolderId, instructor_id, file_path, file_type, file_size_bytes]);
    return rows[0];
};

const getFiles = async (instructor_id, folder_id) => {
    // Note: The explorer expects both 'material' source and 'storage' source.
    // In one-table mode, they are all 'material' records effectively.
    // However, Course materials have a course_id.

    let query;
    let params;

    if (folder_id) {
        query = `
            SELECT id, title as name, parent_id as folder_id, uploaded_by as instructor_id, file_path, file_type, file_size_bytes, created_at, updated_at, is_deleted, 
            CASE WHEN EXISTS (SELECT 1 FROM material_shares ms WHERE ms.material_id = materials.id) THEN 'material' ELSE 'storage' END as source
            FROM materials 
            WHERE uploaded_by = $1 AND parent_id = $2 AND type = 'file' AND is_deleted = false
            ORDER BY created_at DESC
        `;
        params = [instructor_id, folder_id];
    } else {
        query = `
            SELECT id, title as name, parent_id as folder_id, uploaded_by as instructor_id, file_path, file_type, file_size_bytes, created_at, updated_at, is_deleted, 'storage' as source
            FROM materials 
            WHERE uploaded_by = $1 AND parent_id IS NULL AND type = 'file' AND is_deleted = false
            ORDER BY created_at DESC
        `;
        params = [instructor_id];
    }

    const { rows } = await pool.query(query, params);
    return rows;
};

const getStorageStats = async (instructor_id) => {
    const query = `
        SELECT COALESCE(SUM(file_size_bytes), 0) as total_size
        FROM materials
        WHERE uploaded_by = $1 AND type = 'file';
    `;
    const { rows } = await pool.query(query, [instructor_id]);
    return rows[0];
};

const getRecentFiles = async (instructor_id) => {
    const query = `
        SELECT id, title as name, parent_id as folder_id, uploaded_by as instructor_id, file_path, file_type, file_size_bytes, created_at, updated_at, is_deleted,
        CASE WHEN EXISTS (SELECT 1 FROM material_shares ms WHERE ms.material_id = materials.id) THEN 'material' ELSE 'storage' END as source
        FROM materials
        WHERE uploaded_by = $1 AND type = 'file' AND is_deleted = false
        ORDER BY created_at DESC
        LIMIT 10;
    `;
    const { rows } = await pool.query(query, [instructor_id]);
    return rows;
};

const renameFolder = async (id, name, instructor_id) => {
    const query = "UPDATE materials SET title = $1 WHERE id = $2 AND uploaded_by = $3 AND type = 'folder' RETURNING id, title as name";
    const { rows } = await pool.query(query, [name, id, instructor_id]);
    return rows[0];
};

const renameFile = async (id, name, instructor_id) => {
    const query = "UPDATE materials SET title = $1 WHERE id = $2 AND uploaded_by = $3 AND type = 'file' RETURNING id, title as name";
    const { rows } = await pool.query(query, [name, id, instructor_id]);
    return rows[0];
};

const softDeleteFolder = async (id, instructor_id) => {
    const query = "UPDATE materials SET is_deleted = true, deleted_at = NOW() WHERE id = $1 AND uploaded_by = $2 AND type = 'folder' RETURNING *";
    const { rows } = await pool.query(query, [id, instructor_id]);
    return rows[0];
};

const softDeleteFile = async (id, instructor_id) => {
    const query = "UPDATE materials SET is_deleted = true, deleted_at = NOW() WHERE id = $1 AND uploaded_by = $2 AND type = 'file' RETURNING *";
    const { rows } = await pool.query(query, [id, instructor_id]);
    return rows[0];
};

const moveEntry = async (id, type, targetFolderId, instructor_id) => {
    const query = `UPDATE materials SET parent_id = $1 WHERE id = $2 AND uploaded_by = $3 RETURNING *`;
    const { rows } = await pool.query(query, [targetFolderId || null, id, instructor_id]);
    return rows[0];
};

const duplicateEntry = async (id, type, targetFolderId, instructor_id, newName) => {
    // 1. Get source
    const sourceQuery = "SELECT * FROM materials WHERE id = $1 AND uploaded_by = $2";
    const { rows: sources } = await pool.query(sourceQuery, [id, instructor_id]);
    if (sources.length === 0) throw new Error("Source not found");
    const source = sources[0];

    if (type === 'folder') {
        const createQuery = `
            INSERT INTO materials (title, parent_id, uploaded_by, type, file_path)
            VALUES ($1, $2, $3, 'folder', '')
            RETURNING id;
        `;
        const { rows: newFolder } = await pool.query(createQuery, [newName || source.title, targetFolderId || null, instructor_id]);
        const newId = newFolder[0].id;

        // Recursively duplicate children
        const children = await pool.query("SELECT id, type FROM materials WHERE parent_id = $1 AND is_deleted = false", [id]);
        for (const child of children.rows) {
            await duplicateEntry(child.id, child.type, newId, instructor_id);
        }
        return { id: newId, name: newName || source.title };
    } else {
        const insertQuery = `
            INSERT INTO materials (title, parent_id, uploaded_by, file_path, file_type, file_size_bytes, type)
            VALUES ($1, $2, $3, $4, $5, $6, 'file')
            RETURNING *;
        `;
        const { rows } = await pool.query(insertQuery, [
            newName || source.title,
            targetFolderId || null,
            instructor_id,
            source.file_path,
            source.file_type,
            source.file_size_bytes
        ]);
        return rows[0];
    }
};

const getRecycleBin = async (instructor_id) => {
    // Auto-delete expired items (older than 30 days)
    await pool.query("DELETE FROM materials WHERE uploaded_by = $1 AND is_deleted = true AND deleted_at < NOW() - INTERVAL '30 days'", [instructor_id]);

    const query = "SELECT *, title as name FROM materials WHERE uploaded_by = $1 AND is_deleted = true ORDER BY deleted_at DESC";
    const { rows } = await pool.query(query, [instructor_id]);
    return rows;
};

const permanentlyDeleteEntry = async (id, type, instructor_id) => {
    const query = "DELETE FROM materials WHERE id = $1 AND uploaded_by = $2 AND is_deleted = true RETURNING *";
    const { rows } = await pool.query(query, [id, instructor_id]);
    return rows[0];
};

const restoreEntry = async (id, type, instructor_id) => {
    const query = "UPDATE materials SET is_deleted = false, deleted_at = NULL WHERE id = $1 AND uploaded_by = $2 RETURNING *";
    const { rows } = await pool.query(query, [id, instructor_id]);
    return rows[0];
};

module.exports = {
    createFolder,
    getFolders,
    uploadFile,
    getFiles,
    getStorageStats,
    getRecentFiles,
    getOrCreateUploadsFolder,
    renameFolder,
    renameFile,
    softDeleteFolder,
    softDeleteFile,
    moveEntry,
    duplicateEntry,
    getRecycleBin,
    restoreEntry,
    permanentlyDeleteEntry
};
