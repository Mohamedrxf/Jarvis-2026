/**
 * Prompt Manager - Phase 11.1
 * 
 * Centralized service for constructing system prompts dynamically.
 * Replaces hardcoded system prompts throughout the project.
 * 
 * Responsibilities:
 * - Build the final system prompt dynamically
 * - Keep prompt construction modular
 * - Support future extensions without modifying AIEngine
 */

const memoryService = require('./memoryService');
const toolService = require('./toolService');
const conversationSummaryService = require('./conversationSummaryService');
const contextWindowManager = require('./contextWindowManager');

class PromptManager {
    constructor() {
        this.baseIdentity = this.getBaseIdentity();
    }

    /**
     * Build the complete system prompt by combining all components
     * @param {Object} context - Context object containing:
     *   - userId: User ID for personalization
     *   - query: Current query for context relevance
     *   - route: Route type (memory, file, ai, tool, unknown)
     *   - messages: Conversation history (for summary)
     *   - userPreferences: Optional user preferences
     * @returns {Promise<Array>} Context window messages
     */
    async buildSystemPrompt(context = {}) {
        const {
            userId = null,
            query = null,
            route = 'ai',
            messages = [],
            userPreferences = null
        } = context;

        // Build prompt components
        const components = [];

        // 1. Base assistant identity (always included)
        components.push(this.getBaseIdentity());

        // 2. Memory context (if available)
        if (userId) {
            const memoryContext = await this.getMemoryContext(userId, query);
            if (memoryContext) {
                components.push(memoryContext);
            }
        }

        // 3. Conversation summary (if conversation is long enough)
        if (messages.length > 0) {
            const conversationSummary = await this.getConversationSummary(messages);
            if (conversationSummary) {
                components.push(conversationSummary);
            }
        }

        // 4. Tool availability (if tools are relevant to the route)
        if (this.shouldIncludeTools(route)) {
            const toolContext = this.getToolAvailability();
            if (toolContext) {
                components.push(toolContext);
            }
        }

        // 5. User preferences (if available)
        if (userPreferences) {
            const preferencesContext = this.getUserPreferences(userPreferences);
            if (preferencesContext) {
                components.push(preferencesContext);
            }
        }

        // 6. Runtime context
        const runtimeContext = this.getRuntimeContext();
        if (runtimeContext) {
            components.push(runtimeContext);
        }

        // Build context window using ContextWindowManager
        // Note: components already contains all system-level prompts (identity, memory, summary, tools, preferences, runtime)
        // We pass them as a single combined system prompt to avoid duplication
        const contextWindow = contextWindowManager.buildContextWindow({
            systemPrompt: components.join('\n\n'),
            messages: messages
        });

        return contextWindow;
    }

    /**
     * Get base assistant identity
     * @returns {string} Base identity prompt
     */
    getBaseIdentity() {
        return this.baseIdentity;
    }

    /**
     * Get memory context for the user
     * @param {number} userId - User ID
     * @param {string} query - Current query for relevance
     * @returns {Promise<string>} Memory context or empty string
     */
    async getMemoryContext(userId, query = null) {
        try {
            if (!userId) {
                return '';
            }

            const context = await memoryService.getMemoryContext(userId, query);
            return context || '';
        } catch (error) {
            console.error('[PromptManager] Error getting memory context:', error.message);
            return '';
        }
    }

    /**
     * Get conversation summary using ConversationSummaryService
     * @param {Array} messages - Conversation history
     * @returns {Promise<string>} Conversation summary or empty string
     */
    async getConversationSummary(messages) {
        try {
            if (!messages || messages.length === 0) {
                return '';
            }

            // Use a generic conversation ID (in real app, this would be actual conversation ID)
            // For now, we use a hash of messages to create a unique identifier
            const conversationId = this.getConversationId(messages);

            const summary = await conversationSummaryService.getSummary(conversationId, messages);
            return summary || '';
        } catch (error) {
            console.error('[PromptManager] Error getting conversation summary:', error.message);
            return '';
        }
    }

    /**
     * Generate a conversation ID from messages (for in-memory storage)
     * @param {Array} messages - Conversation messages
     * @returns {string} Conversation identifier
     * @private
     */
    getConversationId(messages) {
        // Create a simple hash from first few messages to identify conversation
        // In production, this would be an actual conversation ID from the database
        const firstMessage = messages[0]?.content || '';
        const lastMessage = messages[messages.length - 1]?.content || '';
        const combined = `${firstMessage.substring(0, 50)}-${lastMessage.substring(0, 50)}-${messages.length}`;

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `conv_${Math.abs(hash)}`;
    }

    /**
     * Get runtime context information
     * @returns {string} Runtime context
     */
    getRuntimeContext() {
        const provider = process.env.LLM_PROVIDER || 'mock';
        const model = this.getCurrentModel();

        return `[Runtime: Provider=${provider}, Model=${model}]`;
    }

    /**
     * Get current model based on provider
     * @returns {string} Current model name
     */
    getCurrentModel() {
        const provider = process.env.LLM_PROVIDER || 'mock';

        switch (provider) {
            case 'openai':
                return process.env.OPENAI_MODEL || 'gpt-4o-mini';
            case 'gemini':
                return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
            default:
                return 'mock';
        }
    }

    /**
     * Determine if tools should be included in the prompt
     * @param {string} route - Route type
     * @returns {boolean} True if tools should be included
     */
    shouldIncludeTools(route) {
        // Include tools for ai, unknown, and tool routes
        // Exclude for memory and file routes (they have specialized handling)
        return ['ai', 'unknown', 'tool'].includes(route);
    }

    /**
     * Get tool availability information
     * @returns {string} Tool context or empty string
     */
    getToolAvailability() {
        try {
            const tools = toolService.listAvailableTools();

            if (!tools || tools.count === 0) {
                return '';
            }

            const toolNames = tools.tools.join(', ');
            return `[System: You have access to the following tools: ${toolNames}. Use them when appropriate to assist the user.]`;
        } catch (error) {
            console.error('[PromptManager] Error getting tool availability:', error.message);
            return '';
        }
    }

    /**
     * Get user preferences context
     * @param {Object} preferences - User preferences object
     * @returns {string} Preferences context or empty string
     */
    getUserPreferences(preferences) {
        if (!preferences || Object.keys(preferences).length === 0) {
            return '';
        }

        const prefString = Object.entries(preferences)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        return `[User Preferences: ${prefString}]`;
    }

    /**
     * Build a simple system prompt for specialized use cases
     * @param {string} customPrompt - Custom prompt content
     * @returns {string} Complete system prompt
     */
    buildCustomPrompt(customPrompt) {
        return `${this.baseIdentity}\n\n${customPrompt}`;
    }

    /**
     * Build system prompt for memory extraction (used by LLMMemoryExtractionService)
     * @returns {string} System prompt for memory extraction
     */
    buildMemoryExtractionPrompt() {
        return `You are a memory extraction assistant for JARVIS, an AI personal assistant. Your job is to analyze user messages and extract only meaningful, long-term memories that would be useful for personalizing future interactions.

RULES:
1. ONLY extract stable, long-term information that is worth remembering
2. IGNORE: greetings, small talk, emotional states, temporary situations, questions, commands, generic chat
3. EXTRACT: personal facts, preferences, goals, skills, education, work information, identity details
4. Be conservative - if unsure, do NOT extract
5. Each memory should be a clear, concise statement of fact
6. Assign confidence score (0-1) based on how certain you are this is worth remembering

CATEGORIES:
- identity: name, age, location, nationality, family info
- preferences: likes, dislikes, favorite things, habits
- education: schools, degrees, courses, certifications
- work: job title, company, industry, role
- goals: aspirations, plans, targets, ambitions
- skills: abilities, expertise, talents, competencies

EXAMPLES OF WHAT TO EXTRACT:
✓ "My name is John" → identity
✓ "I work at Google as a software engineer" → work
✓ "I love playing guitar" → preferences
✓ "I want to learn machine learning" → goals
✓ "I graduated from MIT" → education
✓ "I'm fluent in Spanish" → skills

EXAMPLES OF WHAT TO IGNORE:
✗ "Hello!" (greeting)
✗ "How are you?" (question)
✗ "I'm feeling sad today" (emotional state)
✗ "What's the weather?" (question)
✗ "Thanks for your help" (gratitude)
✗ "Can you help me with X?" (request)

Return ONLY valid JSON in this exact format:
{
  "should_store": boolean,
  "memories": [
    {
      "category": "identity | preferences | education | work | goals | skills",
      "content": "Clear, concise memory content",
      "confidence": 0.0-1.0
    }
  ]
}

If no memories should be stored, return:
{
  "should_store": false,
  "memories": []
}`;
    }

    /**
     * Get base assistant identity prompt
     * @private
     */
    getBaseIdentity() {
        return `You are JARVIS, an advanced AI personal assistant. You are helpful, intelligent, and efficient. You provide clear, concise, and accurate responses. You maintain a professional yet friendly tone. You are capable of complex reasoning and can assist with a wide variety of tasks including answering questions, providing information, and executing tools when needed.`;
    }
}

// Export singleton instance
const promptManager = new PromptManager();

module.exports = promptManager;