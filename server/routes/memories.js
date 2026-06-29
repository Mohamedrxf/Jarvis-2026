const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memoryController');
const authMiddleware = require('../middleware/authMiddleware');

// All memory routes require authentication
router.use(authMiddleware);

// GET /api/memories - Get all memories
router.get('/', memoryController.getMemories);

// POST /api/memories - Create a new memory
router.post('/', memoryController.createMemory);

// PUT /api/memories/:id - Update a memory
router.put('/:id', memoryController.updateMemory);

// DELETE /api/memories/:id - Delete a memory
router.delete('/:id', memoryController.deleteMemory);

// POST /api/memories/search - Search memories
router.post('/search', memoryController.searchMemories);

// POST /api/memories/extract - Extract memories from a message
router.post('/extract', memoryController.extractMemories);

// GET /api/memories/stats - Get memory statistics
router.get('/stats', memoryController.getStats);

// GET /api/memories/ranked - Get ranked memories by relevance
router.get('/ranked', memoryController.getRankedMemories);

// GET /api/memories/evolution-stats - Get memory evolution statistics
router.get('/evolution-stats', memoryController.getEvolutionStats);

// POST /api/memories/:id/boost - Boost memory importance
router.post('/:id/boost', memoryController.boostMemory);

// POST /api/memories/recalculate - Recalculate all memory importance
router.post('/recalculate', memoryController.recalculateAllImportance);

module.exports = router;
