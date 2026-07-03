// Agent Service - Phase 8.0B
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
        if (isFileRequest.detected) {
            return {
                route: "file",
                target: null,
                confidence: 0.95,
                reason: "File operation request detected"
            };
        }

        // Memory-related request detection
        const isMemoryRequest = this._detectMemoryRequest(lowerMessage);
        if (isMemoryRequest.detected) {
            return {
                route: "memory",
                target: null,
                confidence: 0.95,
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
        if (/^(?:search|find|show|list|get)\b\s+(?:my\s+)?files?$/i.test(lowerMessage)) {
            return { detected: true, reason: "File search/query intent detected" };
        }

        // File content query - specific patterns only
        if (/^(?:what|find|search)\b\s+(?:is|in|does)\s+(?:in\s+)?(?:my\s+)?(?:file|document|pdf|doc)$/i.test(lowerMessage)) {
            return { detected: true, reason: "File content query detected" };
        }

        // Read/analyze file - specific patterns only
        if (/^(?:read|analyze|summarize|extract)\b\s+(?:my\s+)?(?:file|document|pdf|doc)$/i.test(lowerMessage)) {
            return { detected: true, reason: "File read/analyze intent detected" };
        }

        // Delete file - specific pattern only
        if (/^(?:delete|remove)\b\s+(?:my\s+)?file$/i.test(lowerMessage)) {
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

    buildContextRequirements(route) {
        // Default: no context requirements
        const defaultContext = {
            memory: false,
            files: false,
            tools: false
        };

        // Route-specific context requirements
        switch (route) {
            case "tool":
                return {
                    memory: false,
                    files: false,
                    tools: true
                };

            case "memory":
                return {
                    memory: true,
                    files: false,
                    tools: false
                };

            case "file":
                return {
                    memory: false,
                    files: true,
                    tools: false
                };

            case "ai":
                return {
                    memory: true,
                    files: false,
                    tools: false
                };

            default:
                return defaultContext;
        }
    }

    buildContextPlan(route) {
        // Planning ONLY - no service calls, no execution, no async logic
        // Returns context plan with specific context sources for each route

        switch (route) {
            case "tool":
                return {
                    memory: [],
                    files: [],
                    tools: ["requested_tool"]
                };

            case "memory":
                return {
                    memory: [
                        "semantic_memory",
                        "knowledge_graph"
                    ],
                    files: [],
                    tools: []
                };

            case "file":
                return {
                    memory: [],
                    files: [
                        "uploaded_files"
                    ],
                    tools: []
                };

            case "ai":
                return {
                    memory: [
                        "semantic_memory"
                    ],
                    files: [],
                    tools: []
                };

            default:
                // Unknown route - return empty context plan
                return {
                    memory: [],
                    files: [],
                    tools: []
                };
        }
    }

    buildResponseStrategy(route) {
        // Planning ONLY - no service calls, no execution, no async logic
        // Returns response strategy based on route type

        switch (route) {
            case "tool":
                return {
                    type: "tool_response",
                    useAI: false,
                    stream: false
                };

            case "memory":
                return {
                    type: "memory_response",
                    useAI: true,
                    stream: false
                };

            case "file":
                return {
                    type: "file_response",
                    useAI: true,
                    stream: false
                };

            case "ai":
                return {
                    type: "ai_response",
                    useAI: true,
                    stream: true
                };

            default:
                // Unknown route
                return {
                    type: "unknown",
                    useAI: false,
                    stream: false
                };
        }
    }

    getAgentCapabilities() {
        // Static metadata only - no service calls, no execution, no async logic
        // Returns comprehensive capability registry for the agent system

        return {
            routes: [
                "tool",
                "memory",
                "file",
                "ai"
            ],
            tools: [
                "calculator",
                "weather",
                "currency",
                "uuid",
                "password",
                "datetime",
                "web_search"
            ],
            contexts: [
                "semantic_memory",
                "knowledge_graph",
                "uploaded_files"
            ],
            responseTypes: [
                "tool_response",
                "memory_response",
                "file_response",
                "ai_response"
            ]
        };
    }

    validateAgentCapabilities(capabilities) {
        // Validation only - no service calls, no execution, no async logic
        // Validates a capabilities object against required structure and values
        const errors = [];

        // General validation: capabilities must be an object
        if (!capabilities || typeof capabilities !== 'object' || Array.isArray(capabilities)) {
            errors.push('Capabilities must be an object');
            return {
                valid: false,
                errors: errors
            };
        }

        // Validate routes array
        if (!Array.isArray(capabilities.routes)) {
            errors.push('routes must be an array');
        } else {
            const requiredRoutes = ['tool', 'memory', 'file', 'ai'];
            const missingRoutes = requiredRoutes.filter(route => !capabilities.routes.includes(route));
            if (missingRoutes.length > 0) {
                errors.push(`Missing required routes: ${missingRoutes.join(', ')}`);
            }
        }

        // Validate tools array
        if (!Array.isArray(capabilities.tools)) {
            errors.push('tools must be an array');
        } else {
            const requiredTools = ['calculator', 'weather', 'currency', 'uuid', 'password', 'datetime', 'web_search'];
            const missingTools = requiredTools.filter(tool => !capabilities.tools.includes(tool));
            if (missingTools.length > 0) {
                errors.push(`Missing required tools: ${missingTools.join(', ')}`);
            }
        }

        // Validate contexts array
        if (!Array.isArray(capabilities.contexts)) {
            errors.push('contexts must be an array');
        } else {
            const requiredContexts = ['semantic_memory', 'knowledge_graph', 'uploaded_files'];
            const missingContexts = requiredContexts.filter(context => !capabilities.contexts.includes(context));
            if (missingContexts.length > 0) {
                errors.push(`Missing required contexts: ${missingContexts.join(', ')}`);
            }
        }

        // Validate responseTypes array
        if (!Array.isArray(capabilities.responseTypes)) {
            errors.push('responseTypes must be an array');
        } else {
            const requiredResponseTypes = ['tool_response', 'memory_response', 'file_response', 'ai_response'];
            const missingResponseTypes = requiredResponseTypes.filter(type => !capabilities.responseTypes.includes(type));
            if (missingResponseTypes.length > 0) {
                errors.push(`Missing required responseTypes: ${missingResponseTypes.join(', ')}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    exportAgentMetadata() {
        // Static metadata export - no service calls, no execution, no async logic
        // Reuses existing methods to build comprehensive metadata object
        const capabilities = this.getAgentCapabilities();
        const validation = this.validateAgentCapabilities(capabilities);

        return {
            capabilities: capabilities,
            valid: validation.valid,
            version: "8.4",
            name: "Jarvis Agent Framework"
        };
    }
}

const agentService = new AgentService();
module.exports = agentService;
