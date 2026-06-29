const db = require('../config/db');

class MemoryEvolutionService {
    /**
     * Configuration for memory evolution
     */
    constructor() {
        this.config = {
            // Decay settings
            decayBaseRate: 0.01,           // Base decay rate per day
            decayMinDays: 7,               // Minimum days before decay applies
            decayMaxReduction: 0.3,        // Maximum importance reduction per decay cycle

            // Boost settings
            boostAmount: 0.1,              // Importance increase per use
            boostMaxIncrease: 0.2,         // Maximum boost per update

            // Importance calculation weights
            weightImportance: 0.4,         // Weight for current importance score
            weightRecency: 0.3,            // Weight for recency factor
            weightFrequency: 0.3,          // Weight for access frequency

            // Limits
            minImportance: 0.0,            // Minimum importance score
            maxImportance: 1.0,            // Maximum importance score
            maxMemoriesToInject: 10,       // Maximum memories to inject into prompt
            minImportanceThreshold: 0.2    // Minimum importance to consider for injection
        };
    }

    /**
     * Update memory usage when it's accessed in a prompt
     * @param {number} memoryId - Memory ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Updated memory
     */
    async updateMemoryUsage(memoryId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE memories
                SET 
                    access_count = access_count + 1,
                    last_accessed_at = ?,
                    updated_at = ?
                WHERE id = ? AND user_id = ?
            `;

            const now = new Date().toISOString();
            db.run(sql, [now, now, memoryId, userId], function (err) {
                if (err) {
                    console.error('[MemoryEvolution] Error updating memory usage:', err.message);
                    return reject(new Error('Failed to update memory usage.'));
                }

                if (this.changes === 0) {
                    return reject(new Error('Memory not found or you do not have permission.'));
                }

                // Get updated memory
                const getSql = `SELECT * FROM memories WHERE id = ? AND user_id = ?`;
                db.get(getSql, [memoryId, userId], (getErr, row) => {
                    if (getErr || !row) {
                        return reject(new Error('Failed to retrieve updated memory.'));
                    }
                    resolve(row);
                });
            });
        });
    }

    /**
     * Calculate importance score for a memory
     * @param {Object} memory - Memory object
     * @returns {Promise<number>} Calculated importance score (0-1)
     */
    async calculateImportance(memory) {
        try {
            const now = new Date();
            const lastAccessed = new Date(memory.last_accessed_at);
            const created = new Date(memory.created_at);

            // Calculate days since last access
            const daysSinceAccess = (now - lastAccessed) / (1000 * 60 * 60 * 24);

            // Calculate recency factor (0-1, higher for recent access)
            // Exponential decay: 1.0 for today, 0.5 after 7 days, ~0.1 after 30 days
            const recencyFactor = Math.exp(-daysSinceAccess / 7);

            // Calculate access frequency factor (0-1)
            // Normalize access_count: 0 accesses = 0, 10+ accesses = 1
            const frequencyFactor = Math.min(memory.access_count / 10, 1.0);

            // Calculate age factor (newer memories get slight boost)
            const daysSinceCreation = (now - created) / (1000 * 60 * 60 * 24);
            const ageFactor = Math.max(0, 1 - (daysSinceCreation / 365)); // Decays over a year

            // Combine factors with weights
            const calculatedImportance =
                (memory.importance_score * this.config.weightImportance) +
                (recencyFactor * this.config.weightRecency) +
                (frequencyFactor * this.config.weightFrequency) +
                (ageFactor * 0.1); // Small weight for age

            // Clamp between min and max
            return Math.max(this.config.minImportance,
                Math.min(this.config.maxImportance, calculatedImportance));
        } catch (error) {
            console.error('[MemoryEvolution] Error calculating importance:', error.message);
            return memory.importance_score || 0.5;
        }
    }

    /**
     * Apply decay to a memory based on time since last access
     * @param {Object} memory - Memory object
     * @returns {Promise<Object>} Memory with updated importance
     */
    async applyDecay(memory) {
        try {
            const now = new Date();
            const lastAccessed = new Date(memory.last_accessed_at);

            // Calculate days since last access
            const daysSinceAccess = (now - lastAccessed) / (1000 * 60 * 60 * 24);

            // Only apply decay if memory hasn't been accessed for minimum days
            if (daysSinceAccess < this.config.decayMinDays) {
                return memory;
            }

            // Calculate decay amount
            // Linear decay based on days beyond minimum
            const daysBeyondMin = daysSinceAccess - this.config.decayMinDays;
            const decayAmount = Math.min(
                this.config.decayBaseRate * daysBeyondMin,
                this.config.decayMaxReduction
            );

            // Apply decay
            const newImportance = Math.max(
                this.config.minImportance,
                memory.importance_score - decayAmount
            );

            // Update in database if significance changed
            if (Math.abs(newImportance - memory.importance_score) > 0.001) {
                const sql = `
                    UPDATE memories
                    SET importance_score = ?, updated_at = ?
                    WHERE id = ? AND user_id = ?
                `;

                const now = new Date().toISOString();
                await new Promise((resolve, reject) => {
                    db.run(sql, [newImportance, now, memory.id, memory.user_id], function (err) {
                        if (err) {
                            console.error('[MemoryEvolution] Error applying decay:', err.message);
                            return reject(err);
                        }
                        resolve();
                    });
                });

                memory.importance_score = newImportance;
            }

            return memory;
        } catch (error) {
            console.error('[MemoryEvolution] Error in applyDecay:', error.message);
            return memory;
        }
    }

    /**
     * Get ranked memories for a user based on relevance
     * @param {number} userId - User ID
     * @param {number} limit - Maximum number of memories to return
     * @returns {Promise<Array>} Ranked memories
     */
    async getRankedMemories(userId, limit = this.config.maxMemoriesToInject) {
        return new Promise((resolve, reject) => {
            // Get all memories for user
            const sql = `
                SELECT * FROM memories
                WHERE user_id = ?
                ORDER BY updated_at DESC
            `;

            db.all(sql, [userId], async (err, rows) => {
                if (err) {
                    console.error('[MemoryEvolution] Error fetching memories for ranking:', err.message);
                    return reject(new Error('Failed to fetch memories for ranking.'));
                }

                if (rows.length === 0) {
                    return resolve([]);
                }

                // Calculate relevance score for each memory
                const now = new Date();
                const rankedMemories = await Promise.all(
                    rows.map(async (memory) => {
                        // Apply decay first
                        const decayedMemory = await this.applyDecay(memory);

                        // Calculate recency factor
                        const lastAccessed = new Date(decayedMemory.last_accessed_at);
                        const daysSinceAccess = (now - lastAccessed) / (1000 * 60 * 60 * 24);
                        const recencyFactor = Math.exp(-daysSinceAccess / 7);

                        // Calculate frequency factor
                        const frequencyFactor = Math.min(decayedMemory.access_count / 10, 1.0);

                        // Combined relevance score
                        const relevanceScore =
                            (decayedMemory.importance_score * this.config.weightImportance) +
                            (recencyFactor * this.config.weightRecency) +
                            (frequencyFactor * this.config.weightFrequency);

                        return {
                            ...decayedMemory,
                            relevance_score: relevanceScore
                        };
                    })
                );

                // Filter by minimum importance threshold
                const filteredMemories = rankedMemories.filter(
                    memory => memory.importance_score >= this.config.minImportanceThreshold
                );

                // Sort by relevance score (descending)
                filteredMemories.sort((a, b) => b.relevance_score - a.relevance_score);

                // Return top memories up to limit
                return resolve(filteredMemories.slice(0, limit));
            });
        });
    }

    /**
     * Boost memory importance when it's reused in prompts
     * @param {number} memoryId - Memory ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Updated memory
     */
    async boostMemory(memoryId, userId) {
        return new Promise((resolve, reject) => {
            // First get current memory
            const getSql = `SELECT * FROM memories WHERE id = ? AND user_id = ?`;
            db.get(getSql, [memoryId, userId], async (getErr, memory) => {
                if (getErr || !memory) {
                    return reject(new Error('Memory not found or you do not have permission.'));
                }

                // Calculate new importance with boost
                const newImportance = Math.min(
                    this.config.maxImportance,
                    memory.importance_score + this.config.boostAmount
                );

                // Update memory
                const now = new Date().toISOString();
                const sql = `
                    UPDATE memories
                    SET 
                        importance_score = ?,
                        access_count = access_count + 1,
                        last_accessed_at = ?,
                        updated_at = ?
                    WHERE id = ? AND user_id = ?
                `;

                db.run(sql, [newImportance, now, now, memoryId, userId], function (err) {
                    if (err) {
                        console.error('[MemoryEvolution] Error boosting memory:', err.message);
                        return reject(new Error('Failed to boost memory.'));
                    }

                    // Get updated memory
                    const updatedSql = `SELECT * FROM memories WHERE id = ? AND user_id = ?`;
                    db.get(updatedSql, [memoryId, userId], (updatedErr, row) => {
                        if (updatedErr || !row) {
                            return reject(new Error('Failed to retrieve updated memory.'));
                        }
                        resolve(row);
                    });
                });
            });
        });
    }

    /**
     * Get memory context formatted for AI prompt injection (with ranking)
     * @param {number} userId - User ID
     * @returns {Promise<string>} Formatted memory context with top-ranked memories
     */
    async getRankedMemoryContext(userId) {
        try {
            // Get ranked memories
            const rankedMemories = await this.getRankedMemories(userId);

            if (rankedMemories.length === 0) {
                return '';
            }

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
            console.error('[MemoryEvolution] Error getting ranked memory context:', error.message);
            return '';
        }
    }

    /**
     * Batch update memory usage for multiple memories (lazy update)
     * @param {Array} memoryIds - Array of memory IDs
     * @param {number} userId - User ID
     * @returns {Promise<void>}
     */
    async batchUpdateMemoryUsage(memoryIds, userId) {
        try {
            const now = new Date().toISOString();
            const placeholders = memoryIds.map(() => '?').join(',');
            const sql = `
                UPDATE memories
                SET 
                    access_count = access_count + 1,
                    last_accessed_at = ?,
                    updated_at = ?
                WHERE id IN (${placeholders}) AND user_id = ?
            `;

            const params = [now, now, ...memoryIds, userId];

            await new Promise((resolve, reject) => {
                db.run(sql, params, function (err) {
                    if (err) {
                        console.error('[MemoryEvolution] Error batch updating memory usage:', err.message);
                        return reject(err);
                    }
                    resolve();
                });
            });
        } catch (error) {
            console.error('[MemoryEvolution] Error in batchUpdateMemoryUsage:', error.message);
            // Non-critical, don't throw
        }
    }

    /**
     * Get memory statistics including evolution metrics
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Enhanced statistics
     */
    async getEvolutionStats(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    COUNT(*) as total,
                    AVG(importance_score) as avg_importance,
                    AVG(access_count) as avg_access_count,
                    MAX(access_count) as max_access_count,
                    MIN(importance_score) as min_importance,
                    MAX(importance_score) as max_importance,
                    SUM(CASE WHEN last_accessed_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) as recent_access,
                    SUM(CASE WHEN last_accessed_at <= datetime('now', '-7 days') THEN 1 ELSE 0 END) as stale_memories
                FROM memories
                WHERE user_id = ?
            `;

            db.get(sql, [userId], (err, row) => {
                if (err) {
                    console.error('[MemoryEvolution] Error fetching evolution stats:', err.message);
                    return reject(new Error('Failed to fetch evolution statistics.'));
                }

                // Get category breakdown
                const categorySql = `
                    SELECT category, COUNT(*) as count, AVG(importance_score) as avg_importance
                    FROM memories
                    WHERE user_id = ?
                    GROUP BY category
                `;

                db.all(categorySql, [userId], (catErr, catRows) => {
                    if (catErr) {
                        console.error('[MemoryEvolution] Error fetching category stats:', catErr.message);
                        return reject(new Error('Failed to fetch category statistics.'));
                    }

                    const stats = {
                        total: row.total || 0,
                        averageImportance: row.avg_importance || 0,
                        averageAccessCount: row.avg_access_count || 0,
                        maxAccessCount: row.max_access_count || 0,
                        minImportance: row.min_importance || 0,
                        maxImportance: row.max_importance || 0,
                        recentlyAccessed: row.recent_access || 0,
                        staleMemories: row.stale_memories || 0,
                        byCategory: {}
                    };

                    catRows.forEach(cat => {
                        stats.byCategory[cat.category] = {
                            count: cat.count,
                            averageImportance: cat.avg_importance
                        };
                    });

                    resolve(stats);
                });
            });
        });
    }

    /**
     * Recalculate importance for all user memories (maintenance task)
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Update results
     */
    async recalculateAllImportance(userId) {
        try {
            const sql = `SELECT * FROM memories WHERE user_id = ?`;
            const memories = await new Promise((resolve, reject) => {
                db.all(sql, [userId], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                });
            });

            let updated = 0;
            for (const memory of memories) {
                const newImportance = await this.calculateImportance(memory);

                if (Math.abs(newImportance - memory.importance_score) > 0.01) {
                    const updateSql = `
                        UPDATE memories
                        SET importance_score = ?, updated_at = ?
                        WHERE id = ? AND user_id = ?
                    `;

                    const now = new Date().toISOString();
                    await new Promise((resolve, reject) => {
                        db.run(updateSql, [newImportance, now, memory.id, userId], function (err) {
                            if (err) return reject(err);
                            resolve();
                        });
                    });

                    updated++;
                }
            }

            return {
                total: memories.length,
                updated: updated,
                message: `Recalculated importance for ${updated} out of ${memories.length} memories.`
            };
        } catch (error) {
            console.error('[MemoryEvolution] Error recalculating importance:', error.message);
            throw new Error('Failed to recalculate memory importance.');
        }
    }
}

module.exports = new MemoryEvolutionService();