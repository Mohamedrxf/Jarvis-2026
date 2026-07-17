/**
 * Conversation Summary Service - Phase 11.2
 * 
 * Centralized service for summarizing long conversations.
 * Automatically summarizes older messages to reduce prompt size while preserving context.
 * 
 * Responsibilities:
 * - Summarize long conversations
 * - Maintain rolling summaries
 * - Preserve important facts, preferences, tasks, and decisions
 * - Reduce prompt size
 * 
 * Storage: In-memory (designed for future persistent storage)
 */

const aiEngine = require('../../ai-engine');

class ConversationSummaryService {
    constructor() {
        // In-memory storage for summaries
        // Structure: { conversationId: { summary: string, lastMessageCount: number, updatedAt: Date } }
        this.summaries = new Map();

        // Configuration
        this.config = {
            // Minimum messages before considering summarization
            minMessagesForSummary: 15,
            // Number of recent messages to keep (not summarized)
            keepRecentMessages: 15,
            // Maximum summary length (characters)
            maxSummaryLength: 1000,
            // Summary refresh threshold (summarize again after this many new messages)
            summaryRefreshThreshold: 10
        };
    }

    /**
     * Get conversation summary if needed
     * @param {string} conversationId - Unique conversation identifier
     * @param {Array} messages - Full conversation history
     * @returns {Promise<string>} Summary string or empty string if no summary needed
     */
    async getSummary(conversationId, messages) {
        try {
            // No summary needed for short conversations
            if (!messages || messages.length <= this.config.minMessagesForSummary) {
                return '';
            }

            const storedSummary = this.summaries.get(conversationId);
            const messagesToSummarize = messages.length - this.config.keepRecentMessages;

            // If we have a stored summary and not enough new messages to warrant refresh
            if (storedSummary && messagesToSummarize < storedSummary.lastMessageCount + this.config.summaryRefreshThreshold) {
                return storedSummary.summary;
            }

            // Generate new summary
            const summary = await this.generateSummary(messages);

            if (!summary) {
                return '';
            }

            // Store summary
            this.summaries.set(conversationId, {
                summary: summary,
                lastMessageCount: messagesToSummarize,
                updatedAt: new Date()
            });

            return summary;

        } catch (error) {
            console.error('[ConversationSummary] Error getting summary:', error.message);
            return '';
        }
    }

    /**
     * Generate summary from conversation messages
     * @param {Array} messages - Conversation messages
     * @returns {Promise<string>} Generated summary
     */
    async generateSummary(messages) {
        try {
            // Separate messages to summarize (exclude last 15)
            const messagesToSummarize = messages.slice(0, messages.length - this.config.keepRecentMessages);

            if (messagesToSummarize.length === 0) {
                return '';
            }

            // Build prompt for summarization
            const summaryPrompt = this.buildSummaryPrompt(messagesToSummarize);

            // Call AI engine to generate summary
            const response = await aiEngine.generateResponse([
                {
                    role: 'system',
                    content: this.getSystemPrompt()
                },
                {
                    role: 'user',
                    content: summaryPrompt
                }
            ]);

            let summary = response.content.trim();

            // Truncate if too long
            if (summary.length > this.config.maxSummaryLength) {
                summary = summary.substring(0, this.config.maxSummaryLength - 3) + '...';
            }

            // Add header to make it clear this is a conversation summary
            return `[Conversation Summary]\n${summary}`;

        } catch (error) {
            console.error('[ConversationSummary] Error generating summary:', error.message);
            return '';
        }
    }

    /**
     * Build prompt for summarization
     * @param {Array} messages - Messages to summarize
     * @returns {string} Summary prompt
     */
    buildSummaryPrompt(messages) {
        const conversationText = messages
            .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n\n');

        return `Summarize the following conversation. Focus on:
1. Important user facts (name, preferences, goals, etc.)
2. Completed tasks and their outcomes
3. Pending tasks or unresolved questions
4. User preferences mentioned
5. Important decisions made
6. Context needed for future conversations

Keep the summary concise but comprehensive. Use bullet points for clarity.

CONVERSATION:
${conversationText}

SUMMARY:`;
    }

    /**
     * Get system prompt for summarization
     * @returns {string} System prompt
     */
    getSystemPrompt() {
        return `You are a conversation summarization assistant. Your job is to create concise, informative summaries of conversations that preserve important context for future interactions.

RULES:
1. Focus on facts, decisions, tasks, and preferences
2. Ignore greetings, small talk, and temporary emotional states
3. Use bullet points for clarity
4. Keep summaries under ${this.config.maxSummaryLength} characters
5. Preserve information that would be useful for personalizing future responses`;
    }

    /**
     * Clear summary for a conversation (e.g., when conversation is deleted)
     * @param {string} conversationId - Conversation identifier
     */
    clearSummary(conversationId) {
        this.summaries.delete(conversationId);
    }

    /**
     * Clear all summaries (e.g., for testing or memory management)
     */
    clearAllSummaries() {
        this.summaries.clear();
    }

    /**
     * Get summary statistics
     * @returns {Object} Statistics about stored summaries
     */
    getStats() {
        return {
            totalSummaries: this.summaries.size,
            conversations: Array.from(this.summaries.keys()),
            config: this.config
        };
    }

    /**
     * Update configuration
     * @param {Object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

// Export singleton instance
const conversationSummaryService = new ConversationSummaryService();

module.exports = conversationSummaryService;