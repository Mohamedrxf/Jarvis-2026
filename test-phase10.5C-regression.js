// Test Phase 10.5C - Master Regression Test Suite
// Comprehensive regression tests for Phase 8, 9, and 10 implementations
// Verifies public API stability and backward compatibility
// No production code changes - tests only

const agentService = require('./server/services/agentService');
const BaseAgent = require('./server/services/agents/BaseAgent');
const ToolAgent = require('./server/services/agents/ToolAgent');
const MemoryAgent = require('./server/services/agents/MemoryAgent');
const FileAgent = require('./server/services/agents/FileAgent');
const AIAgent = require('./server/services/agents/AIAgent');
const AgentRegistry = require('./server/services/agents/AgentRegistry');
const AgentDispatcher = require('./server/services/agents/AgentDispatcher');

console.log('=== Phase 10.5C: Master Regression Test Suite ===\n');
console.log('Testing Phase 8, 9, and 10 Public APIs\n');

let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
    try {
        testFn();
        console.log(`✓ ${description}`);
        testsPassed++;
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}\n`);
        testsFailed++;
    }
}

function assertEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
        throw new Error(`${message}\n  Expected: ${expectedStr}\n  Actual: ${actualStr}`);
    }
}

function assertTrue(value, message) {
    if (!value) {
        throw new Error(message || 'Expected true but got false');
    }
}

function assertFalse(value, message) {
    if (value) {
        throw new Error(message || 'Expected false but got true');
    }
}

function assertDefined(value, message) {
    if (value === undefined || value === null) {
        throw new Error(message || 'Expected value to be defined');
    }
}

// ============================================
// PHASE 8: Agent Service Public APIs
// ============================================

console.log('--- Phase 8: Agent Service APIs ---\n');

// Test 1: analyzeRequest() - tool route
test('Phase 8: analyzeRequest() - tool route (weather)', () => {
    const result = agentService.analyzeRequest("What's the weather in London?");
    assertEqual(result.route, 'tool', 'Should route to tool');
    assertEqual(result.target, 'weather', 'Should target weather');
    assertEqual(result.confidence, 0.95, 'Should have high confidence');
    assertDefined(result.reason, 'Should have reason');
});

// Test 2: analyzeRequest() - memory route
test('Phase 8: analyzeRequest() - memory route', () => {
    const result = agentService.analyzeRequest("Remember that I like pizza");
    assertEqual(result.route, 'memory', 'Should route to memory');
    assertEqual(result.confidence, 0.95, 'Should have high confidence');
});

// Test 3: analyzeRequest() - file route
test('Phase 8: analyzeRequest() - file route', () => {
    const result = agentService.analyzeRequest("Show my files");
    assertEqual(result.route, 'file', 'Should route to file');
    assertEqual(result.confidence, 0.95, 'Should have high confidence');
});

// Test 4: analyzeRequest() - AI route
test('Phase 8: analyzeRequest() - AI route', () => {
    const result = agentService.analyzeRequest("Hello, how are you?");
    assertEqual(result.route, 'ai', 'Should route to AI');
    assertEqual(result.confidence, 0.7, 'Should have default confidence');
});

// Test 5: analyzeRequest() - invalid input
test('Phase 8: analyzeRequest() - invalid input handling', () => {
    const result = agentService.analyzeRequest("");
    assertEqual(result.route, 'ai', 'Should default to AI');
    assertEqual(result.confidence, 0.5, 'Should have low confidence');
    assertTrue(result.reason.includes('Invalid'), 'Should indicate invalid');
});

// Test 6: buildExecutionPlan() - tool route
test('Phase 8: buildExecutionPlan() - tool route', () => {
    const routeDecision = { route: 'tool', target: 'weather' };
    const plan = agentService.buildExecutionPlan(routeDecision);
    assertEqual(plan.route, 'tool', 'Should have tool route');
    assertTrue(Array.isArray(plan.steps), 'Should have steps array');
    assertTrue(plan.steps.length > 0, 'Should have steps');
    assertDefined(plan.context, 'Should have context');
});

// Test 7: buildExecutionPlan() - null input
test('Phase 8: buildExecutionPlan() - null input handling', () => {
    const plan = agentService.buildExecutionPlan(null);
    assertEqual(plan.route, 'ai', 'Should default to AI');
    assertTrue(Array.isArray(plan.steps), 'Should have steps array');
    assertDefined(plan.context, 'Should have context');
});

// Test 8: validateExecutionPlan() - valid plan
test('Phase 8: validateExecutionPlan() - valid plan', () => {
    const plan = {
        route: 'tool',
        steps: ['validate_tool', 'execute_tool'],
        context: { memory: false, files: false, tools: true }
    };
    const validation = agentService.validateExecutionPlan(plan);
    assertTrue(validation.valid, 'Should be valid');
    assertTrue(validation.errors.length === 0, 'Should have no errors');
});

// Test 9: validateExecutionPlan() - invalid plan
test('Phase 8: validateExecutionPlan() - invalid plan', () => {
    const validation = agentService.validateExecutionPlan(null);
    assertFalse(validation.valid, 'Should be invalid');
    assertTrue(validation.errors.length > 0, 'Should have errors');
});

// Test 10: buildContextRequirements() - all routes
test('Phase 8: buildContextRequirements() - all routes', () => {
    const toolContext = agentService.buildContextRequirements('tool');
    assertEqual(toolContext.tools, true, 'Tool route should need tools');
    assertEqual(toolContext.memory, false, 'Tool route should not need memory');

    const memoryContext = agentService.buildContextRequirements('memory');
    assertEqual(memoryContext.memory, true, 'Memory route should need memory');
    assertEqual(memoryContext.tools, false, 'Memory route should not need tools');

    const fileContext = agentService.buildContextRequirements('file');
    assertEqual(fileContext.files, true, 'File route should need files');

    const aiContext = agentService.buildContextRequirements('ai');
    assertEqual(aiContext.memory, true, 'AI route should need memory');
});

// Test 11: buildContextPlan() - all routes
test('Phase 8: buildContextPlan() - all routes', () => {
    const toolPlan = agentService.buildContextPlan('tool');
    assertTrue(Array.isArray(toolPlan.tools), 'Should have tools array');
    assertEqual(toolPlan.tools[0], 'requested_tool', 'Should have requested_tool');

    const memoryPlan = agentService.buildContextPlan('memory');
    assertTrue(Array.isArray(memoryPlan.memory), 'Should have memory array');
    assertTrue(memoryPlan.memory.length > 0, 'Should have memory sources');

    const aiPlan = agentService.buildContextPlan('ai');
    assertTrue(Array.isArray(aiPlan.memory), 'Should have memory array');
});

// Test 12: buildResponseStrategy() - all routes
test('Phase 8: buildResponseStrategy() - all routes', () => {
    const toolStrategy = agentService.buildResponseStrategy('tool');
    assertEqual(toolStrategy.type, 'tool_response', 'Should be tool_response');
    assertFalse(toolStrategy.useAI, 'Should not use AI');
    assertFalse(toolStrategy.stream, 'Should not stream');

    const aiStrategy = agentService.buildResponseStrategy('ai');
    assertEqual(aiStrategy.type, 'ai_response', 'Should be ai_response');
    assertTrue(aiStrategy.useAI, 'Should use AI');
    assertTrue(aiStrategy.stream, 'Should stream');
});

// Test 13: getAgentCapabilities()
test('Phase 8: getAgentCapabilities()', () => {
    const capabilities = agentService.getAgentCapabilities();
    assertTrue(Array.isArray(capabilities.routes), 'Should have routes array');
    assertTrue(Array.isArray(capabilities.tools), 'Should have tools array');
    assertTrue(Array.isArray(capabilities.contexts), 'Should have contexts array');
    assertTrue(Array.isArray(capabilities.responseTypes), 'Should have responseTypes array');
    assertTrue(capabilities.routes.length > 0, 'Should have routes');
    assertTrue(capabilities.tools.length > 0, 'Should have tools');
});

// Test 14: validateAgentCapabilities() - valid
test('Phase 8: validateAgentCapabilities() - valid capabilities', () => {
    const capabilities = agentService.getAgentCapabilities();
    const validation = agentService.validateAgentCapabilities(capabilities);
    assertTrue(validation.valid, 'Should be valid');
    assertTrue(validation.errors.length === 0, 'Should have no errors');
});

// Test 15: validateAgentCapabilities() - invalid
test('Phase 8: validateAgentCapabilities() - invalid capabilities', () => {
    const validation = agentService.validateAgentCapabilities(null);
    assertFalse(validation.valid, 'Should be invalid');
    assertTrue(validation.errors.length > 0, 'Should have errors');
});

// Test 16: exportAgentMetadata()
test('Phase 8: exportAgentMetadata()', () => {
    const metadata = agentService.exportAgentMetadata();
    assertDefined(metadata.capabilities, 'Should have capabilities');
    assertDefined(metadata.valid, 'Should have valid flag');
    assertDefined(metadata.version, 'Should have version');
    assertDefined(metadata.name, 'Should have name');
    assertEqual(metadata.name, 'Jarvis Agent Framework', 'Should have correct name');
});

// ============================================
// PHASE 9: Agent Classes
// ============================================

console.log('\n--- Phase 9: Agent Classes ---\n');

// Test 17: BaseAgent - interface
test('Phase 9: BaseAgent - interface definition', () => {
    assertDefined(BaseAgent, 'BaseAgent should be defined');
    assertTrue(typeof BaseAgent === 'function', 'BaseAgent should be a class');

    // Verify interface methods exist
    const agent = new BaseAgent();
    assertDefined(agent.getName, 'Should have getName method');
    assertDefined(agent.canHandle, 'Should have canHandle method');
    assertDefined(agent.handle, 'Should have handle method');
});

// Test 18: ToolAgent - instantiation and interface
test('Phase 9: ToolAgent - instantiation and interface', () => {
    const agent = new ToolAgent();
    assertEqual(agent.getName(), 'tool', 'Should have correct name');
    assertDefined(agent.canHandle, 'Should have canHandle method');
    assertDefined(agent.handle, 'Should have handle method');

    const canHandle = agent.canHandle({ route: 'tool' });
    assertTrue(canHandle, 'Should handle tool route');

    const cannotHandle = agent.canHandle({ route: 'ai' });
    assertFalse(cannotHandle, 'Should not handle AI route');
});

// Test 19: MemoryAgent - instantiation and interface
test('Phase 9: MemoryAgent - instantiation and interface', () => {
    const agent = new MemoryAgent();
    assertEqual(agent.getName(), 'memory', 'Should have correct name');
    assertDefined(agent.canHandle, 'Should have canHandle method');
    assertDefined(agent.handle, 'Should have handle method');

    const canHandle = agent.canHandle({ route: 'memory' });
    assertTrue(canHandle, 'Should handle memory route');
});

// Test 20: FileAgent - instantiation and interface
test('Phase 9: FileAgent - instantiation and interface', () => {
    const agent = new FileAgent();
    assertEqual(agent.getName(), 'file', 'Should have correct name');
    assertDefined(agent.canHandle, 'Should have canHandle method');
    assertDefined(agent.handle, 'Should have handle method');

    const canHandle = agent.canHandle({ route: 'file' });
    assertTrue(canHandle, 'Should handle file route');
});

// Test 21: AIAgent - instantiation and interface
test('Phase 9: AIAgent - instantiation and interface', () => {
    const agent = new AIAgent();
    assertEqual(agent.getName(), 'ai', 'Should have correct name');
    assertDefined(agent.canHandle, 'Should have canHandle method');
    assertDefined(agent.handle, 'Should have handle method');

    const canHandle = agent.canHandle({ route: 'ai' });
    assertTrue(canHandle, 'Should handle AI route');
});

// Test 22: AgentRegistry - getAgents()
test('Phase 9: AgentRegistry - getAgents()', () => {
    const agents = AgentRegistry.getAgents();
    assertTrue(Array.isArray(agents), 'Should return array');
    assertEqual(agents.length, 4, 'Should have 4 agents');
    assertTrue(agents.every(a => typeof a.getName === 'function'), 'All should have getName');
});

// Test 23: AgentRegistry - getAgent()
test('Phase 9: AgentRegistry - getAgent()', () => {
    const toolAgent = AgentRegistry.getAgent('tool');
    assertDefined(toolAgent, 'Should find tool agent');
    assertEqual(toolAgent.getName(), 'tool', 'Should be tool agent');

    const memoryAgent = AgentRegistry.getAgent('memory');
    assertDefined(memoryAgent, 'Should find memory agent');
    assertEqual(memoryAgent.getName(), 'memory', 'Should be memory agent');

    const nonexistent = AgentRegistry.getAgent('nonexistent');
    assertEqual(nonexistent, null, 'Should return null for nonexistent');
});

// Test 24: AgentDispatcher - dispatch()
test('Phase 9: AgentDispatcher - dispatch()', () => {
    const dispatcher = new AgentDispatcher();

    const toolAgent = dispatcher.dispatch({ route: 'tool' });
    assertDefined(toolAgent, 'Should dispatch to tool agent');
    assertEqual(toolAgent.getName(), 'tool', 'Should be tool agent');

    const memoryAgent = dispatcher.dispatch({ route: 'memory' });
    assertDefined(memoryAgent, 'Should dispatch to memory agent');
    assertEqual(memoryAgent.getName(), 'memory', 'Should be memory agent');

    const aiAgent = dispatcher.dispatch({ route: 'ai' });
    assertDefined(aiAgent, 'Should dispatch to AI agent');
    assertEqual(aiAgent.getName(), 'ai', 'Should be AI agent');
});

// Test 25: AgentDispatcher - invalid route
test('Phase 9: AgentDispatcher - invalid route handling', () => {
    const dispatcher = new AgentDispatcher();
    const agent = dispatcher.dispatch({ route: 'invalid' });
    assertEqual(agent, null, 'Should return null for invalid route');
});

// ============================================
// PHASE 10: Multi-Agent Pipeline
// ============================================

console.log('\n--- Phase 10: Multi-Agent Pipeline APIs ---\n');

// Test 26: buildMultiAgentPlan() - single agent routes
test('Phase 10: buildMultiAgentPlan() - single agent routes', () => {
    const toolPlan = agentService.buildMultiAgentPlan({ route: 'tool' });
    assertFalse(toolPlan.multiAgent, 'Tool should not be multi-agent');
    assertEqual(toolPlan.agents[0], 'tool', 'Should have tool agent');

    const memoryPlan = agentService.buildMultiAgentPlan({ route: 'memory' });
    assertFalse(memoryPlan.multiAgent, 'Memory should not be multi-agent');

    const aiPlan = agentService.buildMultiAgentPlan({ route: 'ai' });
    assertFalse(aiPlan.multiAgent, 'AI should not be multi-agent');
});

// Test 27: buildMultiAgentPlan() - unknown route
test('Phase 10: buildMultiAgentPlan() - unknown route', () => {
    const plan = agentService.buildMultiAgentPlan({ route: 'unknown' });
    assertTrue(plan.multiAgent, 'Unknown should be multi-agent');
    assertEqual(plan.agents.length, 0, 'Should have empty agents');
});

// Test 28: buildAgentExecutionOrder() - single agent
test('Phase 10: buildAgentExecutionOrder() - single agent', () => {
    const plan = { multiAgent: false, agents: ['tool'] };
    const order = agentService.buildAgentExecutionOrder(plan);
    assertEqual(order.sequential, true, 'Should be sequential');
    assertEqual(order.parallel, false, 'Should not be parallel');
    assertEqual(order.order[0], 'tool', 'Should have tool in order');
});

// Test 29: buildAgentExecutionOrder() - multi agent
test('Phase 10: buildAgentExecutionOrder() - multi agent', () => {
    const plan = { multiAgent: true, agents: ['memory', 'ai'] };
    const order = agentService.buildAgentExecutionOrder(plan);
    assertEqual(order.sequential, true, 'Should be sequential');
    assertEqual(order.order.length, 2, 'Should have 2 agents');
});

// Test 30: buildSharedContextPlan() - various configurations
test('Phase 10: buildSharedContextPlan() - various configurations', () => {
    const order1 = { order: ['memory'] };
    const plan1 = agentService.buildSharedContextPlan(order1);
    assertTrue(plan1.shareMemory, 'Should share memory');
    assertFalse(plan1.shareFiles, 'Should not share files');

    const order2 = { order: ['file'] };
    const plan2 = agentService.buildSharedContextPlan(order2);
    assertTrue(plan2.shareFiles, 'Should share files');

    const order3 = { order: ['memory', 'ai'] };
    const plan3 = agentService.buildSharedContextPlan(order3);
    assertTrue(plan3.shareToolResults, 'Should share tool results for multiple agents');
});

// Test 31: buildExecutionPipeline() - valid inputs
test('Phase 10: buildExecutionPipeline() - valid inputs', () => {
    const executionOrder = {
        sequential: true,
        parallel: false,
        order: ['tool']
    };
    const sharedContextPlan = {
        shareMemory: false,
        shareFiles: false,
        shareToolResults: false
    };
    const pipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    assertEqual(pipeline.sequential, true, 'Should be sequential');
    assertTrue(Array.isArray(pipeline.stages), 'Should have stages');
    assertEqual(pipeline.stages.length, 1, 'Should have 1 stage');
    assertEqual(pipeline.stages[0].agent, 'tool', 'Should have tool agent');
});

// Test 32: buildExecutionPipeline() - invalid inputs
test('Phase 10: buildExecutionPipeline() - invalid inputs', () => {
    const pipeline1 = agentService.buildExecutionPipeline(null, {});
    assertTrue(Array.isArray(pipeline1.stages), 'Should have stages array');
    assertEqual(pipeline1.stages.length, 0, 'Should have empty stages');

    const pipeline2 = agentService.buildExecutionPipeline({}, null);
    assertTrue(Array.isArray(pipeline2.stages), 'Should have stages array');
});

// Test 33: validateExecutionPipeline() - valid pipeline
test('Phase 10: validateExecutionPipeline() - valid pipeline', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'tool',
                context: {
                    memory: false,
                    files: false,
                    previousResults: false
                }
            }
        ]
    };
    const validation = agentService.validateExecutionPipeline(pipeline);
    assertTrue(validation.valid, 'Should be valid');
    assertTrue(validation.errors.length === 0, 'Should have no errors');
});

// Test 34: validateExecutionPipeline() - invalid pipeline
test('Phase 10: validateExecutionPipeline() - invalid pipeline', () => {
    const invalidPipeline = {
        sequential: true,
        stages: [
            { agent: 'invalid_agent' }
        ]
    };
    const validation = agentService.validateExecutionPipeline(invalidPipeline);
    assertFalse(validation.valid, 'Should be invalid');
    assertTrue(validation.errors.length > 0, 'Should have errors');
});

// Test 35: buildExecutionDescriptor() - valid pipeline
test('Phase 10: buildExecutionDescriptor() - valid pipeline', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'ai',
                context: {
                    memory: true,
                    files: false,
                    previousResults: false
                }
            }
        ]
    };
    const descriptor = agentService.buildExecutionDescriptor(pipeline);
    assertTrue(descriptor.ready, 'Should be ready');
    assertEqual(descriptor.mode, 'sequential', 'Should be sequential mode');
    assertEqual(descriptor.totalStages, 1, 'Should have 1 stage');
});

// Test 36: buildExecutionDescriptor() - invalid pipeline
test('Phase 10: buildExecutionDescriptor() - invalid pipeline', () => {
    const descriptor = agentService.buildExecutionDescriptor(null);
    assertFalse(descriptor.ready, 'Should not be ready');
    assertEqual(descriptor.totalStages, 0, 'Should have 0 stages');
});

// Test 37: buildExecutionResult() - all success
test('Phase 10: buildExecutionResult() - all success', () => {
    const results = [
        { agent: 'ai', success: true, output: 'Response 1' },
        { agent: 'memory', success: true, output: 'Response 2' }
    ];
    const result = agentService.buildExecutionResult(results);
    assertTrue(result.success, 'Should succeed');
    assertEqual(result.completed, 2, 'Should have 2 completed');
    assertEqual(result.failed, 0, 'Should have 0 failed');
    assertEqual(result.total, 2, 'Should have 2 total');
});

// Test 38: buildExecutionResult() - all failure
test('Phase 10: buildExecutionResult() - all failure', () => {
    const results = [
        { agent: 'ai', success: false, error: 'Error 1' },
        { agent: 'memory', success: false, error: 'Error 2' }
    ];
    const result = agentService.buildExecutionResult(results);
    assertFalse(result.success, 'Should fail');
    assertEqual(result.completed, 0, 'Should have 0 completed');
    assertEqual(result.failed, 2, 'Should have 2 failed');
});

// Test 39: buildExecutionResult() - null/undefined
test('Phase 10: buildExecutionResult() - null/undefined', () => {
    const result1 = agentService.buildExecutionResult(null);
    assertFalse(result1.success, 'Should fail with null');
    assertEqual(result1.total, 0, 'Should have 0 total');

    const result2 = agentService.buildExecutionResult(undefined);
    assertFalse(result2.success, 'Should fail with undefined');
    assertEqual(result2.total, 0, 'Should have 0 total');
});

// Test 40: validateExecutionResult() - valid result
test('Phase 10: validateExecutionResult() - valid result', () => {
    const result = {
        success: true,
        completed: 2,
        failed: 0,
        total: 2,
        results: []
    };
    const validation = agentService.validateExecutionResult(result);
    assertTrue(validation.valid, 'Should be valid');
    assertTrue(validation.errors.length === 0, 'Should have no errors');
});

// Test 41: validateExecutionResult() - invalid result
test('Phase 10: validateExecutionResult() - invalid result', () => {
    const invalidResult = {
        success: 'true',  // Should be boolean
        completed: 2,
        failed: 0,
        total: 2,
        results: []
    };
    const validation = agentService.validateExecutionResult(invalidResult);
    assertFalse(validation.valid, 'Should be invalid');
    assertTrue(validation.errors.length > 0, 'Should have errors');
});

// Test 42: buildExecutionReport() - valid result
test('Phase 10: buildExecutionReport() - valid result', () => {
    const result = {
        success: true,
        completed: 2,
        failed: 0,
        total: 2,
        results: []
    };
    const report = agentService.buildExecutionReport(result);
    assertTrue(report.ready, 'Should be ready');
    assertDefined(report.summary, 'Should have summary');
    assertEqual(report.summary.totalAgents, 2, 'Should have 2 total agents');
});

// Test 43: buildExecutionReport() - invalid result
test('Phase 10: buildExecutionReport() - invalid result', () => {
    const invalidResult = {
        success: 'invalid',
        completed: 2,
        failed: 0,
        total: 2,
        results: []
    };
    const report = agentService.buildExecutionReport(invalidResult);
    assertFalse(report.ready, 'Should not be ready');
    assertEqual(report.summary, null, 'Summary should be null');
});

// Test 44: buildAgentSummary() - valid report
test('Phase 10: buildAgentSummary() - valid report', () => {
    const report = {
        ready: true,
        summary: {
            success: true,
            totalAgents: 2,
            completedAgents: 2,
            failedAgents: 0
        }
    };
    const summary = agentService.buildAgentSummary(report);
    assertTrue(summary.valid, 'Should be valid');
    assertEqual(summary.agents, 2, 'Should have 2 agents');
    assertEqual(summary.successful, 2, 'Should have 2 successful');
    assertTrue(summary.overallSuccess, 'Overall should succeed');
});

// Test 45: buildAgentSummary() - invalid report
test('Phase 10: buildAgentSummary() - invalid report', () => {
    const summary = agentService.buildAgentSummary(null);
    assertFalse(summary.valid, 'Should be invalid');
    assertEqual(summary.agents.length, 0, 'Should have empty agents');
});

// Test 46: buildFinalResponse() - valid summary
test('Phase 10: buildFinalResponse() - valid summary', () => {
    const summary = {
        success: true,
        completed: 2,
        failed: 0,
        total: 2
    };
    const response = agentService.buildFinalResponse(summary);
    assertTrue(response.success, 'Should succeed');
    assertEqual(response.response, 'Execution completed successfully', 'Should have success message');
    assertDefined(response.metadata, 'Should have metadata');
    assertEqual(response.metadata.completed, 2, 'Should have 2 completed');
});

// Test 47: buildFinalResponse() - invalid summary
test('Phase 10: buildFinalResponse() - invalid summary', () => {
    const response = agentService.buildFinalResponse(null);
    assertFalse(response.success, 'Should fail');
    assertEqual(response.response, 'Invalid execution summary', 'Should indicate invalid');
    assertEqual(response.metadata, null, 'Metadata should be null');
});

// Test 48: validateFinalResponse() - valid response
test('Phase 10: validateFinalResponse() - valid response', () => {
    const response = {
        success: true,
        response: 'Execution completed successfully',
        metadata: {
            completed: 2,
            failed: 0,
            total: 2
        }
    };
    const validation = agentService.validateFinalResponse(response);
    assertTrue(validation.valid, 'Should be valid');
    assertTrue(validation.errors.length === 0, 'Should have no errors');
});

// Test 49: validateFinalResponse() - invalid response
test('Phase 10: validateFinalResponse() - invalid response', () => {
    const invalidResponse = {
        success: true,
        response: 123,  // Should be string
        metadata: {}
    };
    const validation = agentService.validateFinalResponse(invalidResponse);
    assertFalse(validation.valid, 'Should be invalid');
    assertTrue(validation.errors.length > 0, 'Should have errors');
});

// ============================================
// BACKWARD COMPATIBILITY TESTS
// ============================================

console.log('\n--- Backward Compatibility Tests ---\n');

// Test 50: Verify all Phase 8 methods still exist
test('Backward Compatibility: All Phase 8 methods exist', () => {
    const requiredMethods = [
        'analyzeRequest',
        'buildExecutionPlan',
        'validateExecutionPlan',
        'buildContextRequirements',
        'buildContextPlan',
        'buildResponseStrategy',
        'getAgentCapabilities',
        'validateAgentCapabilities',
        'exportAgentMetadata'
    ];

    requiredMethods.forEach(method => {
        assertTrue(typeof agentService[method] === 'function',
            `Method ${method} should exist and be a function`);
    });
});

// Test 51: Verify all Phase 10 methods still exist
test('Backward Compatibility: All Phase 10 methods exist', () => {
    const requiredMethods = [
        'buildMultiAgentPlan',
        'buildAgentExecutionOrder',
        'buildSharedContextPlan',
        'buildExecutionPipeline',
        'validateExecutionPipeline',
        'buildExecutionDescriptor',
        'buildExecutionResult',
        'validateExecutionResult',
        'buildExecutionReport',
        'buildAgentSummary',
        'buildFinalResponse',
        'validateFinalResponse'
    ];

    requiredMethods.forEach(method => {
        assertTrue(typeof agentService[method] === 'function',
            `Method ${method} should exist and be a function`);
    });
});

// Test 52: Verify agent classes maintain interface
test('Backward Compatibility: Agent classes maintain interface', () => {
    const agents = [
        { class: ToolAgent, name: 'tool' },
        { class: MemoryAgent, name: 'memory' },
        { class: FileAgent, name: 'file' },
        { class: AIAgent, name: 'ai' }
    ];

    agents.forEach(({ class: AgentClass, name }) => {
        const agent = new AgentClass();
        assertEqual(agent.getName(), name, `${name} agent should have correct name`);
        assertTrue(typeof agent.canHandle === 'function', `${name} should have canHandle`);
        assertTrue(typeof agent.handle === 'function', `${name} should have handle`);
    });
});

// Test 53: Verify AgentRegistry interface
test('Backward Compatibility: AgentRegistry interface', () => {
    assertTrue(typeof AgentRegistry.getAgents === 'function', 'getAgents should exist');
    assertTrue(typeof AgentRegistry.getAgent === 'function', 'getAgent should exist');

    const agents = AgentRegistry.getAgents();
    assertEqual(agents.length, 4, 'Should still have 4 agents');
});

// Test 54: Verify AgentDispatcher interface
test('Backward Compatibility: AgentDispatcher interface', () => {
    const dispatcher = new AgentDispatcher();
    assertTrue(typeof dispatcher.dispatch === 'function', 'dispatch should exist');

    const agent = dispatcher.dispatch({ route: 'ai' });
    assertDefined(agent, 'Should still dispatch correctly');
});

// Test 55: Verify return types are consistent
test('Backward Compatibility: Return types are consistent', () => {
    // analyzeRequest should return object with route, confidence, reason
    const routeDecision = agentService.analyzeRequest("test");
    assertDefined(routeDecision.route, 'Should have route');
    assertDefined(routeDecision.confidence, 'Should have confidence');
    assertDefined(routeDecision.reason, 'Should have reason');

    // buildExecutionPlan should return object with route, steps, context
    const plan = agentService.buildExecutionPlan(routeDecision);
    assertDefined(plan.route, 'Should have route');
    assertDefined(plan.steps, 'Should have steps');
    assertDefined(plan.context, 'Should have context');

    // Validation methods should return { valid, errors }
    const planValidation = agentService.validateExecutionPlan(plan);
    assertDefined(planValidation.valid, 'Should have valid');
    assertDefined(planValidation.errors, 'Should have errors');
});

// ============================================
// INTEGRATION TESTS
// ============================================

console.log('\n--- Integration Tests ---\n');

// Test 56: Complete tool flow
test('Integration: Complete tool flow', () => {
    const userMessage = "calculate 5 + 3";
    const routeDecision = agentService.analyzeRequest(userMessage);
    const plan = agentService.buildExecutionPlan(routeDecision);
    const planValidation = agentService.validateExecutionPlan(plan);
    const executionOrder = agentService.buildAgentExecutionOrder(plan);
    const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
    const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    const pipelineValidation = agentService.validateExecutionPipeline(executionPipeline);
    const descriptor = agentService.buildExecutionDescriptor(executionPipeline);
    const responseStrategy = agentService.buildResponseStrategy(plan.route);
    const dispatcher = new AgentDispatcher();
    const agent = dispatcher.dispatch(routeDecision);

    assertTrue(planValidation.valid, 'Plan should be valid');
    assertTrue(pipelineValidation.valid, 'Pipeline should be valid');
    assertTrue(descriptor.ready, 'Descriptor should be ready');
    assertDefined(agent, 'Agent should be found');
    assertEqual(responseStrategy.type, 'tool_response', 'Should have correct strategy');
});

// Test 57: Complete memory flow
test('Integration: Complete memory flow', () => {
    const userMessage = "Remember my name is John";
    const routeDecision = agentService.analyzeRequest(userMessage);
    const plan = agentService.buildExecutionPlan(routeDecision);
    const executionOrder = agentService.buildAgentExecutionOrder(plan);
    const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
    const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    const descriptor = agentService.buildExecutionDescriptor(executionPipeline);
    const responseStrategy = agentService.buildResponseStrategy(plan.route);
    const dispatcher = new AgentDispatcher();
    const agent = dispatcher.dispatch(routeDecision);

    assertTrue(descriptor.ready, 'Descriptor should be ready');
    assertEqual(responseStrategy.type, 'memory_response', 'Should have correct strategy');
    assertDefined(agent, 'Agent should be found');
});

// Test 58: Complete AI flow
test('Integration: Complete AI flow', () => {
    const userMessage = "What is the capital of France?";
    const routeDecision = agentService.analyzeRequest(userMessage);
    const plan = agentService.buildExecutionPlan(routeDecision);
    const executionOrder = agentService.buildAgentExecutionOrder(plan);
    const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
    const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    const descriptor = agentService.buildExecutionDescriptor(executionPipeline);
    const responseStrategy = agentService.buildResponseStrategy(plan.route);
    const dispatcher = new AgentDispatcher();
    const agent = dispatcher.dispatch(routeDecision);

    assertTrue(descriptor.ready, 'Descriptor should be ready');
    assertEqual(responseStrategy.type, 'ai_response', 'Should have correct strategy');
    assertTrue(responseStrategy.stream, 'Should stream AI responses');
    assertDefined(agent, 'Agent should be found');
});

// Test 59: Complete execution result flow
test('Integration: Complete execution result flow', () => {
    const executionResults = [
        { agent: 'ai', success: true, output: 'AI response' },
        { agent: 'memory', success: true, output: 'Memory data' }
    ];
    const executionResult = agentService.buildExecutionResult(executionResults);
    const resultValidation = agentService.validateExecutionResult(executionResult);
    const executionReport = agentService.buildExecutionReport(executionResult);
    const agentSummary = agentService.buildAgentSummary(executionReport);
    const finalResponse = agentService.buildFinalResponse({
        success: agentSummary.overallSuccess,
        completed: agentSummary.successful,
        failed: agentSummary.failed,
        total: agentSummary.agents
    });
    const responseValidation = agentService.validateFinalResponse(finalResponse);

    assertTrue(resultValidation.valid, 'Result validation should pass');
    assertTrue(executionReport.ready, 'Report should be ready');
    assertTrue(agentSummary.valid, 'Summary should be valid');
    assertTrue(finalResponse.success, 'Final response should succeed');
    assertTrue(responseValidation.valid, 'Response validation should pass');
});

// Test 60: Error handling throughout pipeline
test('Integration: Error handling throughout pipeline', () => {
    // Start with invalid input
    const routeDecision = agentService.analyzeRequest("");
    const plan = agentService.buildExecutionPlan(routeDecision);
    const executionOrder = agentService.buildAgentExecutionOrder(plan);
    const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
    const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    const descriptor = agentService.buildExecutionDescriptor(executionPipeline);
    const executionResult = agentService.buildExecutionResult([]);
    const executionReport = agentService.buildExecutionReport(executionResult);
    const agentSummary = agentService.buildAgentSummary(executionReport);
    const finalResponse = agentService.buildFinalResponse(agentSummary);

    // All should complete without throwing
    assertDefined(routeDecision, 'Route decision should be defined');
    assertDefined(plan, 'Plan should be defined');
    assertDefined(executionOrder, 'Execution order should be defined');
    assertDefined(sharedContextPlan, 'Shared context plan should be defined');
    assertDefined(executionPipeline, 'Pipeline should be defined');
    assertDefined(descriptor, 'Descriptor should be defined');
    assertDefined(executionResult, 'Execution result should be defined');
    assertDefined(executionReport, 'Report should be defined');
    assertDefined(agentSummary, 'Summary should be defined');
    assertDefined(finalResponse, 'Final response should be defined');
});

// ============================================
// TEST SUMMARY
// ============================================

console.log('\n=== Test Summary ===\n');
console.log(`Total tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All regression tests passed!');
    process.exit(0);
}