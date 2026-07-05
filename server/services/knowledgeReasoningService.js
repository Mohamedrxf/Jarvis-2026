const db = require('../config/db');
const knowledgeGraphService = require('./knowledgeGraphService');
const semanticMemoryService = require('./semanticMemoryService');
const memoryEvolutionService = require('./memoryEvolutionService');
const memoryIntelligenceService = require('./memoryIntelligenceService');

class KnowledgeReasoningService {
    constructor() {
        // Maximum context window for reasoning
        this.maxContextMemories = 15;

        // Relevance thresholds
        this.relevanceThresholds = {
            high: 0.8,
            medium: 0.6,
            low: 0.4
        };

        // Weights for relevance scoring
        this.relevanceWeights = {
            semantic: 0.35,
            graph: 0.35,
            importance: 0.2,
            recency: 0.1
        };
    }

    /**
     * Get reasoning context for a memory
     * @param {number} memoryId - Starting memory ID
     * @param {Object} options - Options for context building
     * @returns {Promise<Object>} Reasoning context
     */
    async getReasoningContext(memoryId, options = {}) {
        try {
            const {
                maxDepth = 2,
                maxMemories = 10,
                includeSemantic = true,
                includeGraph = true,
                query = null
            } = options;

            if (!memoryId) {
                throw new Error('Memory ID is required.');
            }

            // Get the starting memory
            const startMemory = await this.getMemory(memoryId);
            if (!startMemory) {
                throw new Error('Memory not found.');
            }

            // Initialize context
            const context = {
                memory_id: memoryId,
                memory: startMemory,
                connected_memories: [],
                semantic_memories: [],
                context_summary: '',
                relevance_scores: [],
                total_memories_considered: 0
            };

            // Get graph-connected memories
            if (includeGraph) {
                try {
                    const graphContext = await knowledgeGraphService.buildContextSummary(
                        memoryId,
                        maxDepth,
                        maxMemories
                    );

                    context.connected_memories = graphContext.sections.flatMap(section =>
                        section.memories.map(m => ({
                            ...m,
                            source: 'graph',
                            relation_type: section.relation_type
                        }))
                    );
                } catch (err) {
                    console.warn('[KnowledgeReasoning] Could not get graph context:', err.message);
                }
            }

            // Get semantically similar memories
            if (includeSemantic) {
                try {
                    const semanticMemories = await semanticMemoryService.findSimilarMemories(
                        startMemory.user_id,
                        startMemory.content,
                        0.5 // Lower threshold for broader context
                    );

                    context.semantic_memories = semanticMemories
                        .filter(m => m.id !== memoryId)
                        .slice(0, maxMemories)
                        .map(m => ({
                            id: m.id,
                            content: m.content,
                            category: m.category,
                            similarity: m.similarity,
                            source: 'semantic'
                        }));
                } catch (err) {
                    console.warn('[KnowledgeReasoning] Could not get semantic context:', err.message);
                }
            }

            // Combine and score memories
            const combinedMemories = this.combineAndScoreMemories(
                context.connected_memories,
                context.semantic_memories,
                startMemory
            );

            context.total_memories_considered = combinedMemories.length;
            context.relevance_scores = combinedMemories.slice(0, maxMemories);

            // Generate context summary
            context.context_summary = this.generateContextSummary(startMemory, context.relevance_scores);

            return context;
        } catch (error) {
            console.error('[KnowledgeReasoning] Error in getReasoningContext:', error.message);
            throw error;
        }
    }

    /**
     * Get memory by ID
     * @private
     */
    async getMemory(memoryId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM memories WHERE id = ?`;
            db.get(sql, [memoryId], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    }

    /**
     * Combine and score memories from different sources
     * @private
     */
    combineAndScoreMemories(graphMemories, semanticMemories, startMemory) {
        const memoryMap = new Map();
        const now = new Date();

        // Add graph memories
        for (const mem of graphMemories) {
            const existing = memoryMap.get(mem.id);
            if (existing) {
                // Boost score if found in both sources
                existing.score *= 1.2;
                existing.sources.push('graph');
            } else {
                memoryMap.set(mem.id, {
                    ...mem,
                    score: this.calculateRelevanceScore(mem, startMemory, now, 'graph'),
                    sources: ['graph']
                });
            }
        }

        // Add semantic memories
        for (const mem of semanticMemories) {
            const existing = memoryMap.get(mem.id);
            if (existing) {
                // Boost score if found in both sources
                existing.score *= 1.2;
                existing.sources.push('semantic');
            } else {
                memoryMap.set(mem.id, {
                    ...mem,
                    score: this.calculateRelevanceScore(mem, startMemory, now, 'semantic'),
                    sources: ['semantic']
                });
            }
        }

        // Convert to array and sort by score
        return Array.from(memoryMap.values())
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Calculate relevance score for a memory
     * @private
     */
    calculateRelevanceScore(memory, startMemory, now, source) {
        let score = 0;

        // Semantic/graph similarity (already normalized 0-1)
        const similarityScore = source === 'semantic'
            ? (memory.similarity || 0)
            : (memory.confidence || 0);
        score += similarityScore * this.relevanceWeights.semantic;

        // Importance score
        const importanceScore = memory.importance_score || 0.5;
        score += importanceScore * this.relevanceWeights.importance;

        // Recency score
        const lastAccessed = new Date(memory.last_accessed_at || memory.created_at);
        const daysSinceAccess = (now - lastAccessed) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.exp(-daysSinceAccess / 7);
        score += recencyScore * this.relevanceWeights.recency;

        // Graph connectivity bonus
        if (source === 'graph' && memory.relationships) {
            const connectivityBonus = Math.min(memory.relationships.length / 3, 1.0) * 0.1;
            score += connectivityBonus;
        }

        return Math.min(score, 1.0);
    }

    /**
     * Generate concise context summary
     * @private
     */
    generateContextSummary(startMemory, relevantMemories) {
        if (relevantMemories.length === 0) {
            return `Memory: "${startMemory.content}"\nNo connected memories found.`;
        }

        let summary = `[REASONING CONTEXT]\n`;
        summary += `Primary Memory: "${startMemory.content}"\n`;
        summary += `Category: ${startMemory.category}\n\n`;
        summary += `Related Context (${relevantMemories.length} memories):\n`;

        // Group by relevance level
        const high = relevantMemories.filter(m => m.score >= this.relevanceThresholds.high);
        const medium = relevantMemories.filter(m => m.score >= this.relevanceThresholds.medium && m.score < this.relevanceThresholds.high);
        const low = relevantMemories.filter(m => m.score < this.relevanceThresholds.medium);

        if (high.length > 0) {
            summary += `\n[High Relevance]\n`;
            high.forEach(m => {
                summary += `- ${m.content} (${(m.score * 100).toFixed(0)}%)\n`;
            });
        }

        if (medium.length > 0) {
            summary += `\n[Medium Relevance]\n`;
            medium.forEach(m => {
                summary += `- ${m.content} (${(m.score * 100).toFixed(0)}%)\n`;
            });
        }

        if (low.length > 0) {
            summary += `\n[Low Relevance]\n`;
            low.forEach(m => {
                summary += `- ${m.content} (${(m.score * 100).toFixed(0)}%)\n`;
            });
        }

        summary += `\n[END REASONING CONTEXT]\n`;
        summary += `[Use this context to provide personalized, context-aware responses]\n`;

        return summary;
    }

    /**
     * Get enriched prompt context combining semantic and graph context
     * @param {number} userId - User ID
     * @param {string} query - Current query (optional)
     * @param {number} memoryId - Specific memory ID to reason about (optional)
     * @returns {Promise<string>} Enriched context for prompt injection
     */
    async getEnrichedPromptContext(userId, query = null, memoryId = null) {
        try {
            let contextParts = [];

            // If specific memory ID provided, get reasoning context
            if (memoryId) {
                try {
                    const reasoningContext = await this.getReasoningContext(memoryId, {
                        maxDepth: 2,
                        maxMemories: 10,
                        query: query
                    });

                    if (reasoningContext.context_summary) {
                        contextParts.push(reasoningContext.context_summary);
                    }
                } catch (err) {
                    console.warn('[KnowledgeReasoning] Could not get reasoning context:', err.message);
                }
            }

            // Get general semantic memory context
            try {
                const semanticContext = await semanticMemoryService.getSemanticMemoryContext(userId, query, 10);
                if (semanticContext) {
                    contextParts.push(semanticContext);
                }
            } catch (err) {
                console.warn('[KnowledgeReasoning] Could not get semantic context:', err.message);
            }

            // Combine contexts
            if (contextParts.length === 0) {
                return '';
            }

            return contextParts.join('\n\n');
        } catch (error) {
            console.error('[KnowledgeReasoning] Error getting enriched prompt context:', error.message);
            return '';
        }
    }

    /**
     * Get connected memories count for a memory
     * @param {number} memoryId - Memory ID
     * @param {number} maxDepth - Maximum traversal depth
     * @returns {Promise<Object>} Connection info
     */
    async getConnectedMemoriesCount(memoryId, maxDepth = 2) {
        try {
            const result = await knowledgeGraphService.getConnectedMemories(memoryId, maxDepth);
            return {
                count: result.total_count,
                max_depth: result.max_depth_reached,
                nodes_visited: result.traversal_stats.nodes_visited
            };
        } catch (error) {
            console.error('[KnowledgeReasoning] Error getting connected memories count:', error.message);
            return {
                count: 0,
                max_depth: 0,
                nodes_visited: 0
            };
        }
    }

    /**
     * Get context preview for a memory
     * @param {number} memoryId - Memory ID
     * @param {number} maxLength - Maximum preview length
     * @returns {Promise<Object>} Context preview
     */
    async getContextPreview(memoryId, maxLength = 500) {
        try {
            const summary = await knowledgeGraphService.buildContextSummary(memoryId, 2, 5);

            let preview = summary.text_summary;
            if (preview.length > maxLength) {
                preview = preview.substring(0, maxLength) + '...';
            }

            return {
                preview: preview,
                full_summary: summary.text_summary,
                connected_count: summary.connected_count,
                sections_count: summary.sections.length
            };
        } catch (error) {
            console.error('[KnowledgeReasoning] Error getting context preview:', error.message);
            return {
                preview: '',
                full_summary: '',
                connected_count: 0,
                sections_count: 0
            };
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
            console.error('[KnowledgeReasoning] Error getting intelligence report:', error.message);
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
            console.error('[KnowledgeReasoning] Error detecting conflicts:', error.message);
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
            console.error('[KnowledgeReasoning] Error detecting duplicates:', error.message);
            return [];
        }
    }
}

module.exports = new KnowledgeReasoningService();