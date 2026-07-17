const db = require('../config/db');
const memoryEvolutionService = require('./memoryEvolutionService');
const semanticMemoryService = require('./semanticMemoryService');
const knowledgeGraphService = require('./knowledgeGraphService');
const knowledgeReasoningService = require('./knowledgeReasoningService');
const memoryIntelligenceService = require('./memoryIntelligenceService');
const memoryRankingService = require('./memoryRankingService');

class MemoryService {
    /**
     * Create a new memory
     * @param {number} userId - The user ID
     * @param {string} category - Memory category (identity, preferences, education, work, goals)
     * @param {string} content - Memory content
     * @param {number} confidence - Confidence score (0-1)
     * @param {string} source - Source of memory (manual, extracted)
     * @returns {Promise<Object>} Created memory
     */
    async createMemory(userId, category, content, confidence = 1.0, source = 'manual') {
        try {
            if (!userId || !category || !content) {
                throw new Error('User ID, category, and content are required.');
            }

            const validCategories = ['identity', 'preferences', 'education', 'work', 'goals'];
            if (!validCategories.includes(category)) {
                throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
            }

            // Check for duplicates using semantic search
            const duplicateCheck = await semanticMemoryService.checkForDuplicates(userId, content, category);
            if (duplicateCheck && duplicateCheck.isDuplicate) {
                throw new Error('A similar memory already exists.');
            }

            // Use semantic memory service to create memory with embedding
            const newMemory = await semanticMemoryService.createMemory(userId, category, content, confidence, source);

            // Log to history (fire and forget)
            this.logHistory(userId, newMemory.id, 'created', null, content.trim()).catch(() => { });

            // Build automatic relationships (fire and forget for non-blocking)
            knowledgeGraphService.buildAutomaticRelationships(userId, newMemory.id)
                .then(relationships => {
                    if (relationships.length > 0) {
                        console.log(`[MemoryService] Created ${relationships.length} automatic relationships for memory ${newMemory.id}`);
                    }
                })
                .catch(err => {
                    console.warn('[MemoryService] Could not build automatic relationships:', err.message);
                });

            return newMemory;
        } catch (error) {
            console.error('[MemoryService] Error creating memory:', error.message);
            throw error;
        }
    }

    /**
     * Update an existing memory
     * @param {number} memoryId - Memory ID
     * @param {number} userId - User ID (for authorization)
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated memory
     */
    updateMemory(memoryId, userId, updates) {
        return new Promise((resolve, reject) => {
            if (!memoryId || !userId) {
                return reject(new Error('Memory ID and User ID are required.'));
            }

            const allowedFields = ['category', 'content', 'confidence'];
            const updateFields = [];
            const updateValues = [];

            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                }
            }

            if (updateFields.length === 0) {
                return reject(new Error('No valid fields to update.'));
            }

            updateFields.push('updated_at = ?');
            updateValues.push(new Date().toISOString());
            updateValues.push(memoryId, userId);

            const sql = `
                UPDATE memories
                SET ${updateFields.join(', ')}
                WHERE id = ? AND user_id = ?
            `;

            const self = this;
            db.run(sql, updateValues, function (err) {
                if (err) {
                    console.error('[MemoryService] Error updating memory:', err.message);
                    return reject(new Error('Failed to update memory.'));
                }

                if (this.changes === 0) {
                    return reject(new Error('Memory not found or you do not have permission to update it.'));
                }

                // Get updated memory
                const getSql = `SELECT * FROM memories WHERE id = ? AND user_id = ?`;
                db.get(getSql, [memoryId, userId], (getErr, row) => {
                    if (getErr || !row) {
                        return reject(new Error('Failed to retrieve updated memory.'));
                    }

                    // Log to history (fire and forget)
                    self.logHistory(userId, memoryId, 'updated', null, row.content).catch(() => { });

                    // Rebuild automatic relationships (fire and forget for non-blocking)
                    knowledgeGraphService.buildAutomaticRelationships(userId, memoryId)
                        .then(relationships => {
                            if (relationships.length > 0) {
                                console.log(`[MemoryService] Updated ${relationships.length} relationships for memory ${memoryId}`);
                            }
                        })
                        .catch(err => {
                            console.warn('[MemoryService] Could not rebuild relationships:', err.message);
                        });

                    resolve(row);
                });
            });
        });
    }

    /**
     * Delete a memory
     * @param {number} memoryId - Memory ID
     * @param {number} userId - User ID (for authorization)
     * @returns {Promise<boolean>} Success status
     */
    deleteMemory(memoryId, userId) {
        return new Promise((resolve, reject) => {
            if (!memoryId || !userId) {
                return reject(new Error('Memory ID and User ID are required.'));
            }

            // Get memory before deleting for history
            const getSql = `SELECT * FROM memories WHERE id = ? AND user_id = ?`;
            db.get(getSql, [memoryId, userId], (getErr, memory) => {
                if (getErr) {
                    console.error('[MemoryService] Error fetching memory for deletion:', getErr.message);
                    return reject(new Error('Failed to delete memory.'));
                }

                if (!memory) {
                    return reject(new Error('Memory not found or you do not have permission to delete it.'));
                }

                const deleteSql = `DELETE FROM memories WHERE id = ? AND user_id = ?`;
                const self = this;
                db.run(deleteSql, [memoryId, userId], function (err) {
                    if (err) {
                        console.error('[MemoryService] Error deleting memory:', err.message);
                        return reject(new Error('Failed to delete memory.'));
                    }

                    if (this.changes === 0) {
                        return reject(new Error('Memory not found or you do not have permission to delete it.'));
                    }

                    // Log to history (fire and forget)
                    self.logHistory(userId, memoryId, 'deleted', memory.content, null).catch(() => { });

                    resolve(true);
                });
            });
        });
    }

    /**
     * Get all memories for a user
     * @param {number} userId - User ID
     * @param {string} category - Optional category filter
     * @returns {Promise<Array>} List of memories
     */
    getMemories(userId, category = null) {
        return new Promise((resolve, reject) => {
            if (!userId) {
                return reject(new Error('User ID is required.'));
            }

            let sql = `SELECT * FROM memories WHERE user_id = ?`;
            const params = [userId];

            if (category) {
                sql += ` AND category = ?`;
                params.push(category);
            }

            sql += ` ORDER BY updated_at DESC`;

            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('[MemoryService] Error fetching memories:', err.message);
                    return reject(new Error('Failed to fetch memories.'));
                }

                resolve(rows);
            });
        });
    }

    /**
     * Search memories by content (enhanced with semantic search)
     * @param {number} userId - User ID
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching memories
     */
    async searchMemories(userId, query) {
        try {
            if (!userId || !query) {
                throw new Error('User ID and search query are required.');
            }

            // Try semantic search first
            const semanticResults = await semanticMemoryService.semanticSearch(userId, query, 20);

            if (semanticResults.length > 0) {
                return semanticResults;
            }

            // Fallback to keyword search
            const searchTerm = `%${query}%`;
            const sql = `
                SELECT * FROM memories
                WHERE user_id = ? AND content LIKE ?
                ORDER BY confidence DESC, updated_at DESC
            `;

            return new Promise((resolve, reject) => {
                db.all(sql, [userId, searchTerm], (err, rows) => {
                    if (err) {
                        console.error('[MemoryService] Error searching memories:', err.message);
                        return reject(new Error('Failed to search memories.'));
                    }
                    resolve(rows);
                });
            });
        } catch (error) {
            console.error('[MemoryService] Error searching memories:', error.message);
            throw error;
        }
    }

    /**
     * Get memory context formatted for AI prompt injection (with ranking)
     * @param {number} userId - User ID
     * @param {string} query - Optional query for semantic relevance
     * @returns {Promise<string>} Formatted memory context with ranked memories
     */
    async getMemoryContext(userId, query = null) {
        try {
            // Get all memories for the user
            const memories = await this.getMemories(userId);

            if (memories.length === 0) {
                return '';
            }

            // Use MemoryRankingService to rank memories by relevance
            const rankedMemories = await memoryRankingService.rankMemories(query, memories);

            if (rankedMemories.length === 0) {
                return '';
            }

            // Format ranked memories for prompt injection
            return this.formatRankedMemoriesForPrompt(rankedMemories);

        } catch (error) {
            console.error('[MemoryService] Error getting memory context:', error.message);
            // Fallback to semantic memory service
            try {
                const context = await semanticMemoryService.getSemanticMemoryContext(userId, query);
                return context;
            } catch (fallbackError) {
                console.error('[MemoryService] Error getting fallback memory context:', fallbackError.message);
                return '';
            }
        }
    }

    /**
     * Format ranked memories for prompt injection
     * @private
     */
    formatRankedMemoriesForPrompt(rankedMemories) {
        try {
            // Group by category
            const grouped = {};
            rankedMemories.forEach(memory => {
                if (!grouped[memory.category]) {
                    grouped[memory.category] = [];
                }
                grouped[memory.category].push({
                    content: memory.content,
                    importance: memory.importance_score,
                    relevance: memory.relevance_score
                });
            });

            // Format for prompt
            let context = '\n\n[USER MEMORIES - Use these to personalize responses]\n';
            context += '[Memories are ranked by relevance and importance]\n\n';

            for (const [category, items] of Object.entries(grouped)) {
                context += `\n${category.toUpperCase()}:\n`;
                items.forEach(item => {
                    context += `- ${item.content}\n`;
                });
            }

            context += '\n[END USER MEMORIES]\n';
            context += `[Injected ${rankedMemories.length} most relevant memories]\n`;

            return context;
        } catch (error) {
            console.error('[MemoryService] Error formatting ranked memories:', error.message);
            return '';
        }
    }

    /**
     * Get enriched prompt context with reasoning (Phase 4.5B)
     * @param {number} userId - User ID
     * @param {string} query - Current query
     * @param {number} memoryId - Optional specific memory ID
     * @returns {Promise<string>} Enriched context for prompt injection
     */
    async getEnrichedPromptContext(userId, query = null, memoryId = null) {
        try {
            return await knowledgeReasoningService.getEnrichedPromptContext(userId, query, memoryId);
        } catch (error) {
            console.error('[MemoryService] Error getting enriched prompt context:', error.message);
            // Fallback to standard memory context
            return await this.getMemoryContext(userId, query);
        }
    }

    /**
     * Update memory usage statistics (called when memory is used in prompt)
     * @param {number} memoryId - Memory ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Updated memory
     */
    async updateMemoryUsage(memoryId, userId) {
        return await memoryEvolutionService.updateMemoryUsage(memoryId, userId);
    }

    /**
     * Boost memory importance (called when memory is relevant in AI response)
     * @param {number} memoryId - Memory ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Updated memory
     */
    async boostMemory(memoryId, userId) {
        return await memoryEvolutionService.boostMemory(memoryId, userId);
    }

    /**
     * Get ranked memories for a user
     * @param {number} userId - User ID
     * @param {number} limit - Maximum number of memories
     * @returns {Promise<Array>} Ranked memories
     */
    async getRankedMemories(userId, limit = 10) {
        return await memoryEvolutionService.getRankedMemories(userId, limit);
    }

    /**
     * Get memory evolution statistics
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Evolution statistics
     */
    async getEvolutionStats(userId) {
        return await memoryEvolutionService.getEvolutionStats(userId);
    }

    /**
     * Log action to memory history
     * @private
     */
    async logHistory(userId, memoryId, action, oldContent, newContent) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO memory_history (memory_id, user_id, action, old_content, new_content)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.run(sql, [memoryId, userId, action, oldContent, newContent], function (err) {
                if (err) {
                    console.error('[MemoryService] Error logging history:', err.message);
                    return reject(err);
                }
                resolve(this.lastID);
            });
        });
    }

    /**
     * Check for duplicate memories (enhanced with semantic search)
     * @param {number} userId - User ID
     * @param {string} content - Memory content to check
     * @param {string} category - Memory category
     * @returns {Promise<Object|null>} Duplicate memory if exists
     */
    async findDuplicate(userId, content, category) {
        try {
            // Use semantic duplicate detection
            const duplicateCheck = await semanticMemoryService.checkForDuplicates(userId, content, category);
            if (duplicateCheck && duplicateCheck.isDuplicate) {
                return duplicateCheck.memory;
            }
            return null;
        } catch (error) {
            console.error('[MemoryService] Error checking duplicate:', error.message);
            // Fallback to exact match
            return new Promise((resolve, reject) => {
                const sql = `
                    SELECT * FROM memories
                    WHERE user_id = ? AND category = ? AND LOWER(content) = LOWER(?)
                    LIMIT 1
                `;

                db.get(sql, [userId, category, content.trim()], (err, row) => {
                    if (err) {
                        console.error('[MemoryService] Error checking duplicate (fallback):', err.message);
                        return reject(err);
                    }
                    resolve(row || null);
                });
            });
        }
    }

    /**
     * Get memory intelligence report (Phase 4.5C)
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Intelligence report
     */
    async getMemoryIntelligenceReport(userId) {
        try {
            return await memoryIntelligenceService.getMemoryIntelligenceReport(userId);
        } catch (error) {
            console.error('[MemoryService] Error getting intelligence report:', error.message);
            throw error;
        }
    }

    /**
     * Detect memory conflicts (Phase 4.5C)
     * @param {number} userId - User ID
     * @returns {Promise<Array>} List of conflicts
     */
    async detectMemoryConflicts(userId) {
        try {
            return await memoryIntelligenceService.detectMemoryConflicts(userId);
        } catch (error) {
            console.error('[MemoryService] Error detecting conflicts:', error.message);
            return [];
        }
    }

    /**
     * Detect duplicate clusters (Phase 4.5C)
     * @param {number} userId - User ID
     * @returns {Promise<Array>} List of duplicate clusters
     */
    async detectDuplicateClusters(userId) {
        try {
            return await memoryIntelligenceService.detectDuplicateClusters(userId);
        } catch (error) {
            console.error('[MemoryService] Error detecting duplicates:', error.message);
            return [];
        }
    }
}

module.exports = new MemoryService();