const fs = require('fs');

const content = `// Agent Service - Phase 8.0B
// Agent Decision Pipeline - Structured execution plan
// No execution, planning, or reasoning implemented

class AgentService {
    analyzeRequest(message) {
        if (!message || typeof message !== 'string') {
            return {
                route: "ai",
                target: null,
                confidence: 0.5,
                reason: "Invalid or empty message, defaulting to AI"
            };
        }

        const lowerMessage = message.toLowerCase().trim();

        // Tool request detection
        const toolResult = this._detectToolRequest(lowerMessage, message);

        // Priority: tool > file > memory > ai
        if (toolResult.detected) {
            return {
                route: "tool",
                target: toolResult.target,
                confidence: toolResult.confidence,
                reason: toolResult.reason
            };
        }

        // File-related request detection
        const isFileRequest = this._detectFileRequest(lowerMessage);
        if (isFileRequest) {
            return {
                route: "file",
                target: null,
                confidence: 0.9,
                reason: "File operation request detected"
            };
        }

        // Memory-related request detection
        const isMemoryRequest = this._detectMemoryRequest(lowerMessage);
        if (isMemoryRequest) {
            return {
                route: "memory",
                target: null,
                confidence: 0.9,
                reason: "Memory operation request detected"
            };
        }

        // Default to AI
        return {
            route: "ai",
            target: null,
            confidence: 0.7,
            reason: "General conversation or query, routing to AI"
        };
    }

    _detectToolRequest(lowerMessage, originalMessage) {
        // Weather detection
        if (lowerMessage.match(/(?:weather|what'?s?\s+(?:the\s+)?weather)\s+(?:in|for)\s+.+/i)) {
            return { detected: true, target: "weather", confidence: 0.95, reason: "Weather query pattern detected" };
        }

        // Web search detection
        if (lowerMessage.match(/(?:web\s+search|search\s+for)\s+.+/i)) {
            return { detected: true, target: "web_search", confidence: 0.95, reason: "Web search request pattern detected" };
        }

        // Currency conversion
        if (lowerMessage.match(/(?:convert|currency)\s+\d+(?:\.\d+)?\s+.+\s+to\s+.+/i)) {
            return { detected: true, target: "currency", confidence: 0.95, reason: "Currency conversion pattern detected" };
        }

        // Calculator
        if (lowerMessage.match(/^calculate\s+.+$/i)) {
            return { detected: true, target: "calculator", confidence: 0.95, reason: "Calculator command pattern detected" };
        }

        // Math expression
        if (lowerMessage.match(/^[\d\s+*/().-]+$/)) {
            return { detected: true, target: "calculator", confidence: 0.85, reason: "Mathematical expression detected" };
        }

        // UUID generation
        if (lowerMessage.match(/^generate\s+uuid$/i)) {
            return { detected: true, target: "uuid", confidence: 0.95, reason: "UUID generation request detected" };
        }

        // Password generation
        if (lowerMessage.match(/(?:generate\s+password|password)/i)) {
            return { detected: true, target: "password", confidence: 0.95, reason: "Password generation request detected" };
        }

        // Date/time
        if (lowerMessage.match(/(?:time|date|what\s+time|what\s+date|current\s+time|current\s+date)/i)) {
            return { detected: true, target: "datetime", confidence: 0.95, reason: "Date/time query pattern detected" };
        }

        return { detected: false, target: null, confidence: 0, reason: "No tool pattern matched" };
    }

    _detectFileRequest(lowerMessage) {
        // File upload intent - must start with upload/attach/add followed by "file"
        if (/^(?:upload|attach|add)\s+(?:my\s+|a\s+)?file$/i.test(lowerMessage)) {
            return { detected: true, reason: "File upload intent detected" };
        }

        // File search/query - must start with search/find/show/list/get followed by "file(s)"
        if (/^(?:search|find|show|list|get)\s+(?:my\s+)?files?$/i.test(lowerMessage)) {
            return { detected: true, reason: "File search/query intent detected" };
        }

        // File content query - specific patterns only
        if (/^(?:what|find|search)\s+(?:is|in|does)\s+(?:in\s+)?(?:my\s+)?(?:file|document|pdf|doc)$/i.test(lowerMessage)) {
            return { detected: true, reason: "File content query detected" };
        }

        // Read/analyze file - specific patterns only
        if (/^(?:read|analyze|summarize|extract)\s+(?:my\s+)?(?:file|document|pdf|doc)$/i.test(lowerMessage)) {
            return { detected: true, reason: "File read/analyze intent detected" };
        }

        // Delete file - specific pattern only
        if (/^(?:delete|remove)\s+(?:my\s+)?file$/i.test(lowerMessage)) {
            return { detected: true, reason: "File deletion intent detected" };
        }

        return { detected: false, reason: "No file pattern matched" };
    }

    _detectMemoryRequest(lowerMessage) {
        // Memory creation
        if (lowerMessage.match(/(?:remember|save|store|memorize|note)\s+(?:this\s+)?(?:that\s+)?(.+)/i)) {
            return { detected: true, reason: "Memory creation intent detected" };
        }

        // Memory search/recall
        if (lowerMessage.match(/(?:what\s+do\s+you\s+remember|recall|search\s+memory|find\s+in\s+memory|do\s+you\s+know)/i)) {
            return { detected: true, reason: "Memory search/recall intent detected" };
        }

        // Memory query
        if (lowerMessage.match(/(?:what\s+is\s+my|tell\s+me\s+about\s+my|do\s+i\s+like|am\s+i\s+)/i)) {
            return { detected: true, reason: "Memory query intent detected" };
        }

        // Memory management
        if (lowerMessage.match(/(?:show|list|get)\s+(?:my\s+)?memories/i)) {
            return { detected: true, reason: "Memory management intent detected" };
        }

        // Forget/delete memory
        if (lowerMessage.match(/(?:forget|delete|remove)\s+(?:that\s+)?memory/i)) {
            return { detected: true, reason: "Memory deletion intent detected" };
        }

        return { detected: false, reason: "No memory pattern matched" };
    }
}

const agentService = new AgentService();
module.exports = agentService;
`;

fs.writeFileSync('server/services/agentService.js', content);
console.log('File written successfully');
console.log('File size:', fs.statSync('server/services/agentService.js').size, 'bytes');