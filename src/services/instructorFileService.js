const pool = require("../config/db");

const createFolder = async (name, parent_id, instructor_id) => {
    const query = `
        INSERT INTO instructor_folders (name, parent_id, instructor_id)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [name, parent_id || null, instructor_id]);
    return rows[0];
};

const getFolders = async (instructor_id, parent_id) => {
    const query = parent_id
        ? "SELECT * FROM instructor_folders WHERE instructor_id = $1 AND parent_id = $2 ORDER BY name ASC"
        : "SELECT * FROM instructor_folders WHERE instructor_id = $1 AND parent_id IS NULL ORDER BY name ASC";
    const params = parent_id ? [instructor_id, parent_id] : [instructor_id];
    const { rows } = await pool.query(query, params);
    return rows;
};

const uploadFile = async ({ name, folder_id, instructor_id, file_path, file_type, file_size_bytes }) => {
    const query = `
        INSERT INTO instructor_files (name, folder_id, instructor_id, file_path, file_type, file_size_bytes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [name, folder_id || null, instructor_id, file_path, file_type, file_size_bytes]);
    return rows[0];
};

const getFiles = async (instructor_id, folder_id) => {
    const query = folder_id
        ? "SELECT * FROM instructor_files WHERE instructor_id = $1 AND folder_id = $2 ORDER BY created_at DESC"
        : "SELECT * FROM instructor_files WHERE instructor_id = $1 AND folder_id IS NULL ORDER BY created_at DESC";
    const params = folder_id ? [instructor_id, folder_id] : [instructor_id];
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
        SELECT * FROM instructor_files
        WHERE instructor_id = $1
        ORDER BY created_at DESC
        LIMIT 10;
    `;
    const { rows } = await pool.query(query, [instructor_id]);
    return rows;
};

module.exports = {
    createFolder,
    getFolders,
    uploadFile,
    getFiles,
    getStorageStats,
    getRecentFiles
};
