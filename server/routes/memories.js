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

// POST /api/memories/semantic-search - Semantic search for memories
router.post('/semantic-search', memoryController.semanticSearch);

// GET /api/memories/clusters - Get memory clusters
router.get('/clusters', memoryController.getClusters);

// GET /api/memories/:id/related - Get related memories
router.get('/:id/related', memoryController.getRelatedMemories);

// POST /api/memories/relationships - Create relationship between memories
router.post('/relationships', memoryController.createRelationship);

// POST /api/memories/batch-update-embeddings - Batch update embeddings
router.post('/batch-update-embeddings', memoryController.batchUpdateEmbeddings);

// GET /api/memories/semantic-context - Get semantic memory context for AI
router.get('/semantic-context', memoryController.getSemanticContext);

// GET /api/memories/:id/relationships - Get all relationships for a memory
router.get('/:id/relationships', memoryController.getMemoryRelationships);

// POST /api/memories/:id/relationships - Create a new relationship
router.post('/:id/relationships', memoryController.createMemoryRelationship);

// DELETE /api/memories/relationships/:id - Delete a relationship
router.delete('/relationships/:id', memoryController.deleteMemoryRelationship);

// GET /api/memories/relationships/types - Get all supported relationship types
router.get('/relationships/types', memoryController.getRelationshipTypes);

// GET /api/memories/graph-stats - Get knowledge graph statistics
router.get('/graph-stats', memoryController.getGraphStats);

// POST /api/memories/:id/build-relationships - Manually trigger relationship building
router.post('/:id/build-relationships', memoryController.buildMemoryRelationships);

module.exports = router;
