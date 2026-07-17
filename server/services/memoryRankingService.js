/**
 * Memory Ranking Service - Phase 11.4
 * 
 * Centralized service for ranking memories by relevance to user queries.
 * Implements weighted scoring using multiple factors to select the most relevant memories.
 * 
 * Responsibilities:
 * - Receive user query and retrieved memories
 * - Calculate relevance scores using multiple factors
 * - Return top-ranked memories only
 * - Reduce prompt size by selecting only relevant memories
 * 
 * Ranking Factors (with weights):
 * 1. Semantic similarity (weight: 0.35) - highest priority
 * 2. Keyword overlap (weight: 0.20)
 * 3. Memory importance score (weight: 0.15)
 * 4. Memory confidence (weight: 0.10)
 * 5. Access frequency (weight: 0.10)
 * 6. Recency (weight: 0.05)
 * 7. Category relevance (weight: 0.05)
 */

const { EmbeddingProviderFactory } = require('./embeddingProvider');

class MemoryRankingService {
    /**
     * Initialize memory ranking service
     */
    constructor() {
        try {
            this.embeddingProvider = EmbeddingProviderFactory.create();
        } catch (error) {
            console.error('[MemoryRanking] Error creating embedding provider:', error.message);
            this.embeddingProvider = null;
        }

        // Configuration
        this.config = {
            // Ranking weights (must sum to 1.0)
            weights: {
                semantic: 0.35,        // Semantic similarity (highest weight)
                keyword: 0.20,         // Keyword overlap
                importance: 0.15,      // Memory importance score
                confidence: 0.10,      // Memory confidence
                frequency: 0.10,       // Access frequency
                recency: 0.05,         // Recency
                category: 0.05         // Category relevance
            },

            // Limits
            topMemoriesDefault: 5,    // Default number of top memories to return
            maxMemoriesToConsider: 20, // Maximum memories to evaluate (performance)

            // Thresholds
            minScoreThreshold: 0.1,   // Minimum score to include memory

            // Category relevance boost
            categoryBoost: {
                'identity': 1.2,      // Identity memories are highly relevant
                'preferences': 1.1,   // Preferences are important
                'work': 1.0,
                'education': 1.0,
                'goals': 1.0
            }
        };
    }

    /**
     * Rank memories by relevance to user query
     * @param {string} query - User query
     * @param {Array} memories - Array of memory objects
     * @param {number} limit - Maximum number of memories to return (optional, uses default if not provided)
     * @returns {Promise<Array>} Top-ranked memories with scores
     */
    async rankMemories(query, memories, limit = null) {
        try {
            if (!query || !memories || memories.length === 0) {
                return [];
            }

            const topLimit = limit || this.config.topMemoriesDefault;

            // Limit memories to consider for performance
            const memoriesToConsider = memories.slice(0, this.config.maxMemoriesToConsider);

            // Generate query embedding for semantic similarity
            const queryEmbedding = await this.getQueryEmbedding(query);

            // Calculate scores for each memory
            const scoredMemories = await Promise.all(
                memoriesToConsider.map(async (memory) => {
                    const scores = await this.calculateRelevanceScore(query, memory, queryEmbedding);
                    return {
                        ...memory,
                        relevance_score: scores.total,
                        score_breakdown: scores
                    };
                })
            );

            // Filter by minimum threshold
            const filteredMemories = scoredMemories.filter(
                memory => memory.relevance_score >= this.config.minScoreThreshold
            );

            // Sort by relevance score (descending)
            filteredMemories.sort((a, b) => b.relevance_score - a.relevance_score);

            // Return top memories
            return filteredMemories.slice(0, topLimit);

        } catch (error) {
            console.error('[MemoryRanking] Error ranking memories:', error.message);
            // Fallback: return memories sorted by importance
            return this.fallbackRanking(memories, limit || this.config.topMemoriesDefault);
        }
    }

    /**
     * Calculate relevance score for a memory
     * @private
     */
    async calculateRelevanceScore(query, memory, queryEmbedding) {
        try {
            const weights = this.config.weights;

            // 1. Semantic similarity (0-1)
            const semanticScore = await this.calculateSemanticSimilarity(queryEmbedding, memory);

            // 2. Keyword overlap (0-1)
            const keywordScore = this.calculateKeywordOverlap(query, memory.content);

            // 3. Memory importance (0-1)
            const importanceScore = memory.importance_score || 0.5;

            // 4. Memory confidence (0-1)
            const confidenceScore = memory.confidence || 0.5;

            // 5. Access frequency (0-1)
            const frequencyScore = this.calculateFrequencyScore(memory);

            // 6. Recency (0-1)
            const recencyScore = this.calculateRecencyScore(memory);

            // 7. Category relevance (0-1, with boost)
            const categoryScore = this.calculateCategoryRelevance(memory);

            // Calculate weighted total
            const total =
                (semanticScore * weights.semantic) +
                (keywordScore * weights.keyword) +
                (importanceScore * weights.importance) +
                (confidenceScore * weights.confidence) +
                (frequencyScore * weights.frequency) +
                (recencyScore * weights.recency) +
                (categoryScore * weights.category);

            return {
                semantic: semanticScore,
                keyword: keywordScore,
                importance: importanceScore,
                confidence: confidenceScore,
                frequency: frequencyScore,
                recency: recencyScore,
                category: categoryScore,
                total: Math.min(total, 1.0) // Cap at 1.0
            };

        } catch (error) {
            console.error('[MemoryRanking] Error calculating relevance score:', error.message);
            return {
                semantic: 0,
                keyword: 0,
                importance: memory.importance_score || 0.5,
                confidence: memory.confidence || 0.5,
                frequency: 0,
                recency: 0,
                category: 0,
                total: 0.5
            };
        }
    }

    /**
     * Calculate semantic similarity between query and memory
     * @private
     */
    async calculateSemanticSimilarity(queryEmbedding, memory) {
        try {
            if (!queryEmbedding || !memory.embedding) {
                return 0;
            }

            const memoryEmbedding = JSON.parse(memory.embedding);
            return this.cosineSimilarity(queryEmbedding, memoryEmbedding);

        } catch (error) {
            return 0;
        }
    }

    /**
     * Calculate keyword overlap between query and memory content
     * @private
     */
    calculateKeywordOverlap(query, content) {
        try {
            // Tokenize and normalize
            const queryWords = this.tokenize(query);
            const contentWords = this.tokenize(content);

            if (queryWords.length === 0 || contentWords.length === 0) {
                return 0;
            }

            // Calculate Jaccard similarity
            const querySet = new Set(queryWords);
            const contentSet = new Set(contentWords);

            const intersection = new Set([...querySet].filter(word => contentSet.has(word)));
            const union = new Set([...querySet, ...contentSet]);

            const jaccardScore = intersection.size / union.size;

            // Boost for exact phrase matches
            const exactMatchBoost = content.toLowerCase().includes(query.toLowerCase()) ? 0.2 : 0;

            return Math.min(jaccardScore + exactMatchBoost, 1.0);

        } catch (error) {
            return 0;
        }
    }

    /**
     * Calculate frequency score based on access count
     * @private
     */
    calculateFrequencyScore(memory) {
        try {
            const accessCount = memory.access_count || 0;
            // Logarithmic scale: 1 access = 0.2, 10 accesses = 0.5, 100 accesses = 0.8
            return Math.min(Math.log10(accessCount + 1) / 2, 1.0);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Calculate recency score based on last access
     * @private
     */
    calculateRecencyScore(memory) {
        try {
            const lastAccessed = new Date(memory.last_accessed_at || memory.updated_at);
            const now = new Date();
            const daysSinceAccess = (now - lastAccessed) / (1000 * 60 * 60 * 24);

            // Exponential decay: 1.0 for today, 0.5 after 7 days, ~0.1 after 30 days
            return Math.exp(-daysSinceAccess / 7);

        } catch (error) {
            return 0;
        }
    }

    /**
     * Calculate category relevance with boost
     * @private
     */
    calculateCategoryRelevance(memory) {
        try {
            const category = memory.category || 'general';
            const boost = this.config.categoryBoost[category] || 1.0;
            return Math.min(boost, 1.2) / 1.2; // Normalize to 0-1
        } catch (error) {
            return 0.5;
        }
    }

    /**
     * Get query embedding
     * @private
     */
    async getQueryEmbedding(query) {
        try {
            if (!this.embeddingProvider) {
                return null;
            }

            const embeddingData = await this.embeddingProvider.generateEmbedding(query);
            if (!embeddingData) {
                return null;
            }

            return JSON.parse(embeddingData.embedding);

        } catch (error) {
            console.error('[MemoryRanking] Error generating query embedding:', error.message);
            return null;
        }
    }

    /**
     * Tokenize text for keyword matching
     * @private
     */
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2); // Ignore short words
    }

    /**
     * Calculate cosine similarity between two vectors
     * @private
     */
    cosineSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) {
            return 0;
        }

        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            magnitude1 += vec1[i] * vec1[i];
            magnitude2 += vec2[i] * vec2[i];
        }

        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);

        if (magnitude1 === 0 || magnitude2 === 0) {
            return 0;
        }

        return dotProduct / (magnitude1 * magnitude2);
    }

    /**
     * Fallback ranking when semantic search fails
     * @private
     */
    fallbackRanking(memories, limit) {
        try {
            // Sort by importance and recency
            const sorted = memories
                .map(memory => ({
                    ...memory,
                    relevance_score: (memory.importance_score || 0.5) * 0.7 +
                        (memory.confidence || 0.5) * 0.3
                }))
                .sort((a, b) => b.relevance_score - a.relevance_score);

            return sorted.slice(0, limit);

        } catch (error) {
            console.error('[MemoryRanking] Error in fallback ranking:', error.message);
            return memories.slice(0, limit);
        }
    }

    /**
     * Get ranking statistics
     * @param {Array} memories - Memories that were ranked
     * @param {Array} rankedMemories - Top-ranked memories
     * @returns {Object} Ranking statistics
     */
    getRankingStats(memories, rankedMemories) {
        return {
            totalMemories: memories.length,
            memoriesConsidered: Math.min(memories.length, this.config.maxMemoriesToConsider),
            memoriesReturned: rankedMemories.length,
            avgScore: rankedMemories.length > 0
                ? rankedMemories.reduce((sum, m) => sum + m.relevance_score, 0) / rankedMemories.length
                : 0,
            topScore: rankedMemories.length > 0 ? rankedMemories[0].relevance_score : 0,
            minScore: rankedMemories.length > 0 ? rankedMemories[rankedMemories.length - 1].relevance_score : 0,
            config: {
                topMemoriesDefault: this.config.topMemoriesDefault,
                weights: this.config.weights
            }
        };
    }

    /**
     * Update configuration
     * @param {Object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
        if (newConfig.weights) {
            this.config.weights = { ...this.config.weights, ...newConfig.weights };
        }
        if (newConfig.topMemoriesDefault) {
            this.config.topMemoriesDefault = newConfig.topMemoriesDefault;
        }
        if (newConfig.maxMemoriesToConsider) {
            this.config.maxMemoriesToConsider = newConfig.maxMemoriesToConsider;
        }
        if (newConfig.minScoreThreshold) {
            this.config.minScoreThreshold = newConfig.minScoreThreshold;
        }
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}

// Export singleton instance
const memoryRankingService = new MemoryRankingService();

module.exports = memoryRankingService;
