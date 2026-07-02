const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

// ─── Upload Document ──────────────────────────────────────────────────────────
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, size, path: filePath, mimetype } = req.file;

    // Save document record (status = processing)
    const document = await prisma.document.create({
      data: {
        userId: req.user.id,
        name: originalname.replace(/\.[^/.]+$/, ''), // strip extension
        originalName: originalname,
        fileType: mimetype,
        fileSize: size,
        filePath: filePath,
        status: 'processing'
      }
    });

    // Send to AI Engine for ingestion (async)
    res.status(202).json({
      message: 'Document uploaded. Processing started...',
      document
    });

    // Trigger AI Engine ingestion in background
    try {
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer], { type: mimetype });
      formData.append('file', blob, originalname);
      formData.append('document_id', document.id);

      const response = await axios.post(`${AI_ENGINE_URL}/ingest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update document status to ready
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: 'ready',
          vectorIds: response.data.vector_ids || []
        }
      });
    } catch (aiError) {
      console.error('AI Engine ingestion failed:', aiError.message);
      await prisma.document.update({
        where: { id: document.id },
        data: { status: 'failed' }
      });
    }

  } catch (error) {
    next(error);
  }
};

// ─── Get All Documents ────────────────────────────────────────────────────────
const getDocuments = async (req, res, next) => {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, originalName: true,
        fileType: true, fileSize: true, status: true,
        createdAt: true, updatedAt: true
      }
    });
    res.json({ documents });
  } catch (error) {
    next(error);
  }
};

// ─── Get Document by ID ───────────────────────────────────────────────────────
const getDocument = async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ document });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Document ──────────────────────────────────────────────────────────
const deleteDocument = async (req, res, next) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from vector DB
    try {
      await axios.delete(`${AI_ENGINE_URL}/documents/${req.params.id}`);
    } catch (err) {
      console.warn('Could not delete from vector DB:', err.message);
    }

    // Delete file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete from DB (cascades chat sessions and messages)
    await prisma.document.delete({ where: { id: req.params.id } });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadDocument, getDocuments, getDocument, deleteDocument };
