const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

// ─── Create Chat Session ──────────────────────────────────────────────────────
const createSession = async (req, res, next) => {
  try {
    const { documentId, title } = req.body;

    // Verify document belongs to user and is ready
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: req.user.id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    if (document.status !== 'ready') {
      return res.status(400).json({ error: 'Document is still being processed. Please wait.' });
    }

    const session = await prisma.chatSession.create({
      data: {
        userId: req.user.id,
        documentId,
        title: title || `Chat with ${document.name}`
      },
      include: { document: { select: { id: true, name: true, status: true } } }
    });

    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Sessions for User ────────────────────────────────────────────────
const getSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        document: { select: { id: true, name: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' }, select: { content: true, role: true } }
      }
    });
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
};

// ─── Get Session Messages ─────────────────────────────────────────────────────
const getMessages = async (req, res, next) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.sessionId, userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json({ session });
  } catch (error) {
    next(error);
  }
};

// ─── Send Message (RAG Query) ─────────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { question } = req.body;
    const { sessionId } = req.params;

    // Verify session
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
      include: { document: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: { chatSessionId: sessionId, role: 'user', content: question }
    });

    // Get previous messages for context (last 6 exchanges)
    const history = await prisma.message.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: 'asc' },
      take: -12 // last 12 messages
    });

    // Query AI Engine
    const aiResponse = await axios.post(`${AI_ENGINE_URL}/query`, {
      question,
      document_id: session.documentId,
      chat_history: history.map(m => ({ role: m.role, content: m.content }))
    });

    const { answer, sources } = aiResponse.data;

    // Save assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        chatSessionId: sessionId,
        role: 'assistant',
        content: answer,
        sources: sources || []
      }
    });

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() }
    });

    res.json({
      userMessage,
      assistantMessage,
      sources
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'AI Engine is unavailable. Please try again later.' });
    }
    next(error);
  }
};

// ─── Delete Session ───────────────────────────────────────────────────────────
const deleteSession = async (req, res, next) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.sessionId, userId: req.user.id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    await prisma.chatSession.delete({ where: { id: req.params.sessionId } });
    res.json({ message: 'Chat session deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSession, getSessions, getMessages, sendMessage, deleteSession };
