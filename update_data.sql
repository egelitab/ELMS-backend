
DO $ $
DECLARE
    info_sys_id UUID;
    dr_abebe_id UUID;
    ip_course_id UUID;
    dummy_student_id UUID;
BEGIN
    -- 1. Create or get Information System department
    SELECT id INTO info_sys_id FROM departments WHERE name ILIKE '%Information system%' LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO departments (faculty_id, name, description) 
        VALUES ((SELECT id FROM faculties LIMIT 1), 'Information System', 'IS Department')
        RETURNING id INTO info_sys_id;
    END IF;

    -- 2. Get Dr. Abebe
    SELECT id INTO dr_abebe_id FROM users WHERE first_name ILIKE '%Abebe%' AND role = 'instructor' LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO users (first_name, last_name, email, password_hash, role, title)
        VALUES ('Abebe', 'Kebede', 'abebe@bdu.edu.et', 'hash', 'instructor', 'Dr.')
        RETURNING id INTO dr_abebe_id;
    END IF;

    -- 3. Create or get Internet Programming course
    SELECT id INTO ip_course_id FROM courses WHERE title ILIKE '%Internet programming%' LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO courses (course_code, title, description, instructor_id, department_id, year, semester)
        VALUES ('IS311', 'Internet Programming', 'Learn web dev', dr_abebe_id, info_sys_id, 3, 1)
        RETURNING id INTO ip_course_id;
    ELSE
        UPDATE courses SET instructor_id = dr_abebe_id, department_id = info_sys_id WHERE id = ip_course_id;
    END IF;

    -- 4. Create a dummy student in Section A
    SELECT id INTO dummy_student_id FROM users WHERE email = 'dummy_student_isa@bdu.edu.et';
    IF NOT FOUND THEN
        INSERT INTO users (first_name, last_name, email, password_hash, role, department_id, section)
        VALUES ('Dummy', 'Student', 'dummy_student_isa@bdu.edu.et', 'hash', 'student', info_sys_id, 'Section A')
        RETURNING id INTO dummy_student_id;
    ELSE
        UPDATE users SET section = 'Section A', department_id = info_sys_id WHERE id = dummy_student_id;
    END IF;

    -- 5. Enroll the student
    IF NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = ip_course_id AND student_id = dummy_student_id) THEN
        INSERT INTO enrollments (course_id, student_id) VALUES (ip_course_id, dummy_student_id);
    END IF;

END $ $;

