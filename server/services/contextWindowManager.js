/**
 * Context Window Manager - Phase 11.3
 * 
 * Centralized service for building optimal context windows for LLM requests.
 * Selects and orders context components based on priority rules.
 * 
 * Responsibilities:
 * - Receive complete conversation history
 * - Receive memory context
 * - Receive conversation summary
 * - Receive runtime context
 * - Build optimal context window following priority rules
 * 
 * Priority Order:
 * 1. System Prompt
 * 2. Relevant Memory
 * 3. Conversation Summary
 * 4. Most Recent Messages (last 15)
 * 5. Tool Results
 * 6. Older Conversation (discard if summarized)
 */

class ContextWindowManager {
    constructor() {
        // Configuration for context window management
        this.config = {
            // Maximum messages to keep in context
            maxRecentMessages: 15,
            // Minimum messages to trigger summarization
            minMessagesForSummary: 15,
            // Maximum context window size (characters)
            maxContextSize: 10000,
            // Enable deduplication
            enableDeduplication: true
        };
    }

    /**
     * Build optimal context window from all available context
     * @param {Object} context - Context object containing:
     *   - systemPrompt: System prompt string
     *   - memoryContext: Memory context string
     *   - conversationSummary: Conversation summary string
     *   - messages: Full conversation history
     *   - toolResults: Tool execution results
     *   - runtimeContext: Runtime context string
     * @returns {Array<{role: string, content: string}>} Ordered context messages
     */
    buildContextWindow(context = {}) {
        try {
            const {
                systemPrompt = '',
                memoryContext = '',
                conversationSummary = '',
                messages = [],
                toolResults = [],
                runtimeContext = ''
            } = context;

            const contextWindow = [];

            // Priority 1: System Prompt (always first)
            if (systemPrompt) {
                contextWindow.push({
                    role: 'system',
                    content: systemPrompt
                });
            }

            // Priority 2: Relevant Memory
            if (memoryContext) {
                contextWindow.push({
                    role: 'system',
                    content: memoryContext
                });
            }

            // Priority 3: Conversation Summary
            if (conversationSummary) {
                contextWindow.push({
                    role: 'system',
                    content: conversationSummary
                });
            }

            // Priority 4: Most Recent Messages (last 15)
            const recentMessages = this.getRecentMessages(messages);
            contextWindow.push(...recentMessages);

            // Priority 5: Tool Results (if relevant)
            if (toolResults && toolResults.length > 0) {
                const toolContext = this.formatToolResults(toolResults);
                if (toolContext) {
                    contextWindow.push({
                        role: 'system',
                        content: toolContext
                    });
                }
            }

            // Priority 6: Runtime Context (always last)
            if (runtimeContext) {
                contextWindow.push({
                    role: 'system',
                    content: runtimeContext
                });
            }

            // Remove duplicates and empty messages
            if (this.config.enableDeduplication) {
                return this.deduplicateContext(contextWindow);
            }

            return contextWindow;

        } catch (error) {
            console.error('[ContextWindowManager] Error building context window:', error.message);
            return [];
        }
    }

    /**
     * Get recent messages (last N messages)
     * @param {Array} messages - Full conversation history
     * @returns {Array<{role: string, content: string}>} Recent messages
     */
    getRecentMessages(messages) {
        if (!messages || messages.length === 0) {
            return [];
        }

        // Get last N messages
        const recentMessages = messages.slice(-this.config.maxRecentMessages);

        // Filter out empty messages
        return recentMessages.filter(msg => {
            return msg &&
                msg.role &&
                msg.content &&
                msg.content.trim() !== '';
        });
    }

    /**
     * Format tool results for context injection
     * @param {Array} toolResults - Tool execution results
     * @returns {string} Formatted tool context
     */
    formatToolResults(toolResults) {
        if (!toolResults || toolResults.length === 0) {
            return '';
        }

        const formattedResults = toolResults.map(result => {
            if (result.success) {
                return `[Tool: ${result.tool}]\nInput: ${JSON.stringify(result.input)}\nOutput: ${result.output}`;
            } else {
                return `[Tool: ${result.tool} - Failed]\nError: ${result.output}`;
            }
        }).join('\n\n');

        return `[Tool Results]\n${formattedResults}`;
    }

    /**
     * Remove duplicate and empty context entries
     * @param {Array} contextWindow - Context window messages
     * @returns {Array<{role: string, content: string}>} Deduplicated context
     */
    deduplicateContext(contextWindow) {
        const seen = new Set();
        const deduplicated = [];

        for (const message of contextWindow) {
            // Skip empty messages
            if (!message || !message.content || message.content.trim() === '') {
                continue;
            }

            // Create a unique key for deduplication
            const key = `${message.role}:${message.content}`;

            // Skip duplicates
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            deduplicated.push(message);
        }

        return deduplicated;
    }

    /**
     * Calculate total context size
     * @param {Array} contextWindow - Context window messages
     * @returns {number} Total size in characters
     */
    calculateContextSize(contextWindow) {
        return contextWindow.reduce((total, message) => {
            return total + (message.content ? message.content.length : 0);
        }, 0);
    }

    /**
     * Check if context window is within size limits
     * @param {Array} contextWindow - Context window messages
     * @returns {boolean} True if within limits
     */
    isWithinSizeLimit(contextWindow) {
        const totalSize = this.calculateContextSize(contextWindow);
        return totalSize <= this.config.maxContextSize;
    }

    /**
     * Get context window statistics
     * @param {Array} contextWindow - Context window messages
     * @returns {Object} Statistics about the context window
     */
    getContextStats(contextWindow) {
        const stats = {
            totalMessages: contextWindow.length,
            systemMessages: 0,
            userMessages: 0,
            assistantMessages: 0,
            totalSize: 0,
            withinLimit: false
        };

        for (const message of contextWindow) {
            stats.totalSize += message.content ? message.content.length : 0;

            switch (message.role) {
                case 'system':
                    stats.systemMessages++;
                    break;
                case 'user':
                    stats.userMessages++;
                    break;
                case 'assistant':
                    stats.assistantMessages++;
                    break;
            }
        }

        stats.withinLimit = this.isWithinSizeLimit(contextWindow);
        return stats;
    }

    /**
     * Update configuration
     * @param {Object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
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
const contextWindowManager = new ContextWindowManager();

module.exports = contextWindowManager;