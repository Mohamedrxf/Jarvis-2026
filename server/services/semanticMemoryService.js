const db = require('../config/db');
const { EmbeddingProviderFactory } = require('./embeddingProvider');
const memoryEvolutionService = require('./memoryEvolutionService');

class SemanticMemoryService {
    constructor() {
        try {
            this.embeddingProvider = EmbeddingProviderFactory.create();
        } catch (error) {
            console.error('[SemanticMemory] Error creating embedding provider:', error.message);
            this.embeddingProvider = null;
        }
        this.similarityThreshold = 0.75; // Threshold for considering memories similar
        this.duplicateThreshold = 0.90; // Threshold for considering memories duplicates

        // Hybrid ranking weights
        this.rankingWeights = {
            semantic: 0.4,        // Semantic similarity weight
            importance: 0.3,      // Importance score weight
            recency: 0.2,         // Recency weight
            frequency: 0.1        // Access frequency weight
        };

        // Cluster definitions
        this.clusterDefinitions = {
            'programming': ['programming', 'coding', 'developer', 'software', 'javascript', 'python', 'java', 'react', 'node', 'api', 'database', 'sql', 'git', 'framework'],
            'networking': ['networking', 'network', 'cisco', 'router', 'switch', 'tcp', 'ip', 'dns', 'firewall', 'vpn', 'lan', 'wan'],
            'career': ['career', 'job', 'work', 'company', 'position', 'role', 'experience', 'skills', 'professional'],
            'education': ['education', 'learning', 'study', 'course', 'degree', 'university', 'college', 'certification', 'training'],
            'personal': ['personal', 'family', 'hobby', 'interest', 'preference', 'favorite', 'likes', 'dislikes'],
            'goals': ['goals', 'objective', 'target', 'plan', 'future', 'aspiration', 'dream', 'aim']
        };
    }

    /**
     * Initialize semantic memory service
     */
    async initialize() {
        try {
            // Ensure embedding provider is initialized
            if (!this.embeddingProvider) {
                this.embeddingProvider = EmbeddingProviderFactory.create();
            }

            // Update TF-IDF corpus with existing memories
            if (this.embeddingProvider && this.embeddingProvider.getName() === 'tfidf-fallback') {
                const memories = await this.getAllMemories();
                if (memories.length > 0) {
                    this.embeddingProvider.updateCorpus(memories.map(m => m.content));
                    console.log(`[SemanticMemory] Initialized TF-IDF corpus with ${memories.length} memories`);
                }
            }
        } catch (error) {
            console.error('[SemanticMemory] Error initializing:', error.message);
        }
    }

    /**
     * Get all memories for a user
     * @private
     */
    async getAllMemories() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT content FROM memories`;
            db.all(sql, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    /**
     * Generate embedding for a memory
     * @param {string} content - Memory content
     * @returns {Promise<Object>} Embedding data
     */
    async generateEmbedding(content) {
        try {
            if (!this.embeddingProvider) {
                console.warn('[SemanticMemory] No embedding provider available');
                return null;
            }

            const embedding = await this.embeddingProvider.generateEmbedding(content);
            return {
                embedding: JSON.stringify(embedding),
                model: this.embeddingProvider.getName(),
                updatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('[SemanticMemory] Error generating embedding:', error.message);
            return null;
        }
    }

    /**
     * Calculate cosine similarity between two embeddings
     * @param {Array<number>} embedding1 - First embedding
     * @param {Array<number>} embedding2 - Second embedding
     * @returns {number} Similarity score (0-1)
     */
    cosineSimilarity(embedding1, embedding2) {
        if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
            return 0;
        }

        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            magnitude1 += embedding1[i] * embedding1[i];
            magnitude2 += embedding2[i] * embedding2[i];
        }

        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);

        if (magnitude1 === 0 || magnitude2 === 0) {
            return 0;
        }

        return dotProduct / (magnitude1 * magnitude2);
    }

    /**
     * Find semantically similar memories
     * @param {number} userId - User ID
     * @param {string} content - Content to compare
     * @param {number} threshold - Similarity threshold
     * @returns {Promise<Array>} Similar memories
     */
    async findSimilarMemories(userId, content, threshold = this.similarityThreshold) {
        try {
            // Generate embedding for query content
            const queryEmbeddingData = await this.generateEmbedding(content);
            if (!queryEmbeddingData) {
                return [];
            }

            const queryEmbedding = JSON.parse(queryEmbeddingData.embedding);

            // Get all user memories with embeddings
            const memories = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT * FROM memories 
                    WHERE user_id = ? AND embedding IS NOT NULL
                `;
                db.all(sql, [userId], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                });
            });

            // Calculate similarity for each memory
            const similarMemories = [];
            for (const memory of memories) {
                try {
                    const memoryEmbedding = JSON.parse(memory.embedding);
                    const similarity = this.cosineSimilarity(queryEmbedding, memoryEmbedding);

                    if (similarity >= threshold) {
                        similarMemories.push({
                            ...memory,
                            similarity: similarity
                        });
                    }
                } catch (e) {
                    // Skip memories with invalid embeddings
                    continue;
                }
            }

            // Sort by similarity
            similarMemories.sort((a, b) => b.similarity - a.similarity);

            return similarMemories;
        } catch (error) {
            console.error('[SemanticMemory] Error finding similar memories:', error.message);
            return [];
        }
    }

    /**
     * Check for duplicate or similar memories before creation
     * @param {number} userId - User ID
     * @param {string} content - Memory content
     * @param {string} category - Memory category
     * @returns {Promise<Object|null>} Duplicate/similar memory if exists
     */
    async checkForDuplicates(userId, content, category) {
        try {
            const similarMemories = await this.findSimilarMemories(userId, content, this.duplicateThreshold);

            if (similarMemories.length > 0) {
                return {
                    isDuplicate: true,
                    memory: similarMemories[0],
                    similarity: similarMemories[0].similarity,
                    action: 'skip' // or 'merge'
                };
            }

            // Also check for exact duplicates (case-insensitive)
            const exactDuplicate = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT * FROM memories
                    WHERE user_id = ? AND category = ? AND LOWER(content) = LOWER(?)
                    LIMIT 1
                `;
                db.get(sql, [userId, category, content.trim()], (err, row) => {
                    if (err) return reject(err);
                    resolve(row || null);
                });
            });

            if (exactDuplicate) {
                return {
                    isDuplicate: true,
                    memory: exactDuplicate,
                    similarity: 1.0,
                    action: 'skip'
                };
            }

            return null;
        } catch (error) {
            console.error('[SemanticMemory] Error checking duplicates:', error.message);
            return null;
        }
    }

    /**
     * Create memory with semantic embedding
     * @param {number} userId - User ID
     * @param {string} category - Memory category
     * @param {string} content - Memory content
     * @param {number} confidence - Confidence score
     * @param {string} source - Memory source
     * @returns {Promise<Object>} Created memory
     */
    async createMemory(userId, category, content, confidence = 1.0, source = 'manual') {
        const self = this; // Store reference to this

        return new Promise((resolve, reject) => {
            if (!userId || !category || !content) {
                return reject(new Error('User ID, category, and content are required.'));
            }

            const validCategories = ['identity', 'preferences', 'education', 'work', 'goals'];
            if (!validCategories.includes(category)) {
                return reject(new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`));
            }

            // Generate embedding
            self.generateEmbedding(content.trim())
                .then(embeddingData => {
                    const sql = `
                        INSERT INTO memories (user_id, category, content, confidence, source, embedding, embedding_model, embedding_updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    const embedding = embeddingData ? embeddingData.embedding : null;
                    const model = embeddingData ? embeddingData.model : null;
                    const updatedAt = embeddingData ? embeddingData.updatedAt : null;

                    db.run(sql, [userId, category, content.trim(), confidence, source, embedding, model, updatedAt], function (err) {
                        if (err) {
                            console.error('[SemanticMemory] Error creating memory:', err.message);
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

                        // Update TF-IDF corpus if using fallback
                        if (self.embeddingProvider && self.embeddingProvider.getName() === 'tfidf-fallback') {
                            self.embeddingProvider.updateCorpus([content.trim()]);
                        }

                        // Assign cluster
                        self.assignCluster(memoryId, userId, content.trim()).catch(() => { });

                        resolve(newMemory);
                    });
                })
                .catch(error => {
                    console.error('[SemanticMemory] Error in embedding generation:', error.message);
                    // Fallback: create memory without embedding
                    const sql = `
                        INSERT INTO memories (user_id, category, content, confidence, source)
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    db.run(sql, [userId, category, content.trim(), confidence, source], function (err) {
                        if (err) {
                            console.error('[SemanticMemory] Error creating memory:', err.message);
                            return reject(new Error('Failed to create memory.'));
                        }
                        resolve({
                            id: this.lastID,
                            user_id: userId,
                            category,
                            content: content.trim(),
                            confidence,
                            source,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });
                    });
                });
        });
    }

    /**
     * Update memory embedding
     * @param {number} memoryId - Memory ID
     * @param {string} content - New content
     * @returns {Promise<boolean>} Success status
     */
    async updateEmbedding(memoryId, content) {
        try {
            const embeddingData = await this.generateEmbedding(content);
            if (!embeddingData) {
                return false;
            }

            const sql = `
                UPDATE memories
                SET embedding = ?, embedding_model = ?, embedding_updated_at = ?
                WHERE id = ?
            `;

            await new Promise((resolve, reject) => {
                db.run(sql, [embeddingData.embedding, embeddingData.model, embeddingData.updatedAt, memoryId], function (err) {
                    if (err) return reject(err);
                    resolve();
                });
            });

            return true;
        } catch (error) {
            console.error('[SemanticMemory] Error updating embedding:', error.message);
            return false;
        }
    }

    /**
     * Assign memory to a cluster
     * @param {number} memoryId - Memory ID
     * @param {number} userId - User ID
     * @param {string} content - Memory content
     * @returns {Promise<number|null>} Cluster ID
     */
    async assignCluster(memoryId, userId, content) {
        try {
            const clusterName = this.detectCluster(content);
            if (!clusterName) {
                return null;
            }

            // Get or create cluster
            let clusterId = await new Promise((resolve, reject) => {
                const sql = `SELECT id FROM memory_clusters WHERE user_id = ? AND name = ?`;
                db.get(sql, [userId, clusterName], (err, row) => {
                    if (err) return reject(err);
                    resolve(row ? row.id : null);
                });
            });

            if (!clusterId) {
                clusterId = await new Promise((resolve, reject) => {
                    const sql = `INSERT INTO memory_clusters (user_id, name, description) VALUES (?, ?, ?)`;
                    db.run(sql, [userId, clusterName, `Auto-detected ${clusterName} cluster`], function (err) {
                        if (err) return reject(err);
                        resolve(this.lastID);
                    });
                });
            }

            // Assign memory to cluster
            await new Promise((resolve, reject) => {
                const sql = `UPDATE memories SET cluster_id = ? WHERE id = ?`;
                db.run(sql, [clusterId, memoryId], function (err) {
                    if (err) return reject(err);
                    resolve();
                });
            });

            return clusterId;
        } catch (error) {
            console.error('[SemanticMemory] Error assigning cluster:', error.message);
            return null;
        }
    }

    /**
     * Detect cluster for content based on keywords
     * @param {string} content - Memory content
     * @returns {string|null} Cluster name
     */
    detectCluster(content) {
        const contentLower = content.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;

        for (const [clusterName, keywords] of Object.entries(this.clusterDefinitions)) {
            let score = 0;
            keywords.forEach(keyword => {
                if (contentLower.includes(keyword)) {
                    score++;
                }
            });

            if (score > bestScore) {
                bestScore = score;
                bestMatch = clusterName;
            }
        }

        return bestMatch && bestScore > 0 ? bestMatch : null;
    }

    /**
     * Create relationship between memories
     * @param {number} userId - User ID
     * @param {number} sourceMemoryId - Source memory ID
     * @param {number} targetMemoryId - Target memory ID
     * @param {string} relationshipType - Type of relationship
     * @param {number} strength - Relationship strength (0-1)
     * @returns {Promise<Object>} Created relationship
     */
    async createRelationship(userId, sourceMemoryId, targetMemoryId, relationshipType, strength = 0.5) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT OR REPLACE INTO memory_relationships (user_id, source_memory_id, target_memory_id, relationship_type, strength)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.run(sql, [userId, sourceMemoryId, targetMemoryId, relationshipType, strength], function (err) {
                if (err) {
                    console.error('[SemanticMemory] Error creating relationship:', err.message);
                    return reject(new Error('Failed to create relationship.'));
                }

                resolve({
                    id: this.lastID,
                    user_id: userId,
                    source_memory_id: sourceMemoryId,
                    target_memory_id: targetMemoryId,
                    relationship_type: relationshipType,
                    strength: strength
                });
            });
        });
    }

    /**
     * Get related memories for a memory
     * @param {number} memoryId - Memory ID
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Related memories
     */
    async getRelatedMemories(memoryId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT m.*, r.relationship_type, r.strength
                FROM memories m
                INNER JOIN memory_relationships r ON m.id = r.target_memory_id
                WHERE r.source_memory_id = ? AND r.user_id = ?
                ORDER BY r.strength DESC
            `;

            db.all(sql, [memoryId, userId], (err, rows) => {
                if (err) {
                    console.error('[SemanticMemory] Error fetching related memories:', err.message);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    /**
     * Semantic search for memories
     * @param {number} userId - User ID
     * @param {string} query - Search query
     * @param {number} limit - Maximum results
     * @returns {Promise<Array>} Search results with hybrid ranking
     */
    async semanticSearch(userId, query, limit = 10) {
        try {
            // Generate embedding for query
            const queryEmbeddingData = await this.generateEmbedding(query);
            if (!queryEmbeddingData) {
                // Fallback to keyword search
                return this.keywordSearch(userId, query, limit);
            }

            const queryEmbedding = JSON.parse(queryEmbeddingData.embedding);

            // Get all user memories with embeddings
            const memories = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT * FROM memories 
                    WHERE user_id = ? AND embedding IS NOT NULL
                `;
                db.all(sql, [userId], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                });
            });

            if (memories.length === 0) {
                return [];
            }

            // Calculate hybrid scores
            const now = new Date();
            const rankedMemories = await Promise.all(
                memories.map(async (memory) => {
                    // Semantic similarity
                    let semanticScore = 0;
                    try {
                        const memoryEmbedding = JSON.parse(memory.embedding);
                        semanticScore = this.cosineSimilarity(queryEmbedding, memoryEmbedding);
                    } catch (e) {
                        semanticScore = 0;
                    }

                    // Get evolution-based scores
                    const importanceScore = memory.importance_score || 0.5;
                    const lastAccessed = new Date(memory.last_accessed_at);
                    const daysSinceAccess = (now - lastAccessed) / (1000 * 60 * 60 * 24);
                    const recencyScore = Math.exp(-daysSinceAccess / 7);
                    const frequencyScore = Math.min(memory.access_count / 10, 1.0);

                    // Hybrid ranking
                    const hybridScore =
                        (semanticScore * this.rankingWeights.semantic) +
                        (importanceScore * this.rankingWeights.importance) +
                        (recencyScore * this.rankingWeights.recency) +
                        (frequencyScore * this.rankingWeights.frequency);

                    return {
                        ...memory,
                        semantic_score: semanticScore,
                        hybrid_score: hybridScore
                    };
                })
            );

            // Sort by hybrid score
            rankedMemories.sort((a, b) => b.hybrid_score - a.hybrid_score);

            return rankedMemories.slice(0, limit);
        } catch (error) {
            console.error('[SemanticMemory] Error in semantic search:', error.message);
            return [];
        }
    }

    /**
     * Fallback keyword search
     * @private
     */
    async keywordSearch(userId, query, limit = 10) {
        return new Promise((resolve, reject) => {
            const searchTerm = `%${query}%`;
            const sql = `
                SELECT * FROM memories
                WHERE user_id = ? AND content LIKE ?
                ORDER BY importance_score DESC, updated_at DESC
                LIMIT ?
            `;

            db.all(sql, [userId, searchTerm, limit], (err, rows) => {
                if (err) {
                    console.error('[SemanticMemory] Error in keyword search:', err.message);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    /**
     * Get memory context for AI prompt injection (semantic version)
     * @param {number} userId - User ID
     * @param {string} query - Optional query for semantic relevance
     * @param {number} limit - Maximum memories to include
     * @returns {Promise<string>} Formatted context
     */
    async getSemanticMemoryContext(userId, query = null, limit = 10) {
        try {
            let memories;

            if (query) {
                memories = await this.semanticSearch(userId, query, limit);
            } else {
                memories = await memoryEvolutionService.getRankedMemories(userId, limit);
            }

            if (memories.length === 0) {
                return '';
            }

            // Group by category
            const grouped = {};
            memories.forEach(memory => {
                if (!grouped[memory.category]) {
                    grouped[memory.category] = [];
                }
                grouped[memory.category].push({
                    content: memory.content,
                    importance: memory.importance_score,
                    relevance: memory.hybrid_score || memory.relevance_score
                });
            });

            // Format for prompt
            let context = '\n\n[USER MEMORIES - Use these to personalize responses]\n';
            context += '[Memories are ranked by semantic relevance and importance]\n\n';

            for (const [category, items] of Object.entries(grouped)) {
                context += `\n${category.toUpperCase()}:\n`;
                items.forEach(item => {
                    context += `- ${item.content}\n`;
                });
            }

            context += '\n[END USER MEMORIES]\n';
            context += `[Injected ${memories.length} most relevant memories]\n`;

            return context;
        } catch (error) {
            console.error('[SemanticMemory] Error getting semantic memory context:', error.message);
            return '';
        }
    }

    /**
     * Batch update embeddings for existing memories
     * @param {number} userId - User ID
     * @param {number} batchSize - Batch size
     * @returns {Promise<Object>} Update results
     */
    async batchUpdateEmbeddings(userId, batchSize = 50) {
        try {
            const memories = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT * FROM memories 
                    WHERE user_id = ? AND embedding IS NULL
                    LIMIT ?
                `;
                db.all(sql, [userId, batchSize], (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                });
            });

            let updated = 0;
            for (const memory of memories) {
                const success = await this.updateEmbedding(memory.id, memory.content);
                if (success) updated++;
            }

            return {
                total: memories.length,
                updated: updated,
                message: `Updated embeddings for ${updated} out of ${memories.length} memories.`
            };
        } catch (error) {
            console.error('[SemanticMemory] Error batch updating embeddings:', error.message);
            throw error;
        }
    }

    /**
     * Get cluster information for memories
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Cluster data with memories
     */
    async getClusters(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    c.id as cluster_id,
                    c.name as cluster_name,
                    c.description as cluster_description,
                    COUNT(m.id) as memory_count,
                    GROUP_CONCAT(m.id) as memory_ids
                FROM memory_clusters c
                LEFT JOIN memories m ON c.id = m.cluster_id AND m.user_id = ?
                WHERE c.user_id = ?
                GROUP BY c.id
                ORDER BY memory_count DESC
            `;

            db.all(sql, [userId, userId], (err, rows) => {
                if (err) {
                    console.error('[SemanticMemory] Error fetching clusters:', err.message);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }
}

module.exports = new SemanticMemoryService();