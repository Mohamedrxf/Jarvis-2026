/**
 * Test Phase 8.1A - Execution Plan Builder
 * Tests the buildExecutionPlan method for all routes
 */

const AgentService = require('./server/services/agentService');

let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
    try {
        testFn();
        console.log(`✓ ${description}`);
        testsPassed++;
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}`);
        testsFailed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Assertion failed'}: Expected "${expected}", got "${actual}"`);
    }
}

function assertArrayEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message || 'Array assertion failed'}: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

console.log('=== Phase 8.1A: Execution Plan Builder Tests ===\n');

// Test 1: Tool route execution plan
test('Tool route: Returns correct execution plan', () => {
    const routeDecision = {
        route: "tool",
        target: "weather",
        confidence: 0.95,
        reason: "Weather query pattern detected"
    };

    const plan = AgentService.buildExecutionPlan(routeDecision);

    assertEqual(plan.route, "tool", 'Route should be tool');
    assertEqual(plan.target, "weather", 'Target should be weather');
    assertEqual(plan.confidence, 0.95, 'Confidence should be 0.95');
    assertArrayEqual(plan.steps, ['validate_tool', 'execute_tool'], 'Steps should match tool execution plan');
    assertEqual(plan.requiresAI, false, 'requiresAI should be false for tool route');
});

// Test 2: Memory route execution plan
test('Memory route: Returns correct execution plan', () => {
    const routeDecision = {
        route: "memory",
        target: null,
        confidence: 0.95,
        reason: "Memory operation request detected"
    };

    const plan = AgentService.buildExecutionPlan(routeDecision);

    assertEqual(plan.route, "memory", 'Route should be memory');
    assertEqual(plan.target, null, 'Target should be null');
    assertEqual(plan.confidence, 0.95, 'Confidence should be 0.95');
    assertArrayEqual(plan.steps, ['load_memory', 'build_context', 'call_ai'], 'Steps should match memory execution plan');
    assertEqual(plan.requiresAI, true, 'requiresAI should be true for memory route');
});

// Test 3: File route execution plan
test('File route: Returns correct execution plan', () => {
    const routeDecision = {
        route: "file",
        target: null,
        confidence: 0.95,
        reason: "File operation request detected"
    };

    const plan = AgentService.buildExecutionPlan(routeDecision);

    assertEqual(plan.route, "file", 'Route should be file');
    assertEqual(plan.target, null, 'Target should be null');
    assertEqual(plan.confidence, 0.95, 'Confidence should be 0.95');
    assertArrayEqual(plan.steps, ['load_files', 'build_context', 'call_ai'], 'Steps should match file execution plan');
    assertEqual(plan.requiresAI, true, 'requiresAI should be true for file route');
});

// Test 4: AI route execution plan
test('AI route: Returns correct execution plan', () => {
    const routeDecision = {
        route: "ai",
        target: null,
        confidence: 0.7,
        reason: "General conversation or query, routing to AI"
    };

    const plan = AgentService.buildExecutionPlan(routeDecision);

    assertEqual(plan.route, "ai", 'Route should be ai');
    assertEqual(plan.target, null, 'Target should be null');
    assertEqual(plan.confidence, 0.7, 'Confidence should be 0.7');
    assertArrayEqual(plan.steps, ['call_ai'], 'Steps should match AI execution plan');
    assertEqual(plan.requiresAI, true, 'requiresAI should be true for AI route');
});

// Test 5: Invalid input - null
test('Invalid input (null): Returns default AI plan', () => {
    const plan = AgentService.buildExecutionPlan(null);

    assertEqual(plan.route, "ai", 'Route should default to ai');
    assertEqual(plan.target, null, 'Target should be null');
    assertEqual(plan.confidence, 0.5, 'Confidence should be 0.5');
    assertArrayEqual(plan.steps, ['call_ai'], 'Steps should be call_ai');
    assertEqual(plan.requiresAI, true, 'requiresAI should be true');
});

// Test 6: Invalid input - undefined
test('Invalid input (undefined): Returns default AI plan', () => {
    const plan = AgentService.buildExecutionPlan(undefined);

    assertEqual(plan.route, "ai", 'Route should default to ai');
    assertEqual(plan.target, null, 'Target should be null');
    assertEqual(plan.confidence, 0.5, 'Confidence should be 0.5');
    assertArrayEqual(plan.steps, ['call_ai'], 'Steps should be call_ai');
    assertEqual(plan.requiresAI, true, 'requiresAI should be true');
});

// Test 7: Invalid input - not an object
test('Invalid input (string): Returns default AI plan', () => {
    const plan = AgentService.buildExecutionPlan("invalid");

    assertEqual(plan.route, "ai", 'Route should default to ai');
    assertEqual(plan.target, null, 'Target should be null');
    assertEqual(plan.confidence, 0.5, 'Confidence should be 0.5');
    assertArrayEqual(plan.steps, ['call_ai'], 'Steps should be call_ai');
    assertEqual(plan.requiresAI, true, 'requiresAI should be true');
});

// Test 8: Invalid input - number
test('Invalid input (number): Returns default AI plan', () => {
    const plan = AgentService.buildExecutionPlan(123);

    assertEqual(plan.route, "ai", 'Route should default to ai');
    assertEqual(plan.target, null, 'Target should be null');
    assertEqual(plan.confidence, 0.5, 'Confidence should be 0.5');
    assertArrayEqual(plan.steps, ['call_ai'], 'Steps should be call_ai');
    assertEqual(plan.requiresAI, true, 'requiresAI should be true');
});

// Test 9: Tool route with different targets
test('Tool route: Works with different tool targets', () => {
    const tools = ['weather', 'web_search', 'currency', 'calculator', 'uuid', 'password', 'datetime'];

    tools.forEach(tool => {
        const routeDecision = {
            route: "tool",
            target: tool,
            confidence: 0.95,
            reason: "Tool request detected"
        };

        const plan = AgentService.buildExecutionPlan(routeDecision);

        assertEqual(plan.route, "tool", `Route should be tool for ${tool}`);
        assertEqual(plan.target, tool, `Target should be ${tool}`);
        assertArrayEqual(plan.steps, ['validate_tool', 'execute_tool'], 'Steps should match tool execution plan');
        assertEqual(plan.requiresAI, false, 'requiresAI should be false for tool route');
    });
});

// Test 10: AI route with default values
test('AI route: Handles missing fields with defaults', () => {
    const routeDecision = {
        route: "ai"
    };

    const plan = AgentService.buildExecutionPlan(routeDecision);

    assertEqual(plan.route, "ai", 'Route should be ai');
    assertEqual(plan.target, null, 'Target should default to null');
    assertEqual(plan.confidence, 0.7, 'Confidence should default to 0.7');
    assertArrayEqual(plan.steps, ['call_ai'], 'Steps should be call_ai');
    assertEqual(plan.requiresAI, true, 'requiresAI should be true');
});

// Test 11: Unknown route defaults to AI
test('Unknown route: Defaults to AI execution plan', () => {
    const routeDecision = {
        route: "unknown_route",
        target: "something",
        confidence: 0.5,
        reason: "Unknown route"
    };

    const plan = AgentService.buildExecutionPlan(routeDecision);

    assertEqual(plan.route, "unknown_route", 'Route should preserve unknown route');
    assertEqual(plan.target, "something", 'Target should be preserved');
    assertEqual(plan.confidence, 0.5, 'Confidence should be preserved');
    assertArrayEqual(plan.steps, ['call_ai'], 'Steps should default to AI plan');
    assertEqual(plan.requiresAI, true, 'requiresAI should be true');
});

// Test 12: Empty object input
test('Empty object: Returns default AI plan', () => {
    const plan = AgentService.buildExecutionPlan({});

    assertEqual(plan.route, "ai", 'Route should default to ai');
    assertEqual(plan.target, null, 'Target should default to null');
    assertEqual(plan.confidence, 0.7, 'Confidence should default to 0.7');
    assertArrayEqual(plan.steps, ['call_ai'], 'Steps should be call_ai');
    assertEqual(plan.requiresAI, true, 'requiresAI should be true');
});

// Test 13: Verify analyzeRequest still works (regression test)
test('Regression: analyzeRequest still works correctly', () => {
    const result = AgentService.analyzeRequest('what is the weather in London');

    assertEqual(result.route, "tool", 'Route should be tool');
    assertEqual(result.target, "weather", 'Target should be weather');
    assert(result.confidence >= 0.9, 'Confidence should be high');
    assert(result.reason, 'Should have a reason');
});

// Test 14: Verify analyzeRequest for memory (regression test)
test('Regression: analyzeRequest memory detection still works', () => {
    const result = AgentService.analyzeRequest('remember my name is John');

    assertEqual(result.route, "memory", 'Route should be memory');
    assert(result.reason, 'Should have a reason');
});

// Test 15: Verify analyzeRequest for file (regression test)
test('Regression: analyzeRequest file detection still works', () => {
    const result = AgentService.analyzeRequest('upload my file');

    assertEqual(result.route, "file", 'Route should be file');
    assert(result.reason, 'Should have a reason');
});

// Test 16: Verify analyzeRequest for AI fallback (regression test)
test('Regression: analyzeRequest AI fallback still works', () => {
    const result = AgentService.analyzeRequest('hello, how are you?');

    assertEqual(result.route, "ai", 'Route should be ai');
    assert(result.reason, 'Should have a reason');
});

// Test 17: Verify analyzeRequest handles invalid input (regression test)
test('Regression: analyzeRequest handles invalid input', () => {
    const result = AgentService.analyzeRequest('');

    assertEqual(result.route, "ai", 'Route should default to ai');
    assertEqual(result.target, null, 'Target should be null');
    assertEqual(result.confidence, 0.5, 'Confidence should be 0.5');
});

// Test 18: Complete integration - analyzeRequest + buildExecutionPlan
test('Integration: Full pipeline from analyzeRequest to buildExecutionPlan', () => {
    // Test tool flow
    const toolDecision = AgentService.analyzeRequest('calculate 2 + 2');
    const toolPlan = AgentService.buildExecutionPlan(toolDecision);
    assertEqual(toolPlan.route, "tool", 'Tool route should be preserved');
    assertArrayEqual(toolPlan.steps, ['validate_tool', 'execute_tool'], 'Tool steps should be correct');
    assertEqual(toolPlan.requiresAI, false, 'Tool should not require AI');

    // Test memory flow
    const memoryDecision = AgentService.analyzeRequest('remember my favorite color is blue');
    const memoryPlan = AgentService.buildExecutionPlan(memoryDecision);
    assertEqual(memoryPlan.route, "memory", 'Memory route should be preserved');
    assertArrayEqual(memoryPlan.steps, ['load_memory', 'build_context', 'call_ai'], 'Memory steps should be correct');
    assertEqual(memoryPlan.requiresAI, true, 'Memory should require AI');

    // Test file flow
    const fileDecision = AgentService.analyzeRequest('search my files');
    const filePlan = AgentService.buildExecutionPlan(fileDecision);
    assertEqual(filePlan.route, "file", 'File route should be preserved');
    assertArrayEqual(filePlan.steps, ['load_files', 'build_context', 'call_ai'], 'File steps should be correct');
    assertEqual(filePlan.requiresAI, true, 'File should require AI');

    // Test AI flow
    const aiDecision = AgentService.analyzeRequest('tell me a joke');
    const aiPlan = AgentService.buildExecutionPlan(aiDecision);
    assertEqual(aiPlan.route, "ai", 'AI route should be preserved');
    assertArrayEqual(aiPlan.steps, ['call_ai'], 'AI steps should be correct');
    assertEqual(aiPlan.requiresAI, true, 'AI should require AI');
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All Phase 8.1A execution plan tests passed!');
    console.log('✓ Tool execution plan correct');
    console.log('✓ Memory execution plan correct');
    console.log('✓ File execution plan correct');
    console.log('✓ AI execution plan correct');
    console.log('✓ Invalid input handling correct');
    console.log('✓ No regressions in analyzeRequest');
    process.exit(0);
}