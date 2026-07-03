/**
 * Test Phase 8.1B - Execution Plan Validation
 * Tests the validateExecutionPlan method for all routes
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

console.log('=== Phase 8.1B: Execution Plan Validation Tests ===\n');

// ===== VALID PLANS =====

// Test 1: Valid tool plan
test('Valid tool plan: Passes validation', () => {
    const plan = {
        route: "tool",
        target: "weather",
        confidence: 0.95,
        steps: ['validate_tool', 'execute_tool']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, true, 'Plan should be valid');
    assertEqual(result.errors.length, 0, 'Should have no errors');
});

// Test 2: Valid memory plan
test('Valid memory plan: Passes validation', () => {
    const plan = {
        route: "memory",
        target: null,
        confidence: 0.95,
        steps: ['load_memory', 'build_context', 'call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, true, 'Plan should be valid');
    assertEqual(result.errors.length, 0, 'Should have no errors');
});

// Test 3: Valid file plan
test('Valid file plan: Passes validation', () => {
    const plan = {
        route: "file",
        target: null,
        confidence: 0.95,
        steps: ['load_files', 'build_context', 'call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, true, 'Plan should be valid');
    assertEqual(result.errors.length, 0, 'Should have no errors');
});

// Test 4: Valid AI plan
test('Valid AI plan: Passes validation', () => {
    const plan = {
        route: "ai",
        target: null,
        confidence: 0.7,
        steps: ['call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, true, 'Plan should be valid');
    assertEqual(result.errors.length, 0, 'Should have no errors');
});

// Test 5: Valid plan with confidence at boundaries
test('Valid plan: Confidence at boundaries (0 and 1)', () => {
    const plan0 = {
        route: "ai",
        target: null,
        confidence: 0,
        steps: ['call_ai']
    };

    const plan1 = {
        route: "ai",
        target: null,
        confidence: 1,
        steps: ['call_ai']
    };

    const result0 = AgentService.validateExecutionPlan(plan0);
    const result1 = AgentService.validateExecutionPlan(plan1);

    assertEqual(result0.valid, true, 'Plan with confidence 0 should be valid');
    assertEqual(result1.valid, true, 'Plan with confidence 1 should be valid');
});

// Test 6: Valid tool plan with different targets
test('Valid tool plan: Works with different tool targets', () => {
    const tools = ['weather', 'web_search', 'currency', 'calculator', 'uuid', 'password', 'datetime'];

    tools.forEach(tool => {
        const plan = {
            route: "tool",
            target: tool,
            confidence: 0.95,
            steps: ['validate_tool', 'execute_tool']
        };

        const result = AgentService.validateExecutionPlan(plan);
        assertEqual(result.valid, true, `Plan should be valid for ${tool}`);
    });
});

// ===== INVALID PLANS =====

// Test 7: Invalid - null plan
test('Invalid plan (null): Returns validation errors', () => {
    const result = AgentService.validateExecutionPlan(null);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.length > 0, 'Should have errors');
    assert(result.errors.includes('Plan must be an object'), 'Should have correct error message');
});

// Test 8: Invalid - undefined plan
test('Invalid plan (undefined): Returns validation errors', () => {
    const result = AgentService.validateExecutionPlan(undefined);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.length > 0, 'Should have errors');
});

// Test 9: Invalid - not an object
test('Invalid plan (string): Returns validation errors', () => {
    const result = AgentService.validateExecutionPlan("invalid");

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes('Plan must be an object'), 'Should have correct error message');
});

// Test 10: Invalid - missing route
test('Invalid plan (missing route): Returns validation errors', () => {
    const plan = {
        confidence: 0.95,
        steps: ['call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes('Route is required and must be a string'), 'Should have correct error message');
});

// Test 11: Invalid - route not a string
test('Invalid plan (route not string): Returns validation errors', () => {
    const plan = {
        route: 123,
        confidence: 0.95,
        steps: ['call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes('Route is required and must be a string'), 'Should have correct error message');
});

// Test 12: Invalid - steps not an array
test('Invalid plan (steps not array): Returns validation errors', () => {
    const plan = {
        route: "ai",
        confidence: 0.95,
        steps: "call_ai"
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes('Steps must be an array'), 'Should have correct error message');
});

// Test 13: Invalid - confidence out of range (too low)
test('Invalid plan (confidence < 0): Returns validation errors', () => {
    const plan = {
        route: "ai",
        confidence: -0.1,
        steps: ['call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes('Confidence must be a number between 0 and 1'), 'Should have correct error message');
});

// Test 14: Invalid - confidence out of range (too high)
test('Invalid plan (confidence > 1): Returns validation errors', () => {
    const plan = {
        route: "ai",
        confidence: 1.5,
        steps: ['call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes('Confidence must be a number between 0 and 1'), 'Should have correct error message');
});

// Test 15: Invalid - confidence not a number
test('Invalid plan (confidence not number): Returns validation errors', () => {
    const plan = {
        route: "ai",
        confidence: "high",
        steps: ['call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes('Confidence must be a number between 0 and 1'), 'Should have correct error message');
});

// ===== ROUTE-SPECIFIC VALIDATIONS =====

// Test 16: Invalid tool plan - missing target
test('Invalid tool plan (missing target): Returns validation errors', () => {
    const plan = {
        route: "tool",
        confidence: 0.95,
        steps: ['validate_tool', 'execute_tool']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes('Target is required for tool route'), 'Should have correct error message');
});

// Test 17: Invalid tool plan - target not a string
test('Invalid tool plan (target not string): Returns validation errors', () => {
    const plan = {
        route: "tool",
        target: 123,
        confidence: 0.95,
        steps: ['validate_tool', 'execute_tool']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes('Target is required for tool route'), 'Should have correct error message');
});

// Test 18: Invalid tool plan - missing validate_tool step
test('Invalid tool plan (missing validate_tool): Returns validation errors', () => {
    const plan = {
        route: "tool",
        target: "weather",
        confidence: 0.95,
        steps: ['execute_tool']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes("Tool route must include 'validate_tool' step"), 'Should have correct error message');
});

// Test 19: Invalid tool plan - missing execute_tool step
test('Invalid tool plan (missing execute_tool): Returns validation errors', () => {
    const plan = {
        route: "tool",
        target: "weather",
        confidence: 0.95,
        steps: ['validate_tool']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes("Tool route must include 'execute_tool' step"), 'Should have correct error message');
});

// Test 20: Invalid memory plan - missing load_memory
test('Invalid memory plan (missing load_memory): Returns validation errors', () => {
    const plan = {
        route: "memory",
        confidence: 0.95,
        steps: ['build_context', 'call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes("Memory route must include 'load_memory' step"), 'Should have correct error message');
});

// Test 21: Invalid memory plan - missing build_context
test('Invalid memory plan (missing build_context): Returns validation errors', () => {
    const plan = {
        route: "memory",
        confidence: 0.95,
        steps: ['load_memory', 'call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes("Memory route must include 'build_context' step"), 'Should have correct error message');
});

// Test 22: Invalid memory plan - missing call_ai
test('Invalid memory plan (missing call_ai): Returns validation errors', () => {
    const plan = {
        route: "memory",
        confidence: 0.95,
        steps: ['load_memory', 'build_context']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes("Memory route must include 'call_ai' step"), 'Should have correct error message');
});

// Test 23: Invalid file plan - missing load_files
test('Invalid file plan (missing load_files): Returns validation errors', () => {
    const plan = {
        route: "file",
        confidence: 0.95,
        steps: ['build_context', 'call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes("File route must include 'load_files' step"), 'Should have correct error message');
});

// Test 24: Invalid file plan - missing build_context
test('Invalid file plan (missing build_context): Returns validation errors', () => {
    const plan = {
        route: "file",
        confidence: 0.95,
        steps: ['load_files', 'call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes("File route must include 'build_context' step"), 'Should have correct error message');
});

// Test 25: Invalid file plan - missing call_ai
test('Invalid file plan (missing call_ai): Returns validation errors', () => {
    const plan = {
        route: "file",
        confidence: 0.95,
        steps: ['load_files', 'build_context']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes("File route must include 'call_ai' step"), 'Should have correct error message');
});

// Test 26: Invalid AI plan - missing call_ai
test('Invalid AI plan (missing call_ai): Returns validation errors', () => {
    const plan = {
        route: "ai",
        confidence: 0.7,
        steps: []
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes("AI route must include 'call_ai' step"), 'Should have correct error message');
});

// Test 27: Multiple errors at once
test('Invalid plan (multiple errors): Returns all validation errors', () => {
    const plan = {
        route: 123,
        confidence: 2.5,
        steps: "not_an_array"
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.length >= 3, 'Should have multiple errors');
    assert(result.errors.includes('Route is required and must be a string'), 'Should have route error');
    assert(result.errors.includes('Steps must be an array'), 'Should have steps error');
    assert(result.errors.includes('Confidence must be a number between 0 and 1'), 'Should have confidence error');
});

// Test 28: Tool plan with multiple step errors
test('Invalid tool plan (multiple step errors): Returns all errors', () => {
    const plan = {
        route: "tool",
        target: "weather",
        confidence: 0.95,
        steps: ['some_other_step']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes("Tool route must include 'validate_tool' step"), 'Should have validate_tool error');
    assert(result.errors.includes("Tool route must include 'execute_tool' step"), 'Should have execute_tool error');
});

// ===== INTEGRATION TESTS =====

// Test 29: Valid plans from buildExecutionPlan pass validation
test('Integration: Plans from buildExecutionPlan are valid', () => {
    const routes = [
        { route: "tool", target: "weather", confidence: 0.95 },
        { route: "memory", target: null, confidence: 0.95 },
        { route: "file", target: null, confidence: 0.95 },
        { route: "ai", target: null, confidence: 0.7 }
    ];

    routes.forEach(routeDecision => {
        const plan = AgentService.buildExecutionPlan(routeDecision);
        const result = AgentService.validateExecutionPlan(plan);

        assertEqual(result.valid, true, `Plan for ${routeDecision.route} should be valid`);
        assertEqual(result.errors.length, 0, `Should have no errors for ${routeDecision.route}`);
    });
});

// Test 30: Complete pipeline - analyzeRequest -> buildExecutionPlan -> validateExecutionPlan
test('Integration: Full pipeline with validation', () => {
    const messages = [
        { msg: 'what is the weather in London', expectedRoute: 'tool' },
        { msg: 'remember my name is John', expectedRoute: 'memory' },
        { msg: 'upload my file', expectedRoute: 'file' },
        { msg: 'tell me a joke', expectedRoute: 'ai' }
    ];

    messages.forEach(({ msg, expectedRoute }) => {
        const decision = AgentService.analyzeRequest(msg);
        const plan = AgentService.buildExecutionPlan(decision);
        const validation = AgentService.validateExecutionPlan(plan);

        assertEqual(decision.route, expectedRoute, `Decision route should be ${expectedRoute}`);
        assertEqual(plan.route, expectedRoute, `Plan route should be ${expectedRoute}`);
        assertEqual(validation.valid, true, `Validation should pass for ${expectedRoute}`);
        assertEqual(validation.errors.length, 0, `Should have no errors for ${expectedRoute}`);
    });
});

// Test 31: Validation is synchronous (no async)
test('Validation: Is synchronous (no async)', () => {
    const plan = {
        route: "ai",
        confidence: 0.7,
        steps: ['call_ai']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assert(result.valid !== undefined, 'Should return immediately');
    assert(Array.isArray(result.errors), 'Should return errors array');
    assert(typeof result.valid === 'boolean', 'Should return boolean valid flag');
});

// Test 32: Empty steps array validation
test('Invalid plan (empty steps): Returns validation errors', () => {
    const plan = {
        route: "ai",
        confidence: 0.7,
        steps: []
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, false, 'Plan should be invalid');
    assert(result.errors.includes("AI route must include 'call_ai' step"), 'Should have correct error message');
});

// Test 33: Plan with extra steps is still valid
test('Valid plan (extra steps): Still passes validation', () => {
    const plan = {
        route: "tool",
        target: "weather",
        confidence: 0.95,
        steps: ['validate_tool', 'execute_tool', 'log_result', 'cleanup']
    };

    const result = AgentService.validateExecutionPlan(plan);

    assertEqual(result.valid, true, 'Plan should be valid');
    assertEqual(result.errors.length, 0, 'Should have no errors');
});

// Test 34: Regression - analyzeRequest unchanged
test('Regression: analyzeRequest still works correctly', () => {
    const result = AgentService.analyzeRequest('what is the weather in London');

    assertEqual(result.route, "tool", 'Route should be tool');
    assertEqual(result.target, "weather", 'Target should be weather');
    assert(result.confidence >= 0.9, 'Confidence should be high');
    assert(result.reason, 'Should have a reason');
});

// Test 35: Regression - buildExecutionPlan unchanged
test('Regression: buildExecutionPlan still works correctly', () => {
    const routeDecision = {
        route: "tool",
        target: "weather",
        confidence: 0.95,
        reason: "Weather query"
    };

    const plan = AgentService.buildExecutionPlan(routeDecision);

    assertEqual(plan.route, "tool", 'Route should be tool');
    assertEqual(plan.target, "weather", 'Target should be weather');
    assertEqual(plan.confidence, 0.95, 'Confidence should be 0.95');
    assertArrayEqual(plan.steps, ['validate_tool', 'execute_tool'], 'Steps should match');
    assertEqual(plan.requiresAI, false, 'requiresAI should be false');
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
    console.log('\n✅ All Phase 8.1B execution plan validation tests passed!');
    console.log('✓ Valid plans pass validation');
    console.log('✓ Invalid plans fail validation');
    console.log('✓ All route-specific validations work');
    console.log('✓ No regressions in existing methods');
    console.log('✓ Validation is synchronous');
    process.exit(0);
}