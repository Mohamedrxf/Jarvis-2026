// Planner Agent - Phase 12.1
// FIRST intelligence layer before execution
// Planning ONLY - no execution, no tool calls, no Gemini calls, no direct memory access

const agentService = require('./agentService');

class PlannerAgent {
    /**
     * Analyze user message and produce execution plan
     * @param {Object} context - Context object containing:
     *   - message: User message to analyze
     *   - userId: Optional user ID for context
     *   - conversationHistory: Optional conversation history
     * @returns {Object} Execution plan with intent, agents, dependencies, and mode
     */
    analyze(context = {}) {
        // Validate input
        if (!context || typeof context !== 'object') {
            return this._buildErrorPlan('Invalid context provided');
        }

        const { message, userId = null, conversationHistory = [] } = context;

        // Validate message
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return this._buildErrorPlan('Empty or invalid message');
        }

        // Step 1: Determine user intent
        const intent = this._determineIntent(message.trim());

        // Step 2: Get route decision from existing agent service routing logic
        const routeDecision = agentService.analyzeRequest(message);

        // Step 3: Determine required agents based on route
        const requiredAgents = this._determineRequiredAgents(routeDecision.route);

        // Step 4: Determine dependencies between agents
        const dependencies = this._determineDependencies(requiredAgents, routeDecision.route);

        // Step 5: Determine execution mode
        const executionMode = this._determineExecutionMode(requiredAgents, dependencies);

        // Step 6: Determine expected output type
        const expectedOutputType = this._determineOutputType(routeDecision.route, intent);

        // Step 7: Build execution plan
        const executionPlan = {
            intent: intent,
            route: routeDecision.route,
            confidence: routeDecision.confidence,
            reason: routeDecision.reason,
            agents: requiredAgents,
            executionOrder: this._buildExecutionOrder(requiredAgents, dependencies),
            dependencies: dependencies,
            executionMode: executionMode,
            expectedOutputType: expectedOutputType,
            contextRequirements: agentService.buildContextRequirements(routeDecision.route),
            contextPlan: agentService.buildContextPlan(routeDecision.route),
            responseStrategy: agentService.buildResponseStrategy(routeDecision.route),
            ready: true
        };

        return executionPlan;
    }

    /**
     * Build execution plan from route decision (convenience method)
     * @param {Object} routeDecision - Route decision from analyzeRequest
     * @returns {Object} Execution plan
     */
    buildPlan(routeDecision) {
        if (!routeDecision || typeof routeDecision !== 'object') {
            return this._buildErrorPlan('Invalid route decision');
        }

        const route = routeDecision.route || 'ai';
        const requiredAgents = this._determineRequiredAgents(route);
        const dependencies = this._determineDependencies(requiredAgents, route);
        const executionMode = this._determineExecutionMode(requiredAgents, dependencies);

        return {
            route: route,
            confidence: routeDecision.confidence || 0.7,
            reason: routeDecision.reason || 'Default routing',
            agents: requiredAgents,
            executionOrder: this._buildExecutionOrder(requiredAgents, dependencies),
            dependencies: dependencies,
            executionMode: executionMode,
            expectedOutputType: this._determineOutputType(route, 'unknown'),
            contextRequirements: agentService.buildContextRequirements(route),
            contextPlan: agentService.buildContextPlan(route),
            responseStrategy: agentService.buildResponseStrategy(route),
            ready: true
        };
    }

    /**
     * Validate execution plan structure and content
     * @param {Object} plan - Execution plan to validate
     * @returns {Object} Validation result with valid flag and errors array
     */
    validatePlan(plan) {
        const errors = [];

        // Validate plan is an object
        if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
            return {
                valid: false,
                errors: ['Plan must be an object'],
                error: 'Plan must be an object'
            };
        }

        // Validate required properties
        if (!plan.hasOwnProperty('intent')) {
            errors.push('Plan must have an intent property');
        }

        if (!plan.hasOwnProperty('route')) {
            errors.push('Plan must have a route property');
        } else if (typeof plan.route !== 'string') {
            errors.push('Plan route must be a string');
        } else {
            const validRoutes = ['tool', 'memory', 'file', 'ai', 'unknown'];
            if (!validRoutes.includes(plan.route)) {
                errors.push(`Invalid route: ${plan.route}. Must be one of: ${validRoutes.join(', ')}`);
            }
        }

        if (!plan.hasOwnProperty('agents')) {
            errors.push('Plan must have an agents property');
        } else if (!Array.isArray(plan.agents)) {
            errors.push('Plan agents must be an array');
        } else if (plan.agents.length === 0) {
            errors.push('Plan agents must not be empty');
        } else {
            // Validate agent names
            const validAgents = ['tool', 'memory', 'file', 'ai'];
            plan.agents.forEach((agent, index) => {
                if (!validAgents.includes(agent)) {
                    errors.push(`Invalid agent at index ${index}: ${agent}. Must be one of: ${validAgents.join(', ')}`);
                }
            });
        }

        if (!plan.hasOwnProperty('executionMode')) {
            errors.push('Plan must have an executionMode property');
        } else {
            const validModes = ['sequential', 'parallel', 'single'];
            if (!validModes.includes(plan.executionMode)) {
                errors.push(`Invalid executionMode: ${plan.executionMode}. Must be one of: ${validModes.join(', ')}`);
            }
        }

        if (!plan.hasOwnProperty('expectedOutputType')) {
            errors.push('Plan must have an expectedOutputType property');
        } else {
            const validOutputTypes = ['text', 'json', 'tool_result', 'memory_update', 'file_summary'];
            if (!validOutputTypes.includes(plan.expectedOutputType)) {
                errors.push(`Invalid expectedOutputType: ${plan.expectedOutputType}. Must be one of: ${validOutputTypes.join(', ')}`);
            }
        }

        if (!plan.hasOwnProperty('dependencies')) {
            errors.push('Plan must have a dependencies property');
        } else if (typeof plan.dependencies !== 'object' || Array.isArray(plan.dependencies)) {
            errors.push('Plan dependencies must be an object');
        }

        if (!plan.hasOwnProperty('executionOrder')) {
            errors.push('Plan must have an executionOrder property');
        } else if (typeof plan.executionOrder !== 'object' || Array.isArray(plan.executionOrder)) {
            errors.push('Plan executionOrder must be an object');
        } else {
            if (!plan.executionOrder.hasOwnProperty('sequential')) {
                errors.push('Plan executionOrder must have sequential property');
            }
            if (!plan.executionOrder.hasOwnProperty('parallel')) {
                errors.push('Plan executionOrder must have parallel property');
            }
            if (!plan.executionOrder.hasOwnProperty('order')) {
                errors.push('Plan executionOrder must have order property');
            } else if (!Array.isArray(plan.executionOrder.order)) {
                errors.push('Plan executionOrder order must be an array');
            }
        }

        if (!plan.hasOwnProperty('contextRequirements')) {
            errors.push('Plan must have a contextRequirements property');
        } else if (typeof plan.contextRequirements !== 'object' || Array.isArray(plan.contextRequirements)) {
            errors.push('Plan contextRequirements must be an object');
        }

        if (!plan.hasOwnProperty('ready')) {
            errors.push('Plan must have a ready property');
        } else if (typeof plan.ready !== 'boolean') {
            errors.push('Plan ready must be a boolean');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            error: errors.length > 0 ? errors[0] : null
        };
    }

    /**
     * Determine user intent from message
     * @private
     */
    _determineIntent(message) {
        const lowerMessage = message.toLowerCase().trim();

        // Greeting patterns
        if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|howdy|what'?s?\s+up)/i.test(lowerMessage)) {
            return 'greeting';
        }

        // Calculation patterns (check before question to catch "What is 5 * 10?")
        if (/^(calculate|compute)/i.test(lowerMessage) ||
            /^(what\s+is\s+[\d\s+*/().-]+)$/i.test(lowerMessage) ||
            /^[\d\s+*/().-]+$/i.test(lowerMessage) ||
            /^(convert|currency)\s+\d/i.test(lowerMessage)) {
            return 'calculation';
        }

        // Weather patterns
        if (/weather\s+(in|for|at)/i.test(lowerMessage)) {
            return 'weather';
        }

        // Memory patterns
        if (/(remember|save|store|memorize|recall|what\s+do\s+you\s+remember|my\s+name\s+is|i\s+am\s+called|i\s+work\s+at|i\s+live\s+in|where\s+do\s+i\s+(work|study|live)|what\s+do\s+i\s+(work|study)|where\s+am\s+i)/i.test(lowerMessage)) {
            return 'memory';
        }

        // File patterns (check before command to catch "Get my files")
        if (/(upload|attach|add)\s+(my\s+)?file$/i.test(lowerMessage) ||
            /^(search|find|show|list|get|delete)\s+(my\s+)?files?$/i.test(lowerMessage) ||
            /^(read|analyze|summarize|extract)\s+(my\s+)?(file|document|pdf|doc)$/i.test(lowerMessage)) {
            return 'file';
        }

        // Web search patterns
        if (/^(web\s+search|search\s+for|search\s+the\s+web|look\s+up)/i.test(lowerMessage)) {
            return 'web_search';
        }

        // Coding patterns
        if (/(write|create|build|implement|code|program|develop|debug|fix)\s+(a\s+)?(function|code|program|script|app|application|website|api)/i.test(lowerMessage)) {
            return 'coding';
        }

        // Conversation patterns (check before question to catch "Tell me about...")
        if (/(tell\s+me\s+about|what\s+do\s+you\s+think|opinion|thoughts|feelings|chat\s+with\s+me|let'?s\s+talk)/i.test(lowerMessage)) {
            return 'conversation';
        }

        // Question patterns (general questions)
        if (lowerMessage.startsWith('?') || /^(what|who|where|when|why|how|is|are|do|does|can|could|would|should|explain|describe)/i.test(lowerMessage)) {
            return 'question';
        }

        // Command patterns (general commands)
        if (/^(do|execute|run|perform|start|stop|cancel|delete|remove|show|list|find|search)/i.test(lowerMessage)) {
            return 'command';
        }

        // Default to unknown
        return 'unknown';
    }

    /**
     * Determine required agents based on route
     * @private
     */
    _determineRequiredAgents(route) {
        switch (route) {
            case 'tool':
                return ['tool'];
            case 'memory':
                return ['memory'];
            case 'file':
                return ['file'];
            case 'ai':
            default:
                return ['ai'];
        }
    }

    /**
     * Determine dependencies between agents
     * @private
     */
    _determineDependencies(agents, route) {
        const dependencies = {
            sequential: [],
            parallel: [],
            hasDependencies: false
        };

        // Single agent - no dependencies
        if (agents.length === 1) {
            return dependencies;
        }

        // Multi-agent scenarios (future-proofing)
        // Example: FileAgent → AIAgent (file content → AI analysis)
        if (agents.includes('file') && agents.includes('ai')) {
            dependencies.sequential = ['file', 'ai'];
            dependencies.hasDependencies = true;
        }
        // Example: MemoryAgent → AIAgent (memory context → AI response)
        else if (agents.includes('memory') && agents.includes('ai')) {
            dependencies.sequential = ['memory', 'ai'];
            dependencies.hasDependencies = true;
        }
        // Example: ToolAgent → AIAgent (tool result → AI formatting)
        else if (agents.includes('tool') && agents.includes('ai')) {
            dependencies.sequential = ['tool', 'ai'];
            dependencies.hasDependencies = true;
        }

        return dependencies;
    }

    /**
     * Determine execution mode based on agents and dependencies
     * @private
     */
    _determineExecutionMode(agents, dependencies) {
        // Single agent - single mode
        if (agents.length === 1) {
            return 'single';
        }

        // Multiple agents with dependencies - sequential
        if (dependencies.hasDependencies && dependencies.sequential.length > 0) {
            return 'sequential';
        }

        // Multiple agents without dependencies - parallel (future)
        if (agents.length > 1) {
            return 'parallel';
        }

        // Default to single
        return 'single';
    }

    /**
     * Determine expected output type based on route and intent
     * @private
     */
    _determineOutputType(route, intent) {
        switch (route) {
            case 'tool':
                return 'tool_result';
            case 'memory':
                if (intent === 'memory') {
                    return 'memory_update';
                }
                return 'text';
            case 'file':
                return 'file_summary';
            case 'ai':
            default:
                return 'text';
        }
    }

    /**
     * Build execution order from agents and dependencies
     * @private
     */
    _buildExecutionOrder(agents, dependencies) {
        const sequential = true;
        const parallel = false;

        // If there are dependencies, use the dependency order
        if (dependencies.hasDependencies && dependencies.sequential.length > 0) {
            return {
                sequential: sequential,
                parallel: parallel,
                order: dependencies.sequential
            };
        }

        // Otherwise, use the agents array as-is
        return {
            sequential: sequential,
            parallel: parallel,
            order: agents
        };
    }

    /**
     * Build error plan for invalid inputs
     * @private
     */
    _buildErrorPlan(errorMessage) {
        return {
            intent: 'unknown',
            route: 'ai',
            confidence: 0.0,
            reason: errorMessage,
            agents: ['ai'],
            executionOrder: {
                sequential: true,
                parallel: false,
                order: ['ai']
            },
            dependencies: {
                sequential: [],
                parallel: [],
                hasDependencies: false
            },
            executionMode: 'single',
            expectedOutputType: 'text',
            contextRequirements: {
                memory: true,
                files: false,
                tools: false
            },
            contextPlan: {
                memory: ['semantic_memory'],
                files: [],
                tools: []
            },
            responseStrategy: {
                type: 'ai_response',
                useAI: true,
                stream: true
            },
            ready: false,
            error: errorMessage
        };
    }

    /**
     * Get supported intents (for documentation/testing)
     * @returns {Array} List of supported intents
     */
    getSupportedIntents() {
        return [
            'greeting',
            'question',
            'calculation',
            'weather',
            'memory',
            'file',
            'web_search',
            'coding',
            'conversation',
            'command',
            'unknown'
        ];
    }

    /**
     * Get supported execution modes (for documentation/testing)
     * @returns {Array} List of supported execution modes
     */
    getSupportedExecutionModes() {
        return ['sequential', 'parallel', 'single'];
    }

    /**
     * Get supported output types (for documentation/testing)
     * @returns {Array} List of supported output types
     */
    getSupportedOutputTypes() {
        return ['text', 'json', 'tool_result', 'memory_update', 'file_summary'];
    }

    /**
     * Get supported routes (for documentation/testing)
     * @returns {Array} List of supported routes
     */
    getSupportedRoutes() {
        return ['tool', 'memory', 'file', 'ai', 'unknown'];
    }
}

// Export singleton instance
const plannerAgent = new PlannerAgent();

module.exports = plannerAgent;