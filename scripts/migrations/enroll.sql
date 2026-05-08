-- Find Dr. Abebe's Internet Programming course
DO $$
DECLARE
    v_course_id uuid;
BEGIN
    SELECT id INTO v_course_id FROM courses 
    WHERE title ILIKE '%Internet programming%' 
    AND course_code = 'CoSc3121' LIMIT 1;
    
    IF v_course_id IS NOT NULL THEN
        -- Insert enrollments for all 3rd-year computer science students
        INSERT INTO enrollments (student_id, course_id)
        SELECT id, v_course_id 
        FROM users 
        WHERE role = 'student' 
        AND year = 3
        AND id NOT IN (
            SELECT student_id FROM enrollments WHERE course_id = v_course_id
        );
    END IF;
END $$;
