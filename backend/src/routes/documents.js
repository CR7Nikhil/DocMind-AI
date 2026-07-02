const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadDocument, getDocuments, getDocument, deleteDocument } = require('../controllers/documentController');

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 } // 10MB
});

// All routes require auth
router.use(authMiddleware);

// POST /api/documents/upload
router.post('/upload', upload.single('file'), uploadDocument);

// GET /api/documents
router.get('/', getDocuments);

// GET /api/documents/:id
router.get('/:id', getDocument);

// DELETE /api/documents/:id
router.delete('/:id', deleteDocument);

module.exports = router;
