const db = require('../config/db');
const semanticMemoryService = require('./semanticMemoryService');

class KnowledgeGraphService {
    constructor() {
        // Supported relationship types
        this.relationTypes = [
            'related_to',
            'similar_to',
            'depends_on',
            'part_of',
            'goal_of',
            'works_with',
            'custom'
        ];

        // Default confidence threshold for automatic relationship creation
        this.defaultConfidenceThreshold = 0.75;

        // Mapping of relationship types to semantic similarity thresholds
        this.relationThresholds = {
            'related_to': 0.70,
            'similar_to': 0.80,
            'depends_on': 0.65,
            'part_of': 0.75,
            'goal_of': 0.70,
            'works_with': 0.75,
            'custom': 0.75
        };
    }

    /**
     * Create a knowledge edge (relationship) between two memories
     * @param {number} sourceMemoryId - Source memory ID
     * @param {number} targetMemoryId - Target memory ID
     * @param {string} relationType - Type of relationship
     * @param {number} confidence - Confidence score (0-1)
     * @returns {Promise<Object>} Created knowledge edge
     */
    async createEdge(sourceMemoryId, targetMemoryId, relationType, confidence = 0.5) {
        try {
            if (!sourceMemoryId || !targetMemoryId) {
                throw new Error('Source and target memory IDs are required.');
            }

            if (!relationType) {
                throw new Error('Relationship type is required.');
            }

            if (!this.relationTypes.includes(relationType)) {
                throw new Error(`Invalid relationship type. Must be one of: ${this.relationTypes.join(', ')}`);
            }

            if (confidence < 0 || confidence > 1) {
                throw new Error('Confidence must be between 0 and 1.');
            }

            if (sourceMemoryId === targetMemoryId) {
                throw new Error('Cannot create a relationship between a memory and itself.');
            }

            const sql = `
                INSERT OR REPLACE INTO knowledge_edges (source_memory_id, target_memory_id, relation_type, confidence, updated_at)
                VALUES (?, ?, ?, ?, ?)
            `;

            const now = new Date().toISOString();

            return new Promise((resolve, reject) => {
                db.run(sql, [sourceMemoryId, targetMemoryId, relationType, confidence, now], function (err) {
                    if (err) {
                        console.error('[KnowledgeGraph] Error creating edge:', err.message);
                        return reject(new Error('Failed to create knowledge edge.'));
                    }

                    resolve({
                        id: this.lastID,
                        source_memory_id: sourceMemoryId,
                        target_memory_id: targetMemoryId,
                        relation_type: relationType,
                        confidence: confidence,
                        created_at: now,
                        updated_at: now
                    });
                });
            });
        } catch (error) {
            console.error('[KnowledgeGraph] Error in createEdge:', error.message);
            throw error;
        }
    }

    /**
     * Update an existing knowledge edge
     * @param {number} edgeId - Edge ID
     * @param {Object} updates - Fields to update (relation_type, confidence)
     * @returns {Promise<Object>} Updated edge
     */
    async updateEdge(edgeId, updates) {
        try {
            if (!edgeId) {
                throw new Error('Edge ID is required.');
            }

            const allowedFields = ['relation_type', 'confidence'];
            const updateFields = [];
            const updateValues = [];

            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('No valid fields to update.');
            }

            updateFields.push('updated_at = ?');
            updateValues.push(new Date().toISOString());
            updateValues.push(edgeId);

            const sql = `
                UPDATE knowledge_edges
                SET ${updateFields.join(', ')}
                WHERE id = ?
            `;

            return new Promise((resolve, reject) => {
                db.run(sql, updateValues, function (err) {
                    if (err) {
                        console.error('[KnowledgeGraph] Error updating edge:', err.message);
                        return reject(new Error('Failed to update knowledge edge.'));
                    }

                    if (this.changes === 0) {
                        return reject(new Error('Knowledge edge not found.'));
                    }

                    // Fetch updated edge
                    const getSql = `SELECT * FROM knowledge_edges WHERE id = ?`;
                    db.get(getSql, [edgeId], (getErr, row) => {
                        if (getErr || !row) {
                            return reject(new Error('Failed to retrieve updated edge.'));
                        }
                        resolve(row);
                    });
                });
            });
        } catch (error) {
            console.error('[KnowledgeGraph] Error in updateEdge:', error.message);
            throw error;
        }
    }

    /**
     * Delete a knowledge edge
     * @param {number} edgeId - Edge ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteEdge(edgeId) {
        try {
            if (!edgeId) {
                throw new Error('Edge ID is required.');
            }

            const sql = `DELETE FROM knowledge_edges WHERE id = ?`;

            return new Promise((resolve, reject) => {
                db.run(sql, [edgeId], function (err) {
                    if (err) {
                        console.error('[KnowledgeGraph] Error deleting edge:', err.message);
                        return reject(new Error('Failed to delete knowledge edge.'));
                    }

                    if (this.changes === 0) {
                        return reject(new Error('Knowledge edge not found.'));
                    }

                    resolve(true);
                });
            });
        } catch (error) {
            console.error('[KnowledgeGraph] Error in deleteEdge:', error.message);
            throw error;
        }
    }

    /**
     * Get all relationships for a memory
     * @param {number} memoryId - Memory ID
     * @param {string} direction - 'outgoing', 'incoming', or 'both'
     * @param {string} relationType - Optional filter by relationship type
     * @returns {Promise<Array>} Related edges with memory details
     */
    async getRelationships(memoryId, direction = 'both', relationType = null) {
        try {
            if (!memoryId) {
                throw new Error('Memory ID is required.');
            }

            let sql = `
                SELECT 
                    ke.id,
                    ke.source_memory_id,
                    ke.target_memory_id,
                    ke.relation_type,
                    ke.confidence,
                    ke.created_at,
                    ke.updated_at,
                    m.id as related_memory_id,
                    m.user_id,
                    m.category,
                    m.content,
                    m.confidence as memory_confidence,
                    m.source,
                    m.importance_score,
                    m.created_at as memory_created_at,
                    m.updated_at as memory_updated_at
                FROM knowledge_edges ke
                INNER JOIN memories m ON (
                    (ke.source_memory_id = ? AND m.id = ke.target_memory_id) OR
                    (ke.target_memory_id = ? AND m.id = ke.source_memory_id)
                )
                WHERE (ke.source_memory_id = ? OR ke.target_memory_id = ?)
            `;

            const params = [memoryId, memoryId, memoryId, memoryId];

            if (relationType) {
                sql += ` AND ke.relation_type = ?`;
                params.push(relationType);
            }

            if (direction === 'outgoing') {
                sql += ` AND ke.source_memory_id = ?`;
                params.push(memoryId);
            } else if (direction === 'incoming') {
                sql += ` AND ke.target_memory_id = ?`;
                params.push(memoryId);
            }

            sql += ` ORDER BY ke.confidence DESC, ke.updated_at DESC`;

            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) {
                        console.error('[KnowledgeGraph] Error fetching relationships:', err.message);
                        return reject(new Error('Failed to fetch relationships.'));
                    }

                    // Parse memory data and determine direction
                    const relationships = rows.map(row => {
                        const isOutgoing = row.source_memory_id === memoryId;
                        return {
                            id: row.id,
                            source_memory_id: row.source_memory_id,
                            target_memory_id: row.target_memory_id,
                            relation_type: row.relation_type,
                            confidence: row.confidence,
                            created_at: row.created_at,
                            updated_at: row.updated_at,
                            direction: isOutgoing ? 'outgoing' : 'incoming',
                            related_memory: {
                                id: row.related_memory_id,
                                user_id: row.user_id,
                                category: row.category,
                                content: row.content,
                                confidence: row.memory_confidence,
                                source: row.source,
                                importance_score: row.importance_score,
                                created_at: row.memory_created_at,
                                updated_at: row.memory_updated_at
                            }
                        };
                    });

                    resolve(relationships);
                });
            });
        } catch (error) {
            console.error('[KnowledgeGraph] Error in getRelationships:', error.message);
            throw error;
        }
    }

    /**
     * Get related memories for a memory (convenience method)
     * @param {number} memoryId - Memory ID
     * @param {string} relationType - Optional filter by relationship type
     * @returns {Promise<Array>} Related memories
     */
    async getRelatedMemories(memoryId, relationType = null) {
        try {
            const relationships = await this.getRelationships(memoryId, 'both', relationType);
            return relationships.map(rel => ({
                ...rel.related_memory,
                relationship_type: rel.relation_type,
                relationship_confidence: rel.confidence,
                relationship_direction: rel.direction
            }));
        } catch (error) {
            console.error('[KnowledgeGraph] Error in getRelatedMemories:', error.message);
            throw error;
        }
    }

    /**
     * Automatically build relationships for a memory based on semantic similarity
     * @param {number} userId - User ID
     * @param {number} memoryId - Memory ID
     * @param {number} threshold - Similarity threshold (optional)
     * @returns {Promise<Array>} Created relationships
     */
    async buildAutomaticRelationships(userId, memoryId, threshold = null) {
        try {
            if (!userId || !memoryId) {
                throw new Error('User ID and Memory ID are required.');
            }

            // Get the memory content
            const memory = await new Promise((resolve, reject) => {
                const sql = `SELECT * FROM memories WHERE id = ? AND user_id = ?`;
                db.get(sql, [memoryId, userId], (err, row) => {
                    if (err) return reject(err);
                    if (!row) return reject(new Error('Memory not found.'));
                    resolve(row);
                });
            });

            // Find semantically similar memories
            const similarMemories = await semanticMemoryService.findSimilarMemories(
                userId,
                memory.content,
                threshold || this.defaultConfidenceThreshold
            );

            // Create relationships for similar memories
            const createdRelationships = [];
            for (const similarMemory of similarMemories) {
                if (similarMemory.id === memoryId) {
                    continue; // Skip self-relationships
                }

                try {
                    // Determine relationship type based on similarity score
                    const relationType = this.determineRelationshipType(similarMemory.similarity);

                    const edge = await this.createEdge(
                        memoryId,
                        similarMemory.id,
                        relationType,
                        similarMemory.similarity
                    );

                    createdRelationships.push(edge);
                } catch (err) {
                    // Skip if relationship already exists
                    console.warn(`[KnowledgeGraph] Could not create relationship with memory ${similarMemory.id}:`, err.message);
                }
            }

            return createdRelationships;
        } catch (error) {
            console.error('[KnowledgeGraph] Error in buildAutomaticRelationships:', error.message);
            throw error;
        }
    }

    /**
     * Determine relationship type based on similarity score
     * @param {number} similarity - Similarity score (0-1)
     * @returns {string} Relationship type
     */
    determineRelationshipType(similarity) {
        if (similarity >= 0.90) {
            return 'similar_to';
        } else if (similarity >= 0.80) {
            return 'related_to';
        } else if (similarity >= 0.70) {
            return 'works_with';
        } else {
            return 'related_to';
        }
    }

    /**
     * Get graph statistics for a user
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Graph statistics
     */
    async getGraphStats(userId) {
        try {
            const stats = {};

            // Total edges
            const totalEdges = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT COUNT(*) as count 
                    FROM knowledge_edges ke
                    INNER JOIN memories m ON ke.source_memory_id = m.id
                    WHERE m.user_id = ?
                `;
                db.get(sql, [userId], (err, row) => {
                    if (err) return reject(err);
                    resolve(row.count);
                });
            });
            stats.total_edges = totalEdges;

            // Edges by relation type
            const edgesByType = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT ke.relation_type, COUNT(*) as count
                    FROM knowledge_edges ke
                    INNER JOIN memories m ON ke.source_memory_id = m.id
                    WHERE m.user_id = ?
                    GROUP BY ke.relation_type
                    ORDER BY count DESC
                `;
                db.all(sql, [userId], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                });
            });
            stats.edges_by_type = edgesByType;

            // Memories with relationships
            const memoriesWithRelations = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT COUNT(DISTINCT m.id) as count
                    FROM memories m
                    LEFT JOIN knowledge_edges ke ON m.id = ke.source_memory_id OR m.id = ke.target_memory_id
                    WHERE m.user_id = ? AND ke.id IS NOT NULL
                `;
                db.get(sql, [userId], (err, row) => {
                    if (err) return reject(err);
                    resolve(row.count);
                });
            });
            stats.memories_with_relationships = memoriesWithRelations;

            // Average confidence
            const avgConfidence = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT AVG(ke.confidence) as avg
                    FROM knowledge_edges ke
                    INNER JOIN memories m ON ke.source_memory_id = m.id
                    WHERE m.user_id = ?
                `;
                db.get(sql, [userId], (err, row) => {
                    if (err) return reject(err);
                    resolve(row.avg || 0);
                });
            });
            stats.average_confidence = Math.round(avgConfidence * 100) / 100;

            return stats;
        } catch (error) {
            console.error('[KnowledgeGraph] Error in getGraphStats:', error.message);
            throw error;
        }
    }

    /**
     * Delete all edges for a memory (cleanup when memory is deleted)
     * @param {number} memoryId - Memory ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteEdgesForMemory(memoryId) {
        try {
            const sql = `
                DELETE FROM knowledge_edges 
                WHERE source_memory_id = ? OR target_memory_id = ?
            `;

            return new Promise((resolve, reject) => {
                db.run(sql, [memoryId, memoryId], function (err) {
                    if (err) {
                        console.error('[KnowledgeGraph] Error deleting edges for memory:', err.message);
                        return reject(new Error('Failed to delete edges for memory.'));
                    }
                    resolve(true);
                });
            });
        } catch (error) {
            console.error('[KnowledgeGraph] Error in deleteEdgesForMemory:', error.message);
            throw error;
        }
    }

    /**
     * Get all relationship types
     * @returns {Array} List of supported relationship types
     */
    getRelationTypes() {
        return [...this.relationTypes];
    }

    /**
     * Validate relationship type
     * @param {string} relationType - Relationship type to validate
     * @returns {boolean} Whether the relationship type is valid
     */
    isValidRelationType(relationType) {
        return this.relationTypes.includes(relationType);
    }

    /**
     * Get connected memories up to a specified depth
     * @param {number} memoryId - Starting memory ID
     * @param {number} maxDepth - Maximum traversal depth (default: 2)
     * @returns {Promise<Object>} Connected memories with traversal info
     */
    async getConnectedMemories(memoryId, maxDepth = 2) {
        try {
            if (!memoryId) {
                throw new Error('Memory ID is required.');
            }

            if (maxDepth < 1 || maxDepth > 3) {
                throw new Error('Max depth must be between 1 and 3.');
            }

            // Verify memory exists
            const memoryExists = await new Promise((resolve, reject) => {
                const sql = `SELECT id FROM memories WHERE id = ?`;
                db.get(sql, [memoryId], (err, row) => {
                    if (err) return reject(err);
                    resolve(!!row);
                });
            });

            if (!memoryExists) {
                throw new Error('Memory not found.');
            }

            const visited = new Set();
            const connected = new Map(); // memoryId -> { memory, depth, path, relationships }

            // BFS traversal
            const queue = [{ memoryId, depth: 0, path: [memoryId] }];
            visited.add(memoryId);

            while (queue.length > 0) {
                const { memoryId: currentId, depth, path } = queue.shift();

                if (depth >= maxDepth) {
                    continue;
                }

                // Get all relationships for current memory
                const relationships = await this.getRelationships(currentId, 'both');

                for (const rel of relationships) {
                    const relatedId = rel.related_memory.id;

                    if (!visited.has(relatedId)) {
                        visited.add(relatedId);

                        // Store connected memory info
                        if (!connected.has(relatedId)) {
                            connected.set(relatedId, {
                                memory: rel.related_memory,
                                depth: depth + 1,
                                path: [...path, relatedId],
                                relationships: []
                            });
                        }

                        // Add relationship info
                        connected.get(relatedId).relationships.push({
                            type: rel.relation_type,
                            confidence: rel.confidence,
                            direction: rel.direction,
                            from: rel.source_memory_id,
                            to: rel.target_memory_id
                        });

                        // Add to queue for further traversal
                        queue.push({
                            memoryId: relatedId,
                            depth: depth + 1,
                            path: [...path, relatedId]
                        });
                    }
                }
            }

            // Convert map to array and sort by depth then confidence
            const connectedMemories = Array.from(connected.values())
                .sort((a, b) => {
                    if (a.depth !== b.depth) {
                        return a.depth - b.depth;
                    }
                    // Sort by max relationship confidence
                    const maxConfA = Math.max(...a.relationships.map(r => r.confidence));
                    const maxConfB = Math.max(...b.relationships.map(r => r.confidence));
                    return maxConfB - maxConfA;
                });

            return {
                connected_memories: connectedMemories,
                total_count: connectedMemories.length,
                max_depth_reached: Math.max(...connectedMemories.map(m => m.depth), 0),
                traversal_stats: {
                    nodes_visited: visited.size,
                    edges_traversed: connectedMemories.reduce((sum, m) => sum + m.relationships.length, 0)
                }
            };
        } catch (error) {
            console.error('[KnowledgeGraph] Error in getConnectedMemories:', error.message);
            throw error;
        }
    }

    /**
     * Build a concise context summary from connected memories
     * @param {number} memoryId - Starting memory ID
     * @param {number} maxDepth - Maximum traversal depth (default: 2)
     * @param {number} maxMemories - Maximum memories to include in summary (default: 10)
     * @returns {Promise<Object>} Context summary
     */
    async buildContextSummary(memoryId, maxDepth = 2, maxMemories = 10) {
        try {
            if (!memoryId) {
                throw new Error('Memory ID is required.');
            }

            // Get the starting memory
            const startMemory = await new Promise((resolve, reject) => {
                const sql = `SELECT * FROM memories WHERE id = ?`;
                db.get(sql, [memoryId], (err, row) => {
                    if (err) return reject(err);
                    if (!row) return reject(new Error('Memory not found.'));
                    resolve(row);
                });
            });

            // Get connected memories
            const { connected_memories } = await this.getConnectedMemories(memoryId, maxDepth);

            // Limit memories
            const limitedMemories = connected_memories.slice(0, maxMemories);

            // Group by relationship type
            const byRelationType = {};
            for (const connected of limitedMemories) {
                for (const rel of connected.relationships) {
                    if (!byRelationType[rel.type]) {
                        byRelationType[rel.type] = [];
                    }
                    byRelationType[rel.type].push({
                        memory: connected.memory,
                        confidence: rel.confidence,
                        direction: rel.direction
                    });
                }
            }

            // Build summary sections
            const summary = {
                memory_id: memoryId,
                memory_content: startMemory.content,
                memory_category: startMemory.category,
                connected_count: connected_memories.length,
                included_count: limitedMemories.length,
                sections: []
            };

            // Add section for each relationship type
            for (const [relationType, memories] of Object.entries(byRelationType)) {
                if (memories.length === 0) continue;

                const section = {
                    relation_type: relationType,
                    count: memories.length,
                    memories: memories
                        .sort((a, b) => b.confidence - a.confidence)
                        .slice(0, 5)
                        .map(m => ({
                            id: m.memory.id,
                            category: m.memory.category,
                            content: m.memory.content,
                            confidence: m.confidence,
                            direction: m.direction
                        }))
                };

                summary.sections.push(section);
            }

            // Generate concise text summary
            let textSummary = `Memory: "${startMemory.content}"\n`;
            textSummary += `Category: ${startMemory.category}\n\n`;
            textSummary += `Connected Memories (${limitedMemories.length} of ${connected_memories.length}):\n`;

            for (const section of summary.sections) {
                textSummary += `\n[${section.relation_type.toUpperCase()}]\n`;
                for (const mem of section.memories) {
                    const direction = mem.direction === 'outgoing' ? '→' : '←';
                    textSummary += `${direction} ${mem.content} (${(mem.confidence * 100).toFixed(0)}%)\n`;
                }
            }

            summary.text_summary = textSummary;

            return summary;
        } catch (error) {
            console.error('[KnowledgeGraph] Error in buildContextSummary:', error.message);
            throw error;
        }
    }
}

module.exports = new KnowledgeGraphService();
