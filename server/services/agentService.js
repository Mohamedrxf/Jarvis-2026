// Agent Service - Phase 8.0B
// Agent Decision Pipeline - Structured execution plan
// No execution, planning, or reasoning implemented

const AgentDispatcher = require('./agents/AgentDispatcher');

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
        if (lowerMessage.match(/(?:what\s+is\s+my|tell\s+me\s+about\s+my|do\s+i\s+like|am\s+i\s+|where\s+do\s+i\s+(study|work|live)|what\s+do\s+i\s+(study|work)|where\s+am\s+i)/i)) {
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

    buildMultiAgentPlan(routeDecision) {
        if (routeDecision && routeDecision.route === "tool") {
            return {
                multiAgent: false,
                agents: ["tool"],
                reason: "Single tool request"
            };
        }

        if (routeDecision && routeDecision.route === "memory") {
            return {
                multiAgent: false,
                agents: ["memory"],
                reason: "Single memory request"
            };
        }

        if (routeDecision && routeDecision.route === "file") {
            return {
                multiAgent: false,
                agents: ["file"],
                reason: "Single file request"
            };
        }

        if (routeDecision && routeDecision.route === "ai") {
            return {
                multiAgent: false,
                agents: ["ai"],
                reason: "Single AI request"
            };
        }

        return {
            multiAgent: true,
            agents: [],
            reason: "Multi-agent coordination not yet implemented"
        };
    }

    buildAgentExecutionOrder(plan) {
        // Planning ONLY - no execution, no service calls, no async logic
        // Returns execution order for agents

        if (plan && plan.multiAgent) {
            // Future multi-agent support
            return {
                sequential: true,
                parallel: false,
                order: plan.agents
            };
        }

        // Single-agent plan
        const agent = plan && plan.agents && plan.agents[0] ? plan.agents[0] : "ai";
        return {
            sequential: true,
            parallel: false,
            order: [agent]
        };
    }

    buildSharedContextPlan(executionOrder) {
        // Planning ONLY - no execution, no service calls, no async logic
        // Returns shared context plan based on execution order

        const shareMemory = false;
        const shareFiles = false;
        const shareToolResults = false;

        // Check if order array exists
        const order = executionOrder && Array.isArray(executionOrder.order) ? executionOrder.order : [];

        // Determine sharing flags based on agents in order
        const hasMemory = order.includes("memory");
        const hasFile = order.includes("file");
        const hasMultipleAgents = order.length > 1;

        return {
            shareMemory: hasMemory,
            shareFiles: hasFile,
            shareToolResults: hasMultipleAgents
        };
    }

    buildExecutionPipeline(executionOrder, sharedContextPlan) {
        // Planning ONLY - no execution, no service calls, no async logic
        // Builds execution pipeline from execution order and shared context plan

        // Validate inputs
        if (!executionOrder || typeof executionOrder !== 'object') {
            return {
                sequential: false,
                parallel: false,
                stages: []
            };
        }

        if (!sharedContextPlan || typeof sharedContextPlan !== 'object') {
            return {
                sequential: executionOrder.sequential || false,
                parallel: executionOrder.parallel || false,
                stages: []
            };
        }

        // Extract execution order properties
        const sequential = executionOrder.sequential || false;
        const parallel = executionOrder.parallel || false;
        const order = executionOrder.order && Array.isArray(executionOrder.order) ? executionOrder.order : [];

        // Extract shared context plan properties
        const shareMemory = sharedContextPlan.shareMemory || false;
        const shareFiles = sharedContextPlan.shareFiles || false;
        const shareToolResults = sharedContextPlan.shareToolResults || false;

        // Build stages from order array
        const stages = order.map(agent => ({
            agent: agent,
            context: {
                memory: shareMemory,
                files: shareFiles,
                previousResults: shareToolResults
            }
        }));

        return {
            sequential: sequential,
            parallel: parallel,
            stages: stages
        };
    }

    validateExecutionPipeline(pipeline) {
        // Validation only - no execution, no service calls, no async logic
        // Validates execution pipeline structure and content
        const errors = [];

        // Validate pipeline is an object
        if (!pipeline || typeof pipeline !== 'object' || Array.isArray(pipeline)) {
            errors.push('Pipeline must be an object');
            return {
                valid: false,
                errors: errors
            };
        }

        // Validate stages is an array
        if (!Array.isArray(pipeline.stages)) {
            errors.push('Stages must be an array');
        } else {
            // Validate each stage
            const validAgents = ['tool', 'memory', 'file', 'ai'];

            pipeline.stages.forEach((stage, index) => {
                // Validate stage is an object
                if (!stage || typeof stage !== 'object') {
                    errors.push(`Stage ${index} must be an object`);
                    return;
                }

                // Validate stage has agent property
                if (!stage.hasOwnProperty('agent')) {
                    errors.push(`Stage ${index} must have an agent property`);
                }

                // Validate stage has context property
                if (!stage.hasOwnProperty('context')) {
                    errors.push(`Stage ${index} must have a context property`);
                } else {
                    // Validate context is an object
                    if (!stage.context || typeof stage.context !== 'object') {
                        errors.push(`Stage ${index} context must be an object`);
                    } else {
                        // Validate context has required properties
                        if (!stage.context.hasOwnProperty('memory')) {
                            errors.push(`Stage ${index} context must have memory property`);
                        }
                        if (!stage.context.hasOwnProperty('files')) {
                            errors.push(`Stage ${index} context must have files property`);
                        }
                        if (!stage.context.hasOwnProperty('previousResults')) {
                            errors.push(`Stage ${index} context must have previousResults property`);
                        }
                    }
                }

                // Validate agent name if present
                if (stage.agent && !validAgents.includes(stage.agent)) {
                    errors.push(`Stage ${index} has invalid agent name: ${stage.agent}. Valid agents are: ${validAgents.join(', ')}`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    buildExecutionDescriptor(pipeline) {
        // Planning ONLY - no execution, no service calls, no async logic
        // Builds execution descriptor from validated pipeline
        // Reuses existing validateExecutionPipeline method

        // Validate pipeline using existing validation
        const validation = this.validateExecutionPipeline(pipeline);

        // If invalid, return default descriptor
        if (!validation.valid) {
            return {
                ready: false,
                mode: "sequential",
                totalStages: 0,
                stages: []
            };
        }

        // If valid, build descriptor from pipeline
        const sequential = pipeline.sequential || false;
        const parallel = pipeline.parallel || false;
        const totalStages = pipeline.stages ? pipeline.stages.length : 0;

        return {
            ready: true,
            mode: parallel ? "parallel" : "sequential",
            totalStages: totalStages,
            stages: pipeline.stages || []
        };
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

    async executeSequentialPipeline(descriptor, context) {
        // Execution skeleton - executes agents using dispatcher
        // Returns execution result based on descriptor readiness

        // If descriptor is not ready, return failure
        if (!descriptor || descriptor.ready === false) {
            return {
                success: false,
                results: []
            };
        }

        // If descriptor is ready, iterate through stages and execute agents
        const results = [];
        const dispatcher = new AgentDispatcher();

        // Check if stages array exists
        if (descriptor.stages && Array.isArray(descriptor.stages)) {
            // Iterate through each stage and execute agent
            for (const stage of descriptor.stages) {
                // Use dispatcher to locate the agent
                const agent = dispatcher.dispatch({
                    route: stage.agent
                });

                if (!agent) {
                    // Agent not found
                    results.push({
                        agent: stage.agent,
                        success: false,
                        error: "Agent not found"
                    });
                } else {
                    // Agent found - execute it
                    try {
                        const result = await agent.handle(context);
                        results.push({
                            agent: stage.agent,
                            success: true,
                            output: result
                        });
                    } catch (error) {
                        results.push({
                            agent: stage.agent,
                            success: false,
                            error: error.message
                        });
                    }
                }
            }
        }

        return {
            success: true,
            results: results
        };
    }

    async executeParallelPipeline(descriptor, context) {
        // Parallel execution - executes all agents concurrently
        // Returns execution result based on descriptor readiness

        // If descriptor is not ready, return failure
        if (!descriptor || descriptor.ready === false) {
            return {
                success: false,
                results: []
            };
        }

        // If descriptor is ready, execute all stages in parallel
        const dispatcher = new AgentDispatcher();

        // Check if stages array exists
        if (descriptor.stages && Array.isArray(descriptor.stages)) {
            // Execute all stages in parallel using Promise.all
            const promises = descriptor.stages.map(async (stage) => {
                // Use dispatcher to locate the agent
                const agent = dispatcher.dispatch({
                    route: stage.agent
                });

                if (!agent) {
                    // Agent not found
                    return {
                        agent: stage.agent,
                        success: false,
                        error: "Agent not found"
                    };
                } else {
                    // Agent found - execute it
                    try {
                        const result = await agent.handle(context);
                        return {
                            agent: stage.agent,
                            success: true,
                            output: result
                        };
                    } catch (error) {
                        return {
                            agent: stage.agent,
                            success: false,
                            error: error.message
                        };
                    }
                }
            });

            // Wait for all promises to resolve
            const results = await Promise.all(promises);

            return {
                success: true,
                results: results
            };
        }

        // No stages to execute
        return {
            success: true,
            results: []
        };
    }

    buildExecutionResult(results) {
        // Planning/aggregation only - no dispatcher calls, no agent execution, no service calls, no async logic
        // Aggregates execution results from executeSequentialPipeline or executeParallelPipeline

        // Handle null/undefined results
        if (!results || !Array.isArray(results)) {
            return {
                success: false,
                completed: 0,
                failed: 0,
                total: 0,
                results: []
            };
        }

        // Count successful and failed results
        let completed = 0;
        let failed = 0;

        results.forEach(result => {
            if (result && result.success === true) {
                completed++;
            } else {
                failed++;
            }
        });

        // success is true only if every result.success === true
        const success = failed === 0;

        return {
            success: success,
            completed: completed,
            failed: failed,
            total: results.length,
            results: results
        };
    }

    validateExecutionResult(result) {
        // Validation only - no execution, no service calls, no dispatcher calls, no async logic
        // Validates execution result object produced by buildExecutionResult()
        const errors = [];

        // Validate result is an object
        if (!result || typeof result !== 'object' || Array.isArray(result)) {
            errors.push('Result must be an object');
            return {
                valid: false,
                errors: errors
            };
        }

        // Validate success is a boolean
        if (!result.hasOwnProperty('success') || typeof result.success !== 'boolean') {
            errors.push('success must be a boolean');
        }

        // Validate completed is a number
        if (!result.hasOwnProperty('completed') || typeof result.completed !== 'number') {
            errors.push('completed must be a number');
        }

        // Validate failed is a number
        if (!result.hasOwnProperty('failed') || typeof result.failed !== 'number') {
            errors.push('failed must be a number');
        }

        // Validate total is a number
        if (!result.hasOwnProperty('total') || typeof result.total !== 'number') {
            errors.push('total must be a number');
        }

        // Validate results is an array
        if (!result.hasOwnProperty('results') || !Array.isArray(result.results)) {
            errors.push('results must be an array');
        }

        // Validate completed + failed equals total (only if all are numbers)
        if (typeof result.completed === 'number' &&
            typeof result.failed === 'number' &&
            typeof result.total === 'number') {
            if (result.completed + result.failed !== result.total) {
                errors.push(`completed (${result.completed}) + failed (${result.failed}) must equal total (${result.total})`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    buildExecutionReport(result) {
        // Planning/aggregation only - no execution, no dispatcher calls, no service calls, no async logic
        // Builds execution report from validated execution result
        // Reuses validateExecutionResult() for validation

        // Validate the result using existing validation method
        const validation = this.validateExecutionResult(result);

        // If validation fails, return not ready with null summary
        if (!validation.valid) {
            return {
                ready: false,
                summary: null
            };
        }

        // If validation succeeds, build summary
        return {
            ready: true,
            summary: {
                success: result.success,
                totalAgents: result.total,
                completedAgents: result.completed,
                failedAgents: result.failed
            }
        };
    }

    buildAgentSummary(report) {
        // Planning only - no execution, no dispatcher calls, no service calls, no async logic
        // Builds agent summary from execution report produced by buildExecutionReport()
        // Reuses buildExecutionReport() for report generation

        // Handle null/undefined report or report not ready
        if (!report || report.ready === false) {
            return {
                valid: false,
                agents: []
            };
        }

        // Report is valid, extract summary data
        return {
            valid: true,
            agents: report.summary.totalAgents,
            successful: report.summary.completedAgents,
            failed: report.summary.failedAgents,
            overallSuccess: report.summary.success
        };
    }

    buildFinalResponse(agentSummary) {
        // Pure transformation only - no execution, no async, no service calls, no dispatcher usage
        // Transforms execution summary into final response format

        // Validate input
        if (!agentSummary || typeof agentSummary !== 'object') {
            return {
                success: false,
                response: "Invalid execution summary",
                metadata: null
            };
        }

        // Check if agentSummary has required properties
        if (!agentSummary.hasOwnProperty('success') ||
            !agentSummary.hasOwnProperty('completed') ||
            !agentSummary.hasOwnProperty('failed') ||
            !agentSummary.hasOwnProperty('total')) {
            return {
                success: false,
                response: "Invalid execution summary",
                metadata: null
            };
        }

        // Determine response message based on success
        const response = agentSummary.success === true
            ? "Execution completed successfully"
            : "Execution completed with errors";

        // Build metadata
        const metadata = {
            completed: agentSummary.completed,
            failed: agentSummary.failed,
            total: agentSummary.total
        };

        return {
            success: agentSummary.success,
            response: response,
            metadata: metadata
        };
    }

    validateFinalResponse(response) {
        // Validation only - no execution, no dispatcher calls, no service calls, no async logic
        // Validates response object produced by buildFinalResponse()
        const errors = [];

        // Validate response is an object
        if (!response || typeof response !== 'object' || Array.isArray(response)) {
            errors.push('Response must be an object');
            return {
                valid: false,
                errors: errors
            };
        }

        // Validate success is a boolean
        if (!response.hasOwnProperty('success') || typeof response.success !== 'boolean') {
            errors.push('success must be a boolean');
        }

        // Validate response.response is a string
        if (!response.hasOwnProperty('response') || typeof response.response !== 'string') {
            errors.push('response must be a string');
        }

        // Validate metadata
        if (!response.hasOwnProperty('metadata')) {
            errors.push('metadata must be present');
        } else if (response.metadata !== null) {
            // If metadata is not null, it must be an object with required properties
            if (typeof response.metadata !== 'object' || Array.isArray(response.metadata)) {
                errors.push('metadata must be null or an object');
            } else {
                // Validate metadata properties
                if (!response.metadata.hasOwnProperty('completed') || typeof response.metadata.completed !== 'number') {
                    errors.push('metadata.completed must be a number');
                }
                if (!response.metadata.hasOwnProperty('failed') || typeof response.metadata.failed !== 'number') {
                    errors.push('metadata.failed must be a number');
                }
                if (!response.metadata.hasOwnProperty('total') || typeof response.metadata.total !== 'number') {
                    errors.push('metadata.total must be a number');
                }

                // Validate completed + failed equals total (only if all are numbers)
                if (typeof response.metadata.completed === 'number' &&
                    typeof response.metadata.failed === 'number' &&
                    typeof response.metadata.total === 'number') {
                    if (response.metadata.completed + response.metadata.failed !== response.metadata.total) {
                        errors.push(`metadata.completed (${response.metadata.completed}) + metadata.failed (${response.metadata.failed}) must equal metadata.total (${response.metadata.total})`);
                    }
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    buildExecutionPlan(routeDecision) {
        // Planning ONLY - no execution, no service calls, no async logic
        // Builds execution plan from route decision
        // Returns plan object with route, steps, and context

        // Handle null/undefined routeDecision
        if (!routeDecision || typeof routeDecision !== 'object') {
            return {
                route: 'ai',
                steps: ['execute_ai_agent'],
                context: {
                    memory: true,
                    files: false,
                    tools: false
                }
            };
        }

        // Extract route from decision
        const route = routeDecision.route || 'ai';

        // Build steps based on route
        let steps = [];
        switch (route) {
            case 'tool':
                steps = ['validate_tool', 'execute_tool', 'format_tool_response'];
                break;
            case 'memory':
                steps = ['retrieve_memory', 'process_memory', 'format_memory_response'];
                break;
            case 'file':
                steps = ['locate_files', 'process_files', 'format_file_response'];
                break;
            case 'ai':
            default:
                steps = ['prepare_context', 'execute_ai', 'format_ai_response'];
                break;
        }

        // Build context requirements
        const contextRequirements = this.buildContextRequirements(route);

        return {
            route: route,
            steps: steps,
            context: contextRequirements
        };
    }

    validateExecutionPlan(plan) {
        // Validation only - no execution, no service calls, no async logic
        // Validates execution plan structure and content
        const errors = [];

        // Validate plan is an object
        if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
            errors.push('Plan must be an object');
            return {
                valid: false,
                errors: errors,
                error: errors[0]
            };
        }

        // Validate route property
        if (!plan.hasOwnProperty('route')) {
            errors.push('Plan must have a route property');
        } else if (typeof plan.route !== 'string') {
            errors.push('Plan route must be a string');
        }

        // Validate steps property
        if (!plan.hasOwnProperty('steps')) {
            errors.push('Plan must have a steps property');
        } else if (!Array.isArray(plan.steps)) {
            errors.push('Plan steps must be an array');
        } else if (plan.steps.length === 0) {
            errors.push('Plan steps must not be empty');
        }

        // Validate context property
        if (!plan.hasOwnProperty('context')) {
            errors.push('Plan must have a context property');
        } else if (typeof plan.context !== 'object' || plan.context === null || Array.isArray(plan.context)) {
            errors.push('Plan context must be an object');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            error: errors.length > 0 ? errors[0] : null
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
