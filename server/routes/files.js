const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middleware/authMiddleware');
const fileService = require('../services/fileService');

// All file routes require authentication
router.use(authMiddleware);

// POST /api/files/upload - Upload a file
router.post('/upload', fileService.getUploadMiddleware(), fileController.uploadFile);

// GET /api/files - Get all files for user
router.get('/', fileController.getUserFiles);

// GET /api/files/:id - Get file by ID
router.get('/:id', fileController.getFile);

// DELETE /api/files/:id - Delete file
router.delete('/:id', fileController.deleteFile);

// GET /api/files/search - Search files
router.get('/search', fileController.searchFiles);

module.exports = router;