/**
 * Memory Extraction Service
 * 
 * Standalone service for extracting memories from user messages.
 * Currently implements rule-based extraction.
 * Designed to be upgraded to LLM-based extraction in future phases.
 * 
 * This service is independent of controllers and routes.
 */

class MemoryExtractionService {
    constructor() {
        // Patterns for rule-based extraction
        this.patterns = [
            // "remember that..." patterns
            {
                regex: /remember\s+that\s+(.+?)(?:\.|!|\?|$)/i,
                category: 'preferences',
                confidence: 0.9
            },
            // "my favorite..." patterns
            {
                regex: /my\s+favorite\s+(.+?)\s+is\s+(.+?)(?:\.|!|\?|$)/i,
                category: 'preferences',
                confidence: 0.95,
                format: (match) => `Favorite ${match[1]}: ${match[2]}`
            },
            // "I am..." patterns (identity)
            {
                regex: /i\s+am\s+(?:a\s+|an\s+)?(.+?)(?:\.|!|\?|$)/i,
                category: 'identity',
                confidence: 0.85,
                exclude: ['i am sorry', 'i am not sure', 'i am just', 'i am here', 'i am online', 'i am ready']
            },
            // "I work..." patterns
            {
                regex: /i\s+work\s+(?:at|for|in|with)?\s*(.+?)(?:\.|!|\?|$)/i,
                category: 'work',
                confidence: 0.9
            },
            // "I study..." patterns
            {
                regex: /i\s+study\s+(?:at|in|for)?\s*(.+?)(?:\.|!|\?|$)/i,
                category: 'education',
                confidence: 0.9
            },
            // "I want to..." patterns (goals)
            {
                regex: /i\s+want\s+to\s+(.+?)(?:\.|!|\?|$)/i,
                category: 'goals',
                confidence: 0.8
            },
            // "my goal is..." patterns
            {
                regex: /my\s+goal\s+is\s+to\s+(.+?)(?:\.|!|\?|$)/i,
                category: 'goals',
                confidence: 0.9
            },
            // "I like..." patterns
            {
                regex: /i\s+like\s+(.+?)(?:\.|!|\?|$)/i,
                category: 'preferences',
                confidence: 0.75
            },
            // "I love..." patterns
            {
                regex: /i\s+love\s+(.+?)(?:\.|!|\?|$)/i,
                category: 'preferences',
                confidence: 0.8
            },
            // "I hate..." patterns
            {
                regex: /i\s+hate\s+(.+?)(?:\.|!|\?|$)/i,
                category: 'preferences',
                confidence: 0.8
            },
            // "my name is..." patterns
            {
                regex: /my\s+name\s+is\s+(.+?)(?:\.|!|\?|$)/i,
                category: 'identity',
                confidence: 0.95
            },
            // "I am from..." patterns
            {
                regex: /i\s+am\s+from\s+(.+?)(?:\.|!|\?|$)/i,
                category: 'identity',
                confidence: 0.9
            },
            // "I live in..." patterns
            {
                regex: /i\s+live\s+in\s+(.+?)(?:\.|!|\?|$)/i,
                category: 'identity',
                confidence: 0.9
            }
        ];
    }

    /**
     * Extract memories from a message
     * @param {string} message - The user message to extract memories from
     * @param {number} userId - The user ID (for duplicate checking)
     * @param {Function} checkDuplicate - Optional callback to check for duplicates
     * @returns {Array<Object>} Extracted memories
     */
    extractMemories(message, userId, checkDuplicate) {
        const extractedMemories = [];
        const lowerMessage = message.toLowerCase();

        for (const pattern of this.patterns) {
            // Add global flag for matchAll
            const regexFlags = pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g';
            const matches = message.matchAll(new RegExp(pattern.regex.source, regexFlags));

            for (const match of matches) {
                // Check exclusions
                if (pattern.exclude) {
                    const matchedText = match[0].toLowerCase();
                    const isExcluded = pattern.exclude.some(excl => matchedText.includes(excl));
                    if (isExcluded) {
                        continue;
                    }
                }

                // Format the content
                let content;
                if (pattern.format) {
                    content = pattern.format(match);
                } else {
                    // Default: use the captured group(s)
                    content = match[1] ? match[1].trim() : match[0].trim();
                    // Capitalize first letter
                    content = content.charAt(0).toUpperCase() + content.slice(1);
                }

                // Validate content length
                if (content.length < 3 || content.length > 500) {
                    continue;
                }

                const memory = {
                    category: pattern.category,
                    content: content,
                    confidence: pattern.confidence,
                    source: 'extracted'
                };

                // Check for duplicates if callback provided
                if (checkDuplicate) {
                    const isDuplicate = checkDuplicate(userId, memory.content, memory.category);
                    if (isDuplicate) {
                        continue; // Skip duplicate
                    }
                }

                extractedMemories.push(memory);
            }
        }

        return extractedMemories;
    }

    /**
     * Extract memories with confidence scoring
     * @param {string} message - The user message
     * @param {number} userId - The user ID
     * @param {Function} checkDuplicate - Optional duplicate check callback
     * @returns {Array<Object>} Extracted memories with metadata
     */
    extractWithConfidence(message, userId, checkDuplicate) {
        const memories = this.extractMemories(message, userId, checkDuplicate);

        return memories.map(memory => ({
            ...memory,
            extractedAt: new Date().toISOString(),
            originalMessage: message
        }));
    }

    /**
     * Get extraction statistics
     * @returns {Object} Statistics about the extraction patterns
     */
    getStats() {
        return {
            totalPatterns: this.patterns.length,
            categories: [...new Set(this.patterns.map(p => p.category))],
            patterns: this.patterns.map(p => ({
                category: p.category,
                confidence: p.confidence,
                hasExclusions: !!p.exclude,
                hasCustomFormat: !!p.format
            }))
        };
    }

    /**
     * Add a custom extraction pattern (for future extensibility)
     * @param {RegExp} regex - The regex pattern
     * @param {string} category - The memory category
     * @param {number} confidence - Confidence score (0-1)
     * @param {Function} format - Optional formatter function
     * @param {Array<string>} exclude - Optional exclusion list
     */
    addPattern(regex, category, confidence, format, exclude) {
        const validCategories = ['identity', 'preferences', 'education', 'work', 'goals'];
        if (!validCategories.includes(category)) {
            throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
        }

        if (confidence < 0 || confidence > 1) {
            throw new Error('Confidence must be between 0 and 1.');
        }

        this.patterns.push({
            regex,
            category,
            confidence,
            format,
            exclude
        });
    }

    /**
     * Validate if a message likely contains extractable memories
     * @param {string} message - The message to check
     * @returns {boolean} True if likely contains memories
     */
    hasPotentialMemories(message) {
        const lowerMessage = message.toLowerCase();
        const triggers = [
            'remember',
            'my favorite',
            'i am',
            'i work',
            'i study',
            'i want',
            'my goal',
            'i like',
            'i love',
            'i hate',
            'my name',
            'i live',
            'i prefer'
        ];

        return triggers.some(trigger => lowerMessage.includes(trigger));
    }
}

module.exports = new MemoryExtractionService();