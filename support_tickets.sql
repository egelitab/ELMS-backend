CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Open', -- Open, In Progress, Resolved, Closed
    priority VARCHAR(50) DEFAULT 'Medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some dummy tickets
INSERT INTO support_tickets (subject, description, status) VALUES 
('Forgot Password', 'I cannot log in to my account.', 'Open'),
('Cannot upload PDF', 'The system gives error 500 when uploading assignments.', 'Open'),
('Course registration failing', 'I cannot enroll in CS101.', 'In Progress');
