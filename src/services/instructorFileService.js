const pool = require("../config/db");

const createFolder = async (name, parent_id, instructor_id) => {
    // Check for duplicate name in both folders and files in the same path
    const folderCheck = parent_id
        ? "SELECT id FROM instructor_folders WHERE instructor_id = $1 AND name = $2 AND parent_id = $3"
        : "SELECT id FROM instructor_folders WHERE instructor_id = $1 AND name = $2 AND parent_id IS NULL";

    const fileCheck = parent_id
        ? "SELECT id FROM instructor_files WHERE instructor_id = $1 AND name = $2 AND folder_id = $3"
        : "SELECT id FROM instructor_files WHERE instructor_id = $1 AND name = $2 AND folder_id IS NULL";

    const params = parent_id ? [instructor_id, name, parent_id] : [instructor_id, name];

    const [existingFolder, existingFile] = await Promise.all([
        pool.query(folderCheck, params),
        pool.query(fileCheck, params)
    ]);

    if (existingFolder.rows.length > 0 || existingFile.rows.length > 0) {
        throw new Error("A folder or file with this name already exists in this location.");
    }

    const query = `
        INSERT INTO instructor_folders (name, parent_id, instructor_id)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [name, parent_id || null, instructor_id]);
    return rows[0];
};

const getOrCreateUploadsFolder = async (instructor_id) => {
    const checkQuery = "SELECT id FROM instructor_folders WHERE instructor_id = $1 AND name = 'Uploads' AND parent_id IS NULL";
    const { rows } = await pool.query(checkQuery, [instructor_id]);

    if (rows.length > 0) return rows[0].id;

    const query = `
        INSERT INTO instructor_folders (name, parent_id, instructor_id)
        VALUES ('Uploads', NULL, $1)
        RETURNING id;
    `;
    const { rows: result } = await pool.query(query, [instructor_id]);
    return result[0].id;
};

const getFolders = async (instructor_id, parent_id) => {
    // Ensure Uploads folder exists for every request to root
    if (!parent_id) {
        await getOrCreateUploadsFolder(instructor_id);
    }

    const query = parent_id
        ? "SELECT * FROM instructor_folders WHERE instructor_id = $1 AND parent_id = $2 AND is_deleted = false ORDER BY created_at DESC"
        : "SELECT * FROM instructor_folders WHERE instructor_id = $1 AND parent_id IS NULL AND is_deleted = false ORDER BY created_at DESC";
    const params = parent_id ? [instructor_id, parent_id] : [instructor_id];
    const { rows } = await pool.query(query, params);
    return rows;
};

const uploadFile = async ({ name, folder_id, instructor_id, file_path, file_type, file_size_bytes }) => {
    // If no folder_id, use (and ensure) the "Uploads" folder
    let targetFolderId = folder_id;
    if (!targetFolderId) {
        targetFolderId = await getOrCreateUploadsFolder(instructor_id);
    }

    // Check for duplicate name in both folders and files in the same folder
    const folderCheck = targetFolderId
        ? "SELECT id FROM instructor_folders WHERE instructor_id = $1 AND name = $2 AND parent_id = $3"
        : "SELECT id FROM instructor_folders WHERE instructor_id = $1 AND name = $2 AND parent_id IS NULL";

    const fileCheck = targetFolderId
        ? "SELECT id FROM instructor_files WHERE instructor_id = $1 AND name = $2 AND folder_id = $3"
        : "SELECT id FROM instructor_files WHERE instructor_id = $1 AND name = $2 AND folder_id IS NULL";

    const params = targetFolderId ? [instructor_id, name, targetFolderId] : [instructor_id, name];

    const [existingFolder, existingFile] = await Promise.all([
        pool.query(folderCheck, params),
        pool.query(fileCheck, params)
    ]);

    if (existingFolder.rows.length > 0 || existingFile.rows.length > 0) {
        throw new Error("A folder or file with this name already exists in this location.");
    }

    const query = `
        INSERT INTO instructor_files (name, folder_id, instructor_id, file_path, file_type, file_size_bytes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [name, targetFolderId, instructor_id, file_path, file_type, file_size_bytes]);
    return rows[0];
};

const getFiles = async (instructor_id, folder_id) => {
    let query;
    let params;

    const uploadsFolderId = await getOrCreateUploadsFolder(instructor_id);

    if (folder_id) {
        if (folder_id === uploadsFolderId) {
            // In Uploads folder: show general uploads AND all course materials
            query = `
                SELECT id, name, folder_id, instructor_id, file_path, file_type, file_size_bytes, created_at, updated_at, is_deleted, 'storage' as source
                FROM instructor_files 
                WHERE instructor_id = $1 AND folder_id = $2 AND is_deleted = false
                UNION ALL
                SELECT m.id, m.title as name, $2 as folder_id, m.uploaded_by as instructor_id, m.file_path, m.file_type, m.file_size_bytes, m.created_at, m.updated_at, m.is_deleted, 'material' as source
                FROM materials m
                WHERE m.uploaded_by = $1 AND m.is_deleted = false
                ORDER BY created_at DESC
            `;
            params = [instructor_id, folder_id];
        } else {
            // Other folder: just show regular files
            query = `
                SELECT id, name, folder_id, instructor_id, file_path, file_type, file_size_bytes, created_at, updated_at, is_deleted, 'storage' as source
                FROM instructor_files 
                WHERE instructor_id = $1 AND folder_id = $2 AND is_deleted = false
                ORDER BY created_at DESC
            `;
            params = [instructor_id, folder_id];
        }
    } else {
        // At root level: only show storage files with no folder_id
        query = `
            SELECT id, name, folder_id, instructor_id, file_path, file_type, file_size_bytes, created_at, updated_at, is_deleted, 'storage' as source
            FROM instructor_files 
            WHERE instructor_id = $1 AND folder_id IS NULL AND is_deleted = false
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
        FROM instructor_files
        WHERE instructor_id = $1;
    `;
    const { rows } = await pool.query(query, [instructor_id]);
    return rows[0];
};

const getRecentFiles = async (instructor_id) => {
    const query = `
        SELECT id, name, folder_id, instructor_id, file_path, file_type, file_size_bytes, created_at, updated_at, is_deleted, 'storage' as source
        FROM instructor_files
        WHERE instructor_id = $1 AND is_deleted = false
        UNION ALL
        SELECT m.id, m.title as name, NULL as folder_id, m.uploaded_by as instructor_id, m.file_path, m.file_type, m.file_size_bytes, m.created_at, m.updated_at, m.is_deleted, 'material' as source
        FROM materials m
        WHERE m.uploaded_by = $1 AND m.is_deleted = false
        ORDER BY created_at DESC
        LIMIT 10;
    `;
    const { rows } = await pool.query(query, [instructor_id]);
    return rows;
};

const renameFolder = async (id, name, instructor_id) => {
    const query = "UPDATE instructor_folders SET name = $1 WHERE id = $2 AND instructor_id = $3 RETURNING *";
    const { rows } = await pool.query(query, [name, id, instructor_id]);
    return rows[0];
};

const renameFile = async (id, name, instructor_id) => {
    // Try updating instructor_files first
    let query = "UPDATE instructor_files SET name = $1 WHERE id = $2 AND instructor_id = $3 RETURNING *";
    let { rows } = await pool.query(query, [name, id, instructor_id]);

    if (rows.length === 0) {
        // Try updating materials
        query = "UPDATE materials SET title = $1 WHERE id = $2 AND uploaded_by = $3 RETURNING *";
        const result = await pool.query(query, [name, id, instructor_id]);
        return result.rows[0];
    }
    return rows[0];
};

const softDeleteFolder = async (id, instructor_id) => {
    const query = "UPDATE instructor_folders SET is_deleted = true, deleted_at = NOW() WHERE id = $1 AND instructor_id = $2 RETURNING *";
    const { rows } = await pool.query(query, [id, instructor_id]);
    return rows[0];
};

const softDeleteFile = async (id, instructor_id) => {
    // Try updating instructor_files first
    let query = "UPDATE instructor_files SET is_deleted = true, deleted_at = NOW() WHERE id = $1 AND instructor_id = $2 RETURNING *";
    let { rows } = await pool.query(query, [id, instructor_id]);

    if (rows.length === 0) {
        // Try updating materials
        query = "UPDATE materials SET is_deleted = true, deleted_at = NOW() WHERE id = $1 AND uploaded_by = $2 RETURNING *";
        const result = await pool.query(query, [id, instructor_id]);
        return result.rows[0];
    }
    return rows[0];
};

const moveEntry = async (id, type, targetFolderId, instructor_id) => {
    const table = type === 'folder' ? 'instructor_folders' : 'instructor_files';
    const folderCol = type === 'folder' ? 'parent_id' : 'folder_id';
    const query = `UPDATE ${table} SET ${folderCol} = $1 WHERE id = $2 AND instructor_id = $3 RETURNING *`;
    const { rows } = await pool.query(query, [targetFolderId || null, id, instructor_id]);
    return rows[0];
};

const getRecycleBin = async (instructor_id) => {
    const folderQuery = "SELECT *, 'folder' as type FROM instructor_folders WHERE instructor_id = $1 AND is_deleted = true";
    const fileQuery = "SELECT *, 'file' as type FROM instructor_files WHERE instructor_id = $1 AND is_deleted = true";

    const [folders, files] = await Promise.all([
        pool.query(folderQuery, [instructor_id]),
        pool.query(fileQuery, [instructor_id])
    ]);

    return [...folders.rows, ...files.rows].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
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
    getRecycleBin
};
