const memoryService = require('../services/memoryService');
const memoryExtractionService = require('../services/llmMemoryExtractionService');

const memoryController = {
    // GET /api/memories - Get all memories for the authenticated user
    getMemories: (req, res) => {
        const userId = req.user.id;
        const { category } = req.query;

        memoryService.getMemories(userId, category)
            .then(memories => {
                return res.json({
                    success: true,
                    memories: memories
                });
            })
            .catch(error => {
                console.error('[MemoryController] Error fetching memories:', error.message);
                return res.status(500).json({
                    success: false,
                    error: error.message || 'Failed to fetch memories.'
                });
            });
    },

    // POST /api/memories - Create a new memory
    createMemory: (req, res) => {
        const userId = req.user.id;
        const { category, content, confidence, source } = req.body;

        if (!category || !content) {
            return res.status(400).json({
                success: false,
                error: 'Category and content are required.'
            });
        }

        // Check for duplicates
        memoryService.findDuplicate(userId, content, category)
            .then(duplicate => {
                if (duplicate) {
                    return res.status(409).json({
                        success: false,
                        error: 'A similar memory already exists.',
                        duplicate: duplicate
                    });
                }

                // Create memory
                return memoryService.createMemory(userId, category, content, confidence, source);
            })
            .then(memory => {
                return res.status(201).json({
                    success: true,
                    message: 'Memory created successfully.',
                    memory: memory
                });
            })
            .catch(error => {
                console.error('[MemoryController] Error creating memory:', error.message);
                return res.status(500).json({
                    success: false,
                    error: error.message || 'Failed to create memory.'
                });
            });
    },

    // PUT /api/memories/:id - Update a memory
    updateMemory: (req, res) => {
        const userId = req.user.id;
        const memoryId = req.params.id;
        const { category, content, confidence } = req.body;

        if (!category && !content && !confidence) {
            return res.status(400).json({
                success: false,
                error: 'At least one field (category, content, or confidence) is required.'
            });
        }

        const updates = {};
        if (category) updates.category = category;
        if (content) updates.content = content;
        if (confidence !== undefined) updates.confidence = confidence;

        memoryService.updateMemory(memoryId, userId, updates)
            .then(memory => {
                return res.json({
                    success: true,
                    message: 'Memory updated successfully.',
                    memory: memory
                });
            })
            .catch(error => {
                console.error('[MemoryController] Error updating memory:', error.message);
                const statusCode = error.message.includes('not found') ? 404 : 500;
                return res.status(statusCode).json({
                    success: false,
                    error: error.message || 'Failed to update memory.'
                });
            });
    },

    // DELETE /api/memories/:id - Delete a memory
    deleteMemory: (req, res) => {
        const userId = req.user.id;
        const memoryId = req.params.id;

        memoryService.deleteMemory(memoryId, userId)
            .then(() => {
                return res.json({
                    success: true,
                    message: 'Memory deleted successfully.'
                });
            })
            .catch(error => {
                console.error('[MemoryController] Error deleting memory:', error.message);
                const statusCode = error.message.includes('not found') ? 404 : 500;
                return res.status(statusCode).json({
                    success: false,
                    error: error.message || 'Failed to delete memory.'
                });
            });
    },

    // POST /api/memories/search - Search memories
    searchMemories: (req, res) => {
        const userId = req.user.id;
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required.'
            });
        }

        memoryService.searchMemories(userId, query)
            .then(memories => {
                return res.json({
                    success: true,
                    memories: memories,
                    count: memories.length
                });
            })
            .catch(error => {
                console.error('[MemoryController] Error searching memories:', error.message);
                return res.status(500).json({
                    success: false,
                    error: error.message || 'Failed to search memories.'
                });
            });
    },

    // POST /api/memories/extract - Extract memories from a message
    extractMemories: async (req, res) => {
        const userId = req.user.id;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required for extraction.'
            });
        }

        try {
            // Extract memories with duplicate checking (async LLM extraction)
            const extractedMemories = await memoryExtractionService.extractWithConfidence(
                message,
                userId,
                (uid, content, category) => {
                    // Synchronous duplicate check placeholder
                    // Actual duplicate checking happens after extraction
                    return null;
                }
            );

            if (extractedMemories.length === 0) {
                return res.json({
                    success: true,
                    memories: [],
                    message: 'No memories extracted from this message.'
                });
            }

            // Try to save extracted memories (skip duplicates)
            const savePromises = extractedMemories.map(memory => {
                return memoryService.findDuplicate(userId, memory.content, memory.category)
                    .then(duplicate => {
                        if (duplicate) {
                            return null; // Skip duplicate
                        }
                        return memoryService.createMemory(userId, memory.category, memory.content, memory.confidence, 'extracted');
                    });
            });

            const results = await Promise.all(savePromises);
            const savedMemories = results.filter(r => r !== null);
            const duplicates = results.length - savedMemories.length;

            return res.json({
                success: true,
                memories: savedMemories,
                extracted: extractedMemories.length,
                saved: savedMemories.length,
                duplicates: duplicates,
                message: duplicates > 0
                    ? `Extracted ${extractedMemories.length} memories, saved ${savedMemories.length} (${duplicates} duplicates skipped).`
                    : `Successfully extracted and saved ${savedMemories.length} memories.`
            });

        } catch (error) {
            console.error('[MemoryController] Error extracting memories:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to extract memories.'
            });
        }
    },

    // GET /api/memories/stats - Get memory statistics
    getStats: (req, res) => {
        const userId = req.user.id;

        memoryService.getMemories(userId)
            .then(memories => {
                const stats = {
                    total: memories.length,
                    byCategory: {},
                    bySource: {},
                    averageConfidence: 0
                };

                memories.forEach(memory => {
                    // By category
                    stats.byCategory[memory.category] = (stats.byCategory[memory.category] || 0) + 1;

                    // By source
                    stats.bySource[memory.source] = (stats.bySource[memory.source] || 0) + 1;

                    // Sum confidence for average
                    stats.averageConfidence += memory.confidence;
                });

                if (memories.length > 0) {
                    stats.averageConfidence = stats.averageConfidence / memories.length;
                }

                return res.json({
                    success: true,
                    stats: stats
                });
            })
            .catch(error => {
                console.error('[MemoryController] Error fetching stats:', error.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch memory statistics.'
                });
            });
    }
};

module.exports = memoryController;