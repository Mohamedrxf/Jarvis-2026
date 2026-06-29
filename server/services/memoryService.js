const db = require('../config/db');

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
    createMemory(userId, category, content, confidence = 1.0, source = 'manual') {
        return new Promise((resolve, reject) => {
            if (!userId || !category || !content) {
                return reject(new Error('User ID, category, and content are required.'));
            }

            const validCategories = ['identity', 'preferences', 'education', 'work', 'goals'];
            if (!validCategories.includes(category)) {
                return reject(new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`));
            }

            const sql = `
                INSERT INTO memories (user_id, category, content, confidence, source)
                VALUES (?, ?, ?, ?, ?)
            `;

            const self = this;
            db.run(sql, [userId, category, content.trim(), confidence, source], function (err) {
                if (err) {
                    console.error('[MemoryService] Error creating memory:', err.message);
                    return reject(new Error('Failed to create memory.'));
                }

                const memoryId = this.lastID;
                const newMemory = {
                    id: memoryId,
                    user_id: userId,
                    category,
                    content: content.trim(),
                    confidence,
                    source,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // Log to history (fire and forget)
                self.logHistory(userId, memoryId, 'created', null, content.trim()).catch(() => { });

                resolve(newMemory);
            });
        });
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
     * Search memories by content
     * @param {number} userId - User ID
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching memories
     */
    searchMemories(userId, query) {
        return new Promise((resolve, reject) => {
            if (!userId || !query) {
                return reject(new Error('User ID and search query are required.'));
            }

            const searchTerm = `%${query}%`;
            const sql = `
                SELECT * FROM memories
                WHERE user_id = ? AND content LIKE ?
                ORDER BY confidence DESC, updated_at DESC
            `;

            db.all(sql, [userId, searchTerm], (err, rows) => {
                if (err) {
                    console.error('[MemoryService] Error searching memories:', err.message);
                    return reject(new Error('Failed to search memories.'));
                }

                resolve(rows);
            });
        });
    }

    /**
     * Get memories formatted for AI prompt injection
     * @param {number} userId - User ID
     * @returns {Promise<string>} Formatted memory context
     */
    async getMemoryContext(userId) {
        try {
            const memories = await this.getMemories(userId);

            if (memories.length === 0) {
                return '';
            }

            // Group by category
            const grouped = {};
            memories.forEach(memory => {
                if (!grouped[memory.category]) {
                    grouped[memory.category] = [];
                }
                grouped[memory.category].push(memory.content);
            });

            // Format for prompt
            let context = '\n\n[USER MEMORIES - Use these to personalize responses]\n';

            for (const [category, items] of Object.entries(grouped)) {
                context += `\n${category.toUpperCase()}:\n`;
                items.forEach(item => {
                    context += `- ${item}\n`;
                });
            }

            context += '\n[END USER MEMORIES]\n';
            return context;
        } catch (error) {
            console.error('[MemoryService] Error getting memory context:', error.message);
            return '';
        }
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
     * Check for duplicate memories
     * @param {number} userId - User ID
     * @param {string} content - Memory content to check
     * @param {string} category - Memory category
     * @returns {Promise<Object|null>} Duplicate memory if exists
     */
    findDuplicate(userId, content, category) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM memories
                WHERE user_id = ? AND category = ? AND LOWER(content) = LOWER(?)
                LIMIT 1
            `;

            db.get(sql, [userId, category, content.trim()], (err, row) => {
                if (err) {
                    console.error('[MemoryService] Error checking duplicate:', err.message);
                    return reject(err);
                }
                resolve(row || null);
            });
        });
    }
}

module.exports = new MemoryService();