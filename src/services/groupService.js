// Logic for Automatic Grouping
const generateGroups = async (course_id, studentsPerGroup) => {
  // 1. Fetch all students enrolled in the course
  const students = await pool.query(
    "SELECT user_id FROM enrollments WHERE course_id = $1", 
    [course_id]
  );
  
  const studentIds = students.rows.map(r => r.user_id);
  // Shuffle for randomness (Fisher-Yates)
  for (let i = studentIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [studentIds[i], studentIds[j]] = [studentIds[j], studentIds[i]];
  }

  const groups = [];
  for (let i = 0; i < studentIds.length; i += studentsPerGroup) {
    groups.push(studentIds.slice(i, i + studentsPerGroup));
  }
  
  return groups; // Then save these to your 'groups' and 'group_members' tables
};