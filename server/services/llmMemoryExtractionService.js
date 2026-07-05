const AIEngine = require('../../ai-engine');

/**
 * LLM-Based Memory Extraction Service
 * 
 * Uses LLM to intelligently extract memories from user messages.
 * Replaces rule-based extraction with context-aware understanding.
 * 
 * Falls back to rule-based extraction if LLM fails.
 */

class LLMMemoryExtractionService {
    constructor() {
        this.aiEngine = AIEngine;
        this.fallbackService = require('./memoryExtractionService');

        // Valid categories for memories
        this.validCategories = ['identity', 'preferences', 'education', 'work', 'goals', 'skills'];

        // System prompt for LLM memory extraction
        this.systemPrompt = `You are a memory extraction assistant for JARVIS, an AI personal assistant. Your job is to analyze user messages and extract only meaningful, long-term memories that would be useful for personalizing future interactions.

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
     * Extract memories from a message using LLM
     * @param {string} message - The user message
     * @param {number} userId - The user ID
     * @param {Function} checkDuplicate - Optional callback to check for duplicates (synchronous)
     * @returns {Promise<Array<Object>>} Extracted memories
     */
    async extractMemories(message, userId, checkDuplicate = null) {
        try {
            // Quick pre-filter to avoid LLM call for obvious non-memories
            if (!this.hasPotentialMemories(message)) {
                return [];
            }

            // Call LLM for intelligent extraction
            const llmResponse = await this.callLLM(message);

            if (!llmResponse || !llmResponse.should_store || !llmResponse.memories) {
                return [];
            }

            // Process and validate memories
            const extractedMemories = [];

            for (const memory of llmResponse.memories) {
                // Validate category
                if (!this.validCategories.includes(memory.category)) {
                    console.log(`[LLMMemoryExtraction] Invalid category skipped: ${memory.category}`);
                    continue;
                }

                // Validate content
                if (!memory.content || memory.content.length < 3 || memory.content.length > 500) {
                    console.log(`[LLMMemoryExtraction] Invalid content length skipped: ${memory.content?.length}`);
                    continue;
                }

                // Validate confidence
                const confidence = parseFloat(memory.confidence);
                if (isNaN(confidence) || confidence < 0 || confidence > 1) {
                    console.log(`[LLMMemoryExtraction] Invalid confidence skipped: ${memory.confidence}`);
                    continue;
                }

                const processedMemory = {
                    category: memory.category,
                    content: memory.content.trim(),
                    confidence: confidence,
                    source: 'extracted'
                };

                // Check for duplicates if callback provided
                if (checkDuplicate) {
                    const isDuplicate = checkDuplicate(userId, processedMemory.content, processedMemory.category);
                    if (isDuplicate) {
                        console.log(`[LLMMemoryExtraction] Duplicate skipped: ${processedMemory.content}`);
                        continue;
                    }
                }

                extractedMemories.push(processedMemory);
            }

            return extractedMemories;

        } catch (error) {
            console.error('[LLMMemoryExtraction] LLM extraction failed, falling back to rule-based:', error.message);

            // Fallback to rule-based extraction
            try {
                return this.fallbackService.extractMemories(message, userId, checkDuplicate);
            } catch (fallbackError) {
                console.error('[LLMMemoryExtraction] Fallback also failed:', fallbackError.message);
                return [];
            }
        }
    }

    /**
     * Extract memories with confidence scoring and metadata
     * @param {string} message - The user message
     * @param {number} userId - The user ID
     * @param {Function} checkDuplicate - Optional duplicate check callback
     * @returns {Promise<Array<Object>>} Extracted memories with metadata
     */
    async extractWithConfidence(message, userId, checkDuplicate = null) {
        const memories = await this.extractMemories(message, userId, checkDuplicate);

        return memories.map(memory => ({
            ...memory,
            extractedAt: new Date().toISOString(),
            originalMessage: message,
            extractionMethod: 'llm'
        }));
    }

    /**
     * Call LLM to extract memories
     * @private
     */
    async callLLM(message) {
        const userPrompt = `Analyze this user message and extract memories:\n\n"${message}"`;

        const messages = [
            {
                role: 'system',
                content: this.systemPrompt
            },
            {
                role: 'user',
                content: userPrompt
            }
        ];

        try {
            const response = await this.aiEngine.generateResponse(messages);
            const content = response.content;

            // Parse JSON from LLM response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in LLM response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate structure
            if (typeof parsed.should_store !== 'boolean') {
                throw new Error('Invalid response structure: should_store missing or not boolean');
            }

            if (!Array.isArray(parsed.memories)) {
                throw new Error('Invalid response structure: memories is not an array');
            }

            return parsed;

        } catch (error) {
            console.error('[LLMMemoryExtraction] LLM call error:', error.message);
            throw error;
        }
    }

    /**
     * Quick check if message likely contains extractable memories
     * @param {string} message - The message to check
     * @returns {boolean} True if likely contains memories
     */
    hasPotentialMemories(message) {
        const lowerMessage = message.toLowerCase();

        // Skip very short messages
        if (message.length < 5) {
            return false;
        }

        // Skip obvious non-memories
        const skipPatterns = [
            /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))/i,
            /^(how\s+are\s+you|what'?s\s+up|sup)/i,
            /^(thanks|thank\s+you|thx)/i,
            /^(bye|goodbye|see\s+you|later)/i,
            /^(ok|okay|sure|yes|no|yeah|nope)/i,
            /^\?+$/,
            /^[!.\-]+$/
        ];

        for (const pattern of skipPatterns) {
            if (pattern.test(message.trim())) {
                return false;
            }
        }

        // Check for memory indicators
        const memoryIndicators = [
            'my name', 'i am', 'i work', 'i study', 'i live', 'i like', 'i love', 'i hate',
            'my favorite', 'i want', 'my goal', 'i prefer', 'i enjoy', 'i\'m', 'i have',
            'remember', 'my job', 'my school', 'i can', 'i know', 'i speak', 'i use'
        ];

        return memoryIndicators.some(indicator => lowerMessage.includes(indicator));
    }

    /**
     * Semantic similarity check for deduplication
     * @param {string} content1 - First memory content
     * @param {string} content2 - Second memory content
     * @returns {boolean} True if similar
     */
    isSemanticDuplicate(content1, content2) {
        // Normalize for comparison
        const normalize = (str) => {
            return str.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const norm1 = normalize(content1);
        const norm2 = normalize(content2);

        // Exact match after normalization
        if (norm1 === norm2) {
            return true;
        }

        // Check if one contains the other (substring match)
        if (norm1.includes(norm2) || norm2.includes(norm1)) {
            return true;
        }

        // Simple word overlap check (Jaccard similarity)
        const words1 = new Set(norm1.split(' '));
        const words2 = new Set(norm2.split(' '));

        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);

        const similarity = intersection.size / union.size;

        // If 70% or more words overlap, consider it a duplicate
        return similarity >= 0.7;
    }

    /**
     * Get extraction statistics
     * @returns {Object} Statistics about the extraction service
     */
    getStats() {
        return {
            type: 'llm-based',
            provider: this.aiEngine.provider,
            validCategories: this.validCategories,
            hasFallback: true,
            features: [
                'LLM-powered context understanding',
                'Smart filtering of irrelevant content',
                'Semantic deduplication',
                'Automatic fallback to rule-based extraction'
            ]
        };
    }
}

module.exports = new LLMMemoryExtractionService();