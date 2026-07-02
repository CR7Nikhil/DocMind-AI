const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { createSession, getSessions, getMessages, sendMessage, deleteSession } = require('../controllers/chatController');

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// POST /api/chat/sessions
router.post('/sessions', [
  body('documentId').notEmpty().withMessage('Document ID is required')
], createSession);

// GET /api/chat/sessions
router.get('/sessions', getSessions);

// GET /api/chat/sessions/:sessionId/messages
router.get('/sessions/:sessionId/messages', getMessages);

// POST /api/chat/sessions/:sessionId/messages
router.post('/sessions/:sessionId/messages', [
  body('question').trim().notEmpty().withMessage('Question is required')
], sendMessage);

// DELETE /api/chat/sessions/:sessionId
router.delete('/sessions/:sessionId', deleteSession);

module.exports = router;
