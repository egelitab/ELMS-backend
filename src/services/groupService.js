const pool = require("../config/db");

const generateGroups = async (course_id, studentsPerGroup) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start transaction

    // 1. Fetch all students enrolled in the course
    const studentsRes = await client.query(
      "SELECT user_id FROM enrollments WHERE course_id = $1",
      [course_id]
    );

    const studentIds = studentsRes.rows.map(r => r.user_id);

    if (studentIds.length === 0) {
      throw new Error("No students enrolled in this course");
    }

    // 2. Clear existing groups for this course if regenerating
    await client.query("DELETE FROM groups WHERE course_id = $1", [course_id]);

    // 3. Shuffle for randomness (Fisher-Yates)
    for (let i = studentIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [studentIds[i], studentIds[j]] = [studentIds[j], studentIds[i]];
    }

    const createdGroups = [];

    // 4. Create groups
    let groupIndex = 1;
    for (let i = 0; i < studentIds.length; i += studentsPerGroup) {
      const groupName = `Group ${groupIndex}`;

      // Insert new group
      const groupRes = await client.query(
        "INSERT INTO groups (course_id, name) VALUES ($1, $2) RETURNING id, name",
        [course_id, groupName]
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
    SELECT g.id, g.name, json_agg(json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name)) as members
    FROM groups g
    LEFT JOIN group_members gm ON g.id = gm.group_id
    LEFT JOIN users u ON gm.user_id = u.id
    WHERE g.course_id = $1
    GROUP BY g.id, g.name
    ORDER BY g.name
  `;
  const { rows } = await pool.query(query, [course_id]);
  return rows;
}

module.exports = {
  generateGroups,
  getGroupsByCourse
};