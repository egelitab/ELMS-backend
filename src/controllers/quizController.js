const quizService = require("../services/quizService");

// ==========================================
// INSTRUCTOR ENDPOINTS
// ==========================================

exports.createQuiz = async (req, res) => {
    try {
        const { course_id, title, description, duration_minutes, max_attempts } = req.body;
        if (!course_id || !title) {
            return res.status(400).json({ success: false, message: "course_id and title are required" });
        }
        const quiz = await quizService.createQuiz({
            course_id, title, description, duration_minutes, max_attempts, created_by: req.user.id,
        });
        res.status(201).json({ success: true, data: quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addQuestion = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { question_text, question_type, points, order_index, options } = req.body;
        if (!question_text) {
            return res.status(400).json({ success: false, message: "question_text is required" });
        }
        const question = await quizService.addQuestion(quizId, {
            question_text, question_type, points, order_index, options,
        });
        res.status(201).json({ success: true, data: question });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const quiz = await quizService.getQuizWithQuestions(quizId);
        res.json({ success: true, data: quiz });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

exports.getQuizzesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const isInstructor = req.user.role === 'instructor' || req.user.role === 'admin';
        const quizzes = await quizService.getQuizzesByCourse(courseId, isInstructor);
        res.json({ success: true, data: quizzes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.publishQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const quiz = await quizService.publishQuiz(quizId, req.user.id);
        res.json({ success: true, data: quiz });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        await quizService.deleteQuiz(quizId, req.user.id);
        res.json({ success: true, message: "Quiz deleted" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        await quizService.deleteQuestion(questionId);
        res.json({ success: true, message: "Question deleted" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ==========================================
// STUDENT ENDPOINTS
// ==========================================

exports.startAttempt = async (req, res) => {
    try {
        const { quizId } = req.params;
        const attempt = await quizService.startAttempt(quizId, req.user.id);
        res.status(201).json({ success: true, data: attempt });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.submitAttempt = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const { answers } = req.body;
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ success: false, message: "answers array is required" });
        }
        const result = await quizService.submitAttempt(attemptId, answers);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getMyAttempts = async (req, res) => {
    try {
        const { quizId } = req.params;
        const attempts = await quizService.getStudentAttempts(quizId, req.user.id);
        res.json({ success: true, data: attempts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAttemptDetail = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const detail = await quizService.getAttemptDetail(attemptId);
        res.json({ success: true, data: detail });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};
