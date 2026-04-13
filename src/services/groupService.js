const pool = require("../config/db");

const generateGroups = async (course_id, studentsPerGroup, department_id = null, section = null, method = 'Random', title = 'Group') => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start transaction

    // 1. Fetch students, including names for alphabetic sorting
    let studentsQuery = `
      SELECT e.student_id, (u.first_name || ' ' || u.last_name) as full_name 
      FROM enrollments e 
      JOIN users u ON e.student_id = u.id 
      WHERE e.course_id = $1
    `;
    let queryParams = [course_id];

    if (department_id) {
      studentsQuery += ` AND u.department_id = $${queryParams.length + 1}`;
      queryParams.push(department_id);
    }

    if (section) {
      studentsQuery += ` AND u.section = $${queryParams.length + 1}`;
      queryParams.push(section);
    }

    const studentsRes = await client.query(studentsQuery, queryParams);
    let students = studentsRes.rows;

    if (students.length === 0) {
      throw new Error("No students enrolled in this course matching the criteria");
    }

    // 2. Handle Grouping Method
    if (method === 'Random') {
      // Fisher-Yates shuffle
      for (let i = students.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [students[i], students[j]] = [students[j], students[i]];
      }
    } else if (method === 'Alphabetic') {
      students.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else {
      throw new Error("Method not supported");
    }

    const studentIds = students.map(s => s.student_id);

    // 3. Clear existing groups ONLY for this specific filter (department + section)
    await client.query(
      "DELETE FROM groups WHERE course_id = $1 AND (department_id = $2 OR (department_id IS NULL AND $2 IS NULL)) AND (section = $3 OR (section IS NULL AND $3 IS NULL))",
      [course_id, department_id, section]
    );

    const createdGroups = [];

    // 4. Create groups
    let groupIndex = 1;
    for (let i = 0; i < studentIds.length; i += studentsPerGroup) {
      const groupName = `${title} - ${groupIndex}`;

      // Insert new group with metadata
      const groupRes = await client.query(
        "INSERT INTO groups (course_id, name, department_id, section, method, batch_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name",
        [course_id, groupName, department_id, section, method, title]
      );

      const groupId = groupRes.rows[0].id;
      const groupMembers = studentIds.slice(i, i + studentsPerGroup);

      // Insert group members
      for (const userId of groupMembers) {
        await client.query(
          "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
          [groupId, userId]
        );
      }

      createdGroups.push({
        id: groupId,
        name: groupName,
        members: groupMembers
      });

      groupIndex++;
    }

    await client.query('COMMIT'); // Commit transaction
    return createdGroups;

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error
    throw error;
  } finally {
    client.release();
  }
};

const getGroupsByCourse = async (course_id) => {
  const query = `
    SELECT g.id, g.name, g.department_id, g.section, g.batch_name, g.method, d.name as department_name,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', u.id, 
                 'full_name', (u.first_name || ' ' || u.last_name)
               )
             ) FILTER (WHERE u.id IS NOT NULL), 
             '[]'
           ) as members
    FROM groups g
    LEFT JOIN departments d ON g.department_id = d.id
    LEFT JOIN group_members gm ON g.id = gm.group_id
    LEFT JOIN users u ON gm.user_id = u.id
    WHERE g.course_id = $1
    GROUP BY g.id, g.name, g.department_id, g.section, g.batch_name, g.method, d.name
    ORDER BY g.batch_name, g.name
  `;
  const { rows } = await pool.query(query, [course_id]);
  return rows;
}

const deleteGroupsByBatch = async (course_id, batch_name) => {
  let query;
  let params;

  // If the batch_name is the default fallback or explicitly null
  if (!batch_name || batch_name === 'General Groups') {
    query = "DELETE FROM groups WHERE course_id = $1 AND (batch_name IS NULL OR batch_name = 'General Groups')";
    params = [course_id];
  } else {
    query = "DELETE FROM groups WHERE course_id = $1 AND batch_name = $2";
    params = [course_id, batch_name];
  }

  await pool.query(query, params);
  return { success: true };
}

module.exports = {
  generateGroups,
  getGroupsByCourse,
  deleteGroupsByBatch
};