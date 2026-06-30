const db = require('../config/db');
const semanticMemoryService = require('./semanticMemoryService');
const knowledgeGraphService = require('./knowledgeGraphService');
const knowledgeReasoningService = require('./knowledgeReasoningService');

class MemoryIntelligenceService {
    constructor() {
        // Thresholds for conflict detection
        this.conflictThresholds = {
            semantic: 0.75,        // Semantic similarity for potential conflicts
            exact: 0.95,           // Near-exact match for duplicates
            confidence: 0.6        // Minimum confidence to consider
        };

        // Categories that can have conflicting values
        this.conflictProneCategories = ['preferences', 'identity', 'work', 'education'];

        // Keywords that indicate preference/identity claims
        this.conflictIndicators = {
            preferences: ['favorite', 'prefer', 'like', 'love', 'hate', 'dislike', 'best', 'worst'],
            identity: ['name', 'age', 'gender', 'nationality', 'religion', 'political'],
            work: ['job', 'position', 'company', 'title', 'role', 'occupation'],
            education: ['degree', 'major', 'university', 'college', 'school', 'studied']
        };
    }

    /**
     * Get comprehensive memory intelligence report for a user
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Intelligence report with conflicts, duplicates, and suggestions
     */
    async getMemoryIntelligenceReport(userId) {
        try {
            const report = {
                userId: userId,
                generatedAt: new Date().toISOString(),
                conflicts: [],
                duplicates: [],
                consistencyIssues: [],
                suggestions: [],
                summary: {
                    totalConflicts: 0,
                    totalDuplicates: 0,
                    totalIssues: 0,
                    healthScore: 100
                }
            };

            // Run all analyses in parallel
            const [conflicts, duplicates, consistencyIssues] = await Promise.all([
                this.detectMemoryConflicts(userId),
                this.detectDuplicateClusters(userId),
                this.validateMemoryConsistency(userId)
            ]);

            report.conflicts = conflicts;
            report.duplicates = duplicates;
            report.consistencyIssues = consistencyIssues;

            // Generate suggestions
            report.suggestions = this.generateSuggestions(conflicts, duplicates, consistencyIssues);

            // Calculate summary
            report.summary.totalConflicts = conflicts.length;
            report.summary.totalDuplicates = duplicates.length;
            report.summary.totalIssues = consistencyIssues.length;
            report.summary.healthScore = this.calculateHealthScore(report);

            return report;
        } catch (error) {
            console.error('[MemoryIntelligence] Error generating report:', error.message);
            throw error;
        }
    }

    /**
     * Detect conflicting memories (contradictory facts)
     * @param {number} userId - User ID
     * @returns {Promise<Array>} List of conflicts
     */
    async detectMemoryConflicts(userId) {
        try {
            const conflicts = [];
            const memories = await this.getMemoriesByCategories(userId, this.conflictProneCategories);

            // Group memories by category
            const byCategory = {};
            memories.forEach(memory => {
                if (!byCategory[memory.category]) {
                    byCategory[memory.category] = [];
                }
                byCategory[memory.category].push(memory);
            });

            // Check each category for conflicts
            for (const [category, categoryMemories] of Object.entries(byCategory)) {
                const categoryConflicts = await this.findConflictsInCategory(categoryMemories, category);
                conflicts.push(...categoryConflicts);
            }

            return conflicts;
        } catch (error) {
            console.error('[MemoryIntelligence] Error detecting conflicts:', error.message);
            return [];
        }
    }

    /**
     * Find conflicts within a category
     * @private
     */
    async findConflictsInCategory(memories, category) {
        const conflicts = [];
        const indicators = this.conflictIndicators[category] || [];

        // Only check memories that have conflict indicators
        const relevantMemories = memories.filter(memory => {
            const contentLower = memory.content.toLowerCase();
            return indicators.some(indicator => contentLower.includes(indicator));
        });

        // Compare pairs for conflicts
        for (let i = 0; i < relevantMemories.length; i++) {
            for (let j = i + 1; j < relevantMemories.length; j++) {
                const memory1 = relevantMemories[i];
                const memory2 = relevantMemories[j];

                const conflict = this.checkForConflict(memory1, memory2, category);
                if (conflict) {
                    conflicts.push(conflict);
                }
            }
        }

        return conflicts;
    }

    /**
     * Check if two memories conflict
     * @private
     */
    checkForConflict(memory1, memory2, category) {
        const content1 = memory1.content.toLowerCase();
        const content2 = memory2.content.toLowerCase();

        // Calculate semantic similarity
        const similarity = this.calculateTextSimilarity(content1, content2);

        // High similarity but different content = potential conflict
        if (similarity >= this.conflictThresholds.semantic && similarity < 0.95) {
            // Check if they're about the same attribute
            const commonAttributes = this.findCommonAttributes(content1, content2);

            if (commonAttributes.length > 0) {
                return {
                    type: 'contradictory_fact',
                    category: category,
                    memory1: {
                        id: memory1.id,
                        content: memory1.content,
                        confidence: memory1.confidence,
                        created_at: memory1.created_at
                    },
                    memory2: {
                        id: memory2.id,
                        content: memory2.content,
                        confidence: memory2.confidence,
                        created_at: memory2.created_at
                    },
                    conflictingAttributes: commonAttributes,
                    similarity: similarity,
                    severity: this.calculateConflictSeverity(memory1, memory2),
                    suggestedResolution: this.suggestResolution(memory1, memory2),
                    recommendation: this.getRecommendation(memory1, memory2)
                };
            }
        }

        return null;
    }

    /**
     * Find common attributes between two memory contents
     * @private
     */
    findCommonAttributes(content1, content2) {
        const attributes = [];

        // Extract key-value patterns
        const patterns = [
            /favorite\s+(\w+)\s+is\s+(\w+)/gi,
            /prefer\s+(\w+)/gi,
            /like\s+(\w+)/gi,
            /love\s+(\w+)/gi,
            /hate\s+(\w+)/gi,
            /job\s+is\s+(\w+)/gi,
            /work\s+at\s+(\w+)/gi,
            /company\s+is\s+(\w+)/gi,
            /studied\s+(\w+)/gi,
            /major\s+is\s+(\w+)/gi
        ];

        const attrs1 = this.extractAttributes(content1, patterns);
        const attrs2 = this.extractAttributes(content2, patterns);

        // Find common attribute names with different values
        attrs1.forEach(attr1 => {
            const match = attrs2.find(attr2 => attr2.name === attr1.name && attr2.value !== attr1.value);
            if (match) {
                attributes.push({
                    name: attr1.name,
                    value1: attr1.value,
                    value2: match.value
                });
            }
        });

        return attributes;
    }

    /**
     * Extract attributes from content
     * @private
     */
    extractAttributes(content, patterns) {
        const attributes = [];

        patterns.forEach(pattern => {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    attributes.push({
                        name: match[1].toLowerCase(),
                        value: match[2] ? match[2].toLowerCase() : match[1].toLowerCase()
                    });
                }
            }
        });

        return attributes;
    }

    /**
     * Calculate conflict severity
     * @private
     */
    calculateConflictSeverity(memory1, memory2) {
        const confidenceDiff = Math.abs(memory1.confidence - memory2.confidence);
        const avgConfidence = (memory1.confidence + memory2.confidence) / 2;

        if (avgConfidence >= 0.8 && confidenceDiff < 0.2) {
            return 'high';
        } else if (avgConfidence >= 0.6) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Suggest resolution for conflict
     * @private
     */
    suggestResolution(memory1, memory2) {
        // Prefer the more recent memory
        const date1 = new Date(memory1.created_at);
        const date2 = new Date(memory2.created_at);

        if (date1 > date2) {
            return `Keep "${memory1.content}" (more recent) and remove "${memory2.content}"`;
        } else if (date2 > date1) {
            return `Keep "${memory2.content}" (more recent) and remove "${memory1.content}"`;
        } else {
            // Same date, prefer higher confidence
            if (memory1.confidence > memory2.confidence) {
                return `Keep "${memory1.content}" (higher confidence) and remove "${memory2.content}"`;
            } else if (memory2.confidence > memory1.confidence) {
                return `Keep "${memory2.content}" (higher confidence) and remove "${memory1.content}"`;
            } else {
                return 'Manual review required - both memories have equal priority';
            }
        }
    }

    /**
     * Get recommendation for conflict
     * @private
     */
    getRecommendation(memory1, memory2) {
        const newerMemory = new Date(memory1.created_at) > new Date(memory2.created_at) ? memory1 : memory2;
        const olderMemory = newerMemory === memory1 ? memory2 : memory1;

        return {
            primaryMemory: {
                id: newerMemory.id,
                content: newerMemory.content,
                reason: 'More recent'
            },
            secondaryMemory: {
                id: olderMemory.id,
                content: olderMemory.content,
                action: 'remove'
            },
            confidence: Math.max(memory1.confidence, memory2.confidence)
        };
    }

    /**
     * Detect duplicate or near-duplicate memories
     * @param {number} userId - User ID
     * @returns {Promise<Array>} List of duplicate clusters
     */
    async detectDuplicateClusters(userId) {
        try {
            const duplicates = [];
            const memories = await this.getAllUserMemories(userId);

            // Calculate similarity matrix
            const similarityMatrix = await this.calculateSimilarityMatrix(memories);

            // Find clusters of similar memories
            const clusters = this.findSimilarityClusters(memories, similarityMatrix);

            // Convert clusters to duplicate groups
            for (const cluster of clusters) {
                if (cluster.length >= 2) {
                    const duplicateGroup = this.createDuplicateGroup(cluster);
                    duplicates.push(duplicateGroup);
                }
            }

            return duplicates;
        } catch (error) {
            console.error('[MemoryIntelligence] Error detecting duplicates:', error.message);
            return [];
        }
    }

    /**
     * Calculate similarity matrix for memories
     * @private
     */
    async calculateSimilarityMatrix(memories) {
        const matrix = {};

        for (let i = 0; i < memories.length; i++) {
            const memoryId = memories[i].id;
            if (!memoryId) continue;

            matrix[memoryId] = {};

            for (let j = i + 1; j < memories.length; j++) {
                const otherId = memories[j].id;
                if (!otherId) continue;

                const similarity = this.calculateTextSimilarity(
                    memories[i].content.toLowerCase(),
                    memories[j].content.toLowerCase()
                );

                matrix[memoryId][otherId] = similarity;
                matrix[otherId] = matrix[otherId] || {};
                matrix[otherId][memoryId] = similarity;
            }
        }

        return matrix;
    }

    /**
     * Find clusters of similar memories
     * @private
     */
    findSimilarityClusters(memories, similarityMatrix) {
        const clusters = [];
        const visited = new Set();

        for (const memory of memories) {
            if (visited.has(memory.id)) continue;

            const cluster = [memory];
            visited.add(memory.id);

            // Find all memories similar to this one
            for (const otherMemory of memories) {
                if (visited.has(otherMemory.id)) continue;

                const similarity = similarityMatrix[memory.id]?.[otherMemory.id] || 0;

                if (similarity >= this.conflictThresholds.exact) {
                    cluster.push(otherMemory);
                    visited.add(otherMemory.id);
                }
            }

            if (cluster.length >= 2) {
                clusters.push(cluster);
            }
        }

        return clusters;
    }

    /**
     * Create duplicate group from cluster
     * @private
     */
    createDuplicateGroup(cluster) {
        // Sort by confidence (descending) then by date (newest first)
        const sorted = cluster.sort((a, b) => {
            if (b.confidence !== a.confidence) {
                return b.confidence - a.confidence;
            }
            return new Date(b.created_at) - new Date(a.created_at);
        });

        const primary = sorted[0];
        const duplicates = sorted.slice(1);

        return {
            type: 'duplicate_cluster',
            category: primary.category,
            primaryMemory: {
                id: primary.id,
                content: primary.content,
                confidence: primary.confidence,
                created_at: primary.created_at
            },
            duplicates: duplicates.map(m => ({
                id: m.id,
                content: m.content,
                confidence: m.confidence,
                created_at: m.created_at,
                similarity: this.calculateTextSimilarity(primary.content.toLowerCase(), m.content.toLowerCase())
            })),
            recommendation: {
                action: 'keep_primary',
                primaryId: primary.id,
                removeIds: duplicates.map(m => m.id),
                reason: 'Primary memory has highest confidence/recency'
            },
            confidence: primary.confidence
        };
    }

    /**
     * Validate memory consistency across layers
     * @param {number} userId - User ID
     * @returns {Promise<Array>} List of consistency issues
     */
    async validateMemoryConsistency(userId) {
        try {
            const issues = [];

            // Check semantic layer consistency
            const semanticIssues = await this.checkSemanticConsistency(userId);
            issues.push(...semanticIssues);

            // Check knowledge graph consistency
            const graphIssues = await this.checkGraphConsistency(userId);
            issues.push(...graphIssues);

            // Check reasoning layer consistency
            const reasoningIssues = await this.checkReasoningConsistency(userId);
            issues.push(...reasoningIssues);

            return issues;
        } catch (error) {
            console.error('[MemoryIntelligence] Error validating consistency:', error.message);
            return [];
        }
    }

    /**
     * Check semantic layer consistency
     * @private
     */
    async checkSemanticConsistency(userId) {
        const issues = [];

        try {
            const memories = await this.getAllUserMemories(userId);

            // Check for memories without embeddings
            const withoutEmbeddings = memories.filter(m => !m.embedding);
            if (withoutEmbeddings.length > 0) {
                issues.push({
                    type: 'missing_embeddings',
                    layer: 'semantic',
                    severity: 'low',
                    count: withoutEmbeddings.length,
                    message: `${withoutEmbeddings.length} memories missing embeddings`,
                    suggestion: 'Run batch embedding update'
                });
            }
        } catch (error) {
            console.error('[MemoryIntelligence] Error checking semantic consistency:', error.message);
        }

        return issues;
    }

    /**
     * Check knowledge graph consistency
     * @private
     */
    async checkGraphConsistency(userId) {
        const issues = [];

        try {
            const memories = await this.getAllUserMemories(userId);
            const memoryIds = memories.map(m => m.id);

            // Check for orphaned edges (edges referencing non-existent memories)
            const orphanedEdges = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT ke.* FROM knowledge_edges ke
                    WHERE ke.source_memory_id NOT IN (${memoryIds.map(() => '?').join(',')})
                       OR ke.target_memory_id NOT IN (${memoryIds.map(() => '?').join(',')})
                `;
                const params = [...memoryIds, ...memoryIds];
                db.all(sql, params, (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                });
            });

            if (orphanedEdges.length > 0) {
                issues.push({
                    type: 'orphaned_edges',
                    layer: 'knowledge_graph',
                    severity: 'medium',
                    count: orphanedEdges.length,
                    message: `${orphanedEdges.length} orphaned edges found`,
                    suggestion: 'Clean up orphaned relationships'
                });
            }
        } catch (error) {
            console.error('[MemoryIntelligence] Error checking graph consistency:', error.message);
        }

        return issues;
    }

    /**
     * Check reasoning layer consistency
     * @private
     */
    async checkReasoningConsistency(userId) {
        const issues = [];

        try {
            // Check for memories with low importance but high confidence
            const memories = await this.getAllUserMemories(userId);
            const inconsistentMemories = memories.filter(m => {
                return m.confidence >= 0.8 && (!m.importance_score || m.importance_score < 0.3);
            });

            if (inconsistentMemories.length > 0) {
                issues.push({
                    type: 'importance_confidence_mismatch',
                    layer: 'reasoning',
                    severity: 'low',
                    count: inconsistentMemories.length,
                    message: `${inconsistentMemories.length} memories have high confidence but low importance`,
                    suggestion: 'Recalculate importance scores'
                });
            }
        } catch (error) {
            console.error('[MemoryIntelligence] Error checking reasoning consistency:', error.message);
        }

        return issues;
    }

    /**
     * Generate suggestions based on analysis
     * @private
     */
    generateSuggestions(conflicts, duplicates, consistencyIssues) {
        const suggestions = [];

        // Conflict suggestions
        if (conflicts.length > 0) {
            conflicts.forEach(conflict => {
                suggestions.push({
                    type: 'resolve_conflict',
                    priority: conflict.severity,
                    description: `Resolve conflict in ${conflict.category}`,
                    details: conflict.suggestedResolution,
                    action: {
                        type: 'review',
                        memoryIds: [conflict.memory1.id, conflict.memory2.id]
                    }
                });
            });
        }

        // Duplicate suggestions
        if (duplicates.length > 0) {
            duplicates.forEach(duplicate => {
                suggestions.push({
                    type: 'merge_duplicates',
                    priority: 'medium',
                    description: `Merge ${duplicate.duplicates.length + 1} duplicate memories`,
                    details: `Keep primary memory (ID: ${duplicate.primaryMemory.id}) and remove ${duplicate.duplicates.length} duplicates`,
                    action: {
                        type: 'merge',
                        primaryId: duplicate.primaryMemory.id,
                        duplicateIds: duplicate.duplicates.map(d => d.id)
                    }
                });
            });
        }

        // Consistency suggestions
        if (consistencyIssues.length > 0) {
            consistencyIssues.forEach(issue => {
                suggestions.push({
                    type: 'fix_consistency',
                    priority: issue.severity,
                    description: issue.message,
                    details: issue.suggestion,
                    action: {
                        type: 'maintenance',
                        layer: issue.layer
                    }
                });
            });
        }

        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    /**
     * Calculate health score for memory system
     * @private
     */
    calculateHealthScore(report) {
        let score = 100;

        // Deduct for conflicts
        score -= report.summary.totalConflicts * 5;

        // Deduct for duplicates
        score -= report.summary.totalDuplicates * 3;

        // Deduct for consistency issues
        score -= report.summary.totalIssues * 2;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculate text similarity (simple Jaccard similarity)
     * @private
     */
    calculateTextSimilarity(text1, text2) {
        const words1 = new Set(text1.split(/\s+/));
        const words2 = new Set(text2.split(/\s+/));

        const intersection = new Set([...words1].filter(word => words2.has(word)));
        const union = new Set([...words1, ...words2]);

        if (union.size === 0) return 0;

        return intersection.size / union.size;
    }

    /**
     * Get memories by categories
     * @private
     */
    async getMemoriesByCategories(userId, categories) {
        return new Promise((resolve, reject) => {
            const placeholders = categories.map(() => '?').join(',');
            const sql = `SELECT * FROM memories WHERE user_id = ? AND category IN (${placeholders})`;

            db.all(sql, [userId, ...categories], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    /**
     * Get all user memories
     * @private
     */
    async getAllUserMemories(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM memories WHERE user_id = ?`;
            db.all(sql, [userId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

module.exports = new MemoryIntelligenceService();