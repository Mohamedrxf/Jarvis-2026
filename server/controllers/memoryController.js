const memoryService = require('../services/memoryService');
const semanticMemoryService = require('../services/semanticMemoryService');
const memoryExtractionService = require('../services/llmMemoryExtractionService');
const knowledgeGraphService = require('../services/knowledgeGraphService');

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
    },

    // GET /api/memories/ranked - Get ranked memories by relevance
    getRankedMemories: (req, res) => {
        const userId = req.user.id;
        const { limit } = req.query;

        const memoryLimit = limit ? parseInt(limit) : 10;

        memoryService.getRankedMemories(userId, memoryLimit)
            .then(memories => {
                return res.json({
                    success: true,
                    memories: memories,
                    count: memories.length
                });
            })
            .catch(error => {
                console.error('[MemoryController] Error fetching ranked memories:', error.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch ranked memories.'
                });
            });
    },

    // GET /api/memories/evolution-stats - Get memory evolution statistics
    getEvolutionStats: (req, res) => {
        const userId = req.user.id;

        memoryService.getEvolutionStats(userId)
            .then(stats => {
                return res.json({
                    success: true,
                    stats: stats
                });
            })
            .catch(error => {
                console.error('[MemoryController] Error fetching evolution stats:', error.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch evolution statistics.'
                });
            });
    },

    // POST /api/memories/:id/boost - Boost memory importance
    boostMemory: (req, res) => {
        const userId = req.user.id;
        const memoryId = req.params.id;

        memoryService.boostMemory(memoryId, userId)
            .then(memory => {
                return res.json({
                    success: true,
                    message: 'Memory boosted successfully.',
                    memory: memory
                });
            })
            .catch(error => {
                console.error('[MemoryController] Error boosting memory:', error.message);
                const statusCode = error.message.includes('not found') ? 404 : 500;
                return res.status(statusCode).json({
                    success: false,
                    error: error.message || 'Failed to boost memory.'
                });
            });
    },

    // POST /api/memories/recalculate - Recalculate all memory importance
    recalculateAllImportance: (req, res) => {
        const userId = req.user.id;

        memoryService.recalculateAllImportance(userId)
            .then(result => {
                return res.json({
                    success: true,
                    ...result
                });
            })
            .catch(error => {
                console.error('[MemoryController] Error recalculating importance:', error.message);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to recalculate memory importance.'
                });
            });
    },

    // POST /api/memories/semantic-search - Semantic search for memories
    semanticSearch: async (req, res) => {
        const userId = req.user.id;
        const { query, limit } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required.'
            });
        }

        try {
            const memories = await semanticMemoryService.semanticSearch(userId, query, limit || 10);
            return res.json({
                success: true,
                memories: memories,
                count: memories.length
            });
        } catch (error) {
            console.error('[MemoryController] Error in semantic search:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to perform semantic search.'
            });
        }
    },

    // GET /api/memories/clusters - Get memory clusters
    getClusters: async (req, res) => {
        const userId = req.user.id;

        try {
            const clusters = await semanticMemoryService.getClusters(userId);
            return res.json({
                success: true,
                clusters: clusters
            });
        } catch (error) {
            console.error('[MemoryController] Error fetching clusters:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch memory clusters.'
            });
        }
    },

    // GET /api/memories/:id/related - Get related memories
    getRelatedMemories: async (req, res) => {
        const userId = req.user.id;
        const memoryId = req.params.id;

        try {
            const relatedMemories = await semanticMemoryService.getRelatedMemories(memoryId, userId);
            return res.json({
                success: true,
                memories: relatedMemories,
                count: relatedMemories.length
            });
        } catch (error) {
            console.error('[MemoryController] Error fetching related memories:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch related memories.'
            });
        }
    },

    // POST /api/memories/relationships - Create relationship between memories
    createRelationship: async (req, res) => {
        const userId = req.user.id;
        const { sourceMemoryId, targetMemoryId, relationshipType, strength } = req.body;

        if (!sourceMemoryId || !targetMemoryId || !relationshipType) {
            return res.status(400).json({
                success: false,
                error: 'Source memory ID, target memory ID, and relationship type are required.'
            });
        }

        try {
            const relationship = await semanticMemoryService.createRelationship(
                userId,
                sourceMemoryId,
                targetMemoryId,
                relationshipType,
                strength || 0.5
            );
            return res.status(201).json({
                success: true,
                relationship: relationship
            });
        } catch (error) {
            console.error('[MemoryController] Error creating relationship:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to create relationship.'
            });
        }
    },

    // POST /api/memories/batch-update-embeddings - Batch update embeddings
    batchUpdateEmbeddings: async (req, res) => {
        const userId = req.user.id;
        const { batchSize } = req.body;

        try {
            const result = await semanticMemoryService.batchUpdateEmbeddings(userId, batchSize || 50);
            return res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('[MemoryController] Error batch updating embeddings:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to batch update embeddings.'
            });
        }
    },

    // GET /api/memories/semantic-context - Get semantic memory context for AI
    getSemanticContext: async (req, res) => {
        const userId = req.user.id;
        const { query, limit } = req.query;

        try {
            const context = await semanticMemoryService.getSemanticMemoryContext(userId, query, limit || 10);
            return res.json({
                success: true,
                context: context
            });
        } catch (error) {
            console.error('[MemoryController] Error getting semantic context:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to get semantic memory context.'
            });
        }
    },

    // GET /api/memories/:id/relationships - Get all relationships for a memory
    getMemoryRelationships: async (req, res) => {
        const userId = req.user.id;
        const memoryId = req.params.id;
        const { relationType, direction } = req.query;

        try {
            const relationships = await knowledgeGraphService.getRelationships(
                memoryId,
                direction || 'both',
                relationType || null
            );
            return res.json({
                success: true,
                relationships: relationships,
                count: relationships.length
            });
        } catch (error) {
            console.error('[MemoryController] Error fetching relationships:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch memory relationships.'
            });
        }
    },

    // POST /api/memories/:id/relationships - Create a new relationship
    createMemoryRelationship: async (req, res) => {
        const userId = req.user.id;
        const memoryId = req.params.id;
        const { targetMemoryId, relationType, confidence } = req.body;

        if (!targetMemoryId || !relationType) {
            return res.status(400).json({
                success: false,
                error: 'Target memory ID and relationship type are required.'
            });
        }

        try {
            const relationship = await knowledgeGraphService.createEdge(
                memoryId,
                targetMemoryId,
                relationType,
                confidence || 0.5
            );
            return res.status(201).json({
                success: true,
                relationship: relationship
            });
        } catch (error) {
            console.error('[MemoryController] Error creating relationship:', error.message);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to create relationship.'
            });
        }
    },

    // DELETE /api/memories/relationships/:id - Delete a relationship
    deleteMemoryRelationship: async (req, res) => {
        const relationshipId = req.params.id;

        try {
            await knowledgeGraphService.deleteEdge(relationshipId);
            return res.json({
                success: true,
                message: 'Relationship deleted successfully.'
            });
        } catch (error) {
            console.error('[MemoryController] Error deleting relationship:', error.message);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to delete relationship.'
            });
        }
    },

    // GET /api/memories/relationships/types - Get all supported relationship types
    getRelationshipTypes: (req, res) => {
        try {
            const relationTypes = knowledgeGraphService.getRelationTypes();
            return res.json({
                success: true,
                types: relationTypes
            });
        } catch (error) {
            console.error('[MemoryController] Error fetching relationship types:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch relationship types.'
            });
        }
    },

    // GET /api/memories/graph-stats - Get knowledge graph statistics
    getGraphStats: async (req, res) => {
        const userId = req.user.id;

        try {
            const stats = await knowledgeGraphService.getGraphStats(userId);
            return res.json({
                success: true,
                stats: stats
            });
        } catch (error) {
            console.error('[MemoryController] Error fetching graph stats:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch graph statistics.'
            });
        }
    },

    // POST /api/memories/:id/build-relationships - Manually trigger relationship building
    buildMemoryRelationships: async (req, res) => {
        const userId = req.user.id;
        const memoryId = req.params.id;
        const { threshold } = req.body;

        try {
            const relationships = await knowledgeGraphService.buildAutomaticRelationships(
                userId,
                memoryId,
                threshold
            );
            return res.json({
                success: true,
                relationships: relationships,
                count: relationships.length,
                message: `Built ${relationships.length} relationships.`
            });
        } catch (error) {
            console.error('[MemoryController] Error building relationships:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to build relationships.'
            });
        }
    }
};

module.exports = memoryController;