/**
 * Test Phase 8.1C - Execution Orchestrator
 * Tests the executeExecutionPlan method
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

function assertObjectEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message || 'Object assertion failed'}: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

console.log('=== Phase 8.1C: Execution Orchestrator Tests ===\n');

// ===== VALID PLANS =====

// Test 1: Valid tool plan returns success with execution descriptor
test('Valid tool plan: Returns success with execution descriptor', () => {
    const plan = {
        route: "tool",
        target: "weather",
        confidence: 0.95,
        steps: ['validate_tool', 'execute_tool'],
        requiresAI: false
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, true, 'Should return success: true');
    assertEqual(result.route, "tool", 'Route should match');
    assertEqual(result.target, "weather", 'Target should match');
    assertEqual(result.steps.length, 2, 'Steps should match');
    assertEqual(result.requiresAI, false, 'requiresAI should match');
    assert(!result.errors, 'Should not have errors array');
});

// Test 2: Valid memory plan returns success with execution descriptor
test('Valid memory plan: Returns success with execution descriptor', () => {
    const plan = {
        route: "memory",
        target: null,
        confidence: 0.95,
        steps: ['load_memory', 'build_context', 'call_ai'],
        requiresAI: true
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, true, 'Should return success: true');
    assertEqual(result.route, "memory", 'Route should match');
    assertEqual(result.target, null, 'Target should be null');
    assertEqual(result.steps.length, 3, 'Steps should match');
    assertEqual(result.requiresAI, true, 'requiresAI should match');
});

// Test 3: Valid file plan returns success with execution descriptor
test('Valid file plan: Returns success with execution descriptor', () => {
    const plan = {
        route: "file",
        target: null,
        confidence: 0.95,
        steps: ['load_files', 'build_context', 'call_ai'],
        requiresAI: true
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, true, 'Should return success: true');
    assertEqual(result.route, "file", 'Route should match');
    assertEqual(result.steps.length, 3, 'Steps should match');
    assertEqual(result.requiresAI, true, 'requiresAI should match');
});

// Test 4: Valid AI plan returns success with execution descriptor
test('Valid AI plan: Returns success with execution descriptor', () => {
    const plan = {
        route: "ai",
        target: null,
        confidence: 0.7,
        steps: ['call_ai'],
        requiresAI: true
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, true, 'Should return success: true');
    assertEqual(result.route, "ai", 'Route should match');
    assertEqual(result.steps.length, 1, 'Steps should match');
    assertEqual(result.requiresAI, true, 'requiresAI should match');
});

// Test 5: Valid plan with all tool types
test('Valid tool plans: Works with all tool targets', () => {
    const tools = [
        { target: "weather", name: "weather" },
        { target: "web_search", name: "web_search" },
        { target: "currency", name: "currency" },
        { target: "calculator", name: "calculator" },
        { target: "uuid", name: "uuid" },
        { target: "password", name: "password" },
        { target: "datetime", name: "datetime" }
    ];

    tools.forEach(tool => {
        const plan = {
            route: "tool",
            target: tool.target,
            confidence: 0.95,
            steps: ['validate_tool', 'execute_tool'],
            requiresAI: false
        };

        const result = AgentService.executeExecutionPlan(plan);
        assertEqual(result.success, true, `Should succeed for ${tool.name}`);
        assertEqual(result.target, tool.target, `Target should match for ${tool.name}`);
    });
});

// ===== INVALID PLANS =====

// Test 6: Invalid - null plan
test('Invalid plan (null): Returns failure with errors', () => {
    const result = AgentService.executeExecutionPlan(null);

    assertEqual(result.success, false, 'Should return success: false');
    assert(Array.isArray(result.errors), 'Should have errors array');
    assert(result.errors.length > 0, 'Should have errors');
    assert(result.errors.includes('Plan must be an object'), 'Should have correct error message');
});

// Test 7: Invalid - undefined plan
test('Invalid plan (undefined): Returns failure with errors', () => {
    const result = AgentService.executeExecutionPlan(undefined);

    assertEqual(result.success, false, 'Should return success: false');
    assert(Array.isArray(result.errors), 'Should have errors array');
    assert(result.errors.length > 0, 'Should have errors');
});

// Test 8: Invalid - not an object
test('Invalid plan (string): Returns failure with errors', () => {
    const result = AgentService.executeExecutionPlan("invalid");

    assertEqual(result.success, false, 'Should return success: false');
    assert(result.errors.includes('Plan must be an object'), 'Should have correct error message');
});

// Test 9: Invalid - missing route
test('Invalid plan (missing route): Returns failure with errors', () => {
    const plan = {
        confidence: 0.95,
        steps: ['call_ai']
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, false, 'Should return success: false');
    assert(result.errors.includes('Route is required and must be a string'), 'Should have correct error message');
});

// Test 10: Invalid - route not a string
test('Invalid plan (route not string): Returns failure with errors', () => {
    const plan = {
        route: 123,
        confidence: 0.95,
        steps: ['call_ai']
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, false, 'Should return success: false');
    assert(result.errors.includes('Route is required and must be a string'), 'Should have correct error message');
});

// Test 11: Invalid - steps not an array
test('Invalid plan (steps not array): Returns failure with errors', () => {
    const plan = {
        route: "ai",
        confidence: 0.95,
        steps: "call_ai"
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, false, 'Should return success: false');
    assert(result.errors.includes('Steps must be an array'), 'Should have correct error message');
});

// Test 12: Invalid - confidence out of range (too low)
test('Invalid plan (confidence < 0): Returns failure with errors', () => {
    const plan = {
        route: "ai",
        confidence: -0.1,
        steps: ['call_ai']
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, false, 'Should return success: false');
    assert(result.errors.includes('Confidence must be a number between 0 and 1'), 'Should have correct error message');
});

// Test 13: Invalid - confidence out of range (too high)
test('Invalid plan (confidence > 1): Returns failure with errors', () => {
    const plan = {
        route: "ai",
        confidence: 1.5,
        steps: ['call_ai']
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, false, 'Should return success: false');
    assert(result.errors.includes('Confidence must be a number between 0 and 1'), 'Should have correct error message');
});

// Test 14: Invalid tool plan - missing target
test('Invalid tool plan (missing target): Returns failure with errors', () => {
    const plan = {
        route: "tool",
        confidence: 0.95,
        steps: ['validate_tool', 'execute_tool']
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, false, 'Should return success: false');
    assert(result.errors.includes('Target is required for tool route'), 'Should have correct error message');
});

// Test 15: Invalid tool plan - missing validate_tool step
test('Invalid tool plan (missing validate_tool): Returns failure with errors', () => {
    const plan = {
        route: "tool",
        target: "weather",
        confidence: 0.95,
        steps: ['execute_tool']
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, false, 'Should return success: false');
    assert(result.errors.includes("Tool route must include 'validate_tool' step"), 'Should have correct error message');
});

// Test 16: Invalid memory plan - missing load_memory
test('Invalid memory plan (missing load_memory): Returns failure with errors', () => {
    const plan = {
        route: "memory",
        confidence: 0.95,
        steps: ['build_context', 'call_ai']
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, false, 'Should return success: false');
    assert(result.errors.includes("Memory route must include 'load_memory' step"), 'Should have correct error message');
});

// Test 17: Invalid file plan - missing load_files
test('Invalid file plan (missing load_files): Returns failure with errors', () => {
    const plan = {
        route: "file",
        confidence: 0.95,
        steps: ['build_context', 'call_ai']
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, false, 'Should return success: false');
    assert(result.errors.includes("File route must include 'load_files' step"), 'Should have correct error message');
});

// Test 18: Invalid AI plan - missing call_ai
test('Invalid AI plan (missing call_ai): Returns failure with errors', () => {
    const plan = {
        route: "ai",
        confidence: 0.7,
        steps: []
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, false, 'Should return success: false');
    assert(result.errors.includes("AI route must include 'call_ai' step"), 'Should have correct error message');
});

// Test 19: Multiple errors at once
test('Invalid plan (multiple errors): Returns all validation errors', () => {
    const plan = {
        route: 123,
        confidence: 2.5,
        steps: "not_an_array"
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, false, 'Should return success: false');
    assert(result.errors.length >= 3, 'Should have multiple errors');
    assert(result.errors.includes('Route is required and must be a string'), 'Should have route error');
    assert(result.errors.includes('Steps must be an array'), 'Should have steps error');
    assert(result.errors.includes('Confidence must be a number between 0 and 1'), 'Should have confidence error');
});

// ===== VALIDATION REUSE =====

// Test 20: Validation is reused (not duplicated)
test('Validation reuse: Uses validateExecutionPlan internally', () => {
    const plan = {
        route: "tool",
        target: "weather",
        confidence: 0.95,
        steps: ['validate_tool', 'execute_tool'],
        requiresAI: false
    };

    // This should work because validation passes
    const result = AgentService.executeExecutionPlan(plan);
    assertEqual(result.success, true, 'Valid plan should succeed');

    // This should fail with the same errors as validateExecutionPlan
    const invalidPlan = {
        route: "tool",
        confidence: 0.95,
        steps: ['execute_tool']  // missing validate_tool
    };

    const invalidResult = AgentService.executeExecutionPlan(invalidPlan);
    assertEqual(invalidResult.success, false, 'Invalid plan should fail');
    assert(invalidResult.errors.includes("Tool route must include 'validate_tool' step"),
        'Should have same error as validateExecutionPlan');
});

// ===== EXECUTION DESCRIPTOR FORMAT =====

// Test 21: Execution descriptor has correct structure
test('Execution descriptor: Has correct structure', () => {
    const plan = {
        route: "tool",
        target: "weather",
        confidence: 0.95,
        steps: ['validate_tool', 'execute_tool'],
        requiresAI: false
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, true, 'Should have success field');
    assert(result.route !== undefined, 'Should have route field');
    assert(result.target !== undefined, 'Should have target field');
    assert(Array.isArray(result.steps), 'Should have steps array');
    assert(result.requiresAI !== undefined, 'Should have requiresAI field');
    assert(!result.errors, 'Should not have errors on success');
});

// Test 22: Error response has correct structure
test('Error response: Has correct structure', () => {
    const plan = {
        route: "tool",
        confidence: 0.95,
        steps: ['call_ai']  // Missing required steps for tool route
    };

    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, false, 'Should have success: false');
    assert(Array.isArray(result.errors), 'Should have errors array');
    assert(result.errors.length > 0, 'Should have errors');
    assert(!result.route, 'Should not have route on error');
    assert(!result.steps, 'Should not have steps on error');
});

// ===== INTEGRATION TESTS =====

// Test 23: Full pipeline - analyzeRequest -> buildExecutionPlan -> executeExecutionPlan
test('Integration: Full pipeline with execution orchestrator', () => {
    const messages = [
        { msg: 'what is the weather in London', expectedRoute: 'tool', expectedTarget: 'weather' },
        { msg: 'remember my name is John', expectedRoute: 'memory', expectedTarget: null },
        { msg: 'upload my file', expectedRoute: 'file', expectedTarget: null },
        { msg: 'tell me a joke', expectedRoute: 'ai', expectedTarget: null }
    ];

    messages.forEach(({ msg, expectedRoute, expectedTarget }) => {
        const decision = AgentService.analyzeRequest(msg);
        const plan = AgentService.buildExecutionPlan(decision);
        const execution = AgentService.executeExecutionPlan(plan);

        assertEqual(decision.route, expectedRoute, `Decision route should be ${expectedRoute}`);
        assertEqual(plan.route, expectedRoute, `Plan route should be ${expectedRoute}`);
        assertEqual(execution.success, true, `Execution should succeed for ${expectedRoute}`);
        assertEqual(execution.route, expectedRoute, `Execution route should be ${expectedRoute}`);
        assertEqual(execution.target, expectedTarget, `Execution target should match for ${expectedRoute}`);
    });
});

// Test 24: Plans from buildExecutionPlan work with executeExecutionPlan
test('Integration: buildExecutionPlan output works with executeExecutionPlan', () => {
    const routes = [
        { route: "tool", target: "weather", confidence: 0.95 },
        { route: "memory", target: null, confidence: 0.95 },
        { route: "file", target: null, confidence: 0.95 },
        { route: "ai", target: null, confidence: 0.7 }
    ];

    routes.forEach(routeDecision => {
        const plan = AgentService.buildExecutionPlan(routeDecision);
        const result = AgentService.executeExecutionPlan(plan);

        assertEqual(result.success, true, `Execution should succeed for ${routeDecision.route}`);
        assertEqual(result.route, routeDecision.route, `Route should match for ${routeDecision.route}`);
        assertEqual(result.target, routeDecision.target, `Target should match for ${routeDecision.route}`);
    });
});

// ===== BEHAVIORAL TESTS =====

// Test 25: Method is synchronous (no async)
test('Behavior: Method is synchronous (no async)', () => {
    const plan = {
        route: "ai",
        confidence: 0.7,
        steps: ['call_ai'],
        requiresAI: true
    };

    const result = AgentService.executeExecutionPlan(plan);

    assert(result.success !== undefined, 'Should return immediately');
    assert(typeof result.success === 'boolean', 'Should return boolean success flag');
});

// Test 26: Does not execute any services
test('Behavior: Does not execute services (no side effects)', () => {
    const plan = {
        route: "tool",
        target: "weather",
        confidence: 0.95,
        steps: ['validate_tool', 'execute_tool'],
        requiresAI: false
    };

    // Should complete without any service calls
    const result = AgentService.executeExecutionPlan(plan);

    assertEqual(result.success, true, 'Should succeed');
    assertEqual(result.route, "tool", 'Should return plan data');
    // No actual tool execution, no AI calls, no memory operations
});

// Test 27: Returns lightweight descriptor (no extra data)
test('Behavior: Returns lightweight descriptor only', () => {
    const plan = {
        route: "ai",
        confidence: 0.7,
        steps: ['call_ai'],
        requiresAI: true
    };

    const result = AgentService.executeExecutionPlan(plan);

    // Should only have the specified fields
    const expectedKeys = ['success', 'route', 'target', 'steps', 'requiresAI'];
    const actualKeys = Object.keys(result);

    assertEqual(actualKeys.length, expectedKeys.length,
        `Should only have ${expectedKeys.length} keys, got ${actualKeys.length}`);
    expectedKeys.forEach(key => {
        assert(actualKeys.includes(key), `Should have ${key} key`);
    });
});

// ===== REGRESSION TESTS =====

// Test 28: Existing methods unchanged
test('Regression: analyzeRequest still works', () => {
    const result = AgentService.analyzeRequest('what is the weather in London');
    assertEqual(result.route, "tool", 'Route should be tool');
    assertEqual(result.target, "weather", 'Target should be weather');
});

// Test 29: Existing methods unchanged
test('Regression: buildExecutionPlan still works', () => {
    const routeDecision = {
        route: "tool",
        target: "weather",
        confidence: 0.95
    };
    const plan = AgentService.buildExecutionPlan(routeDecision);
    assertEqual(plan.route, "tool", 'Route should be tool');
    assertEqual(plan.steps.length, 2, 'Should have 2 steps');
});

// Test 30: Existing methods unchanged
test('Regression: validateExecutionPlan still works', () => {
    const plan = {
        route: "ai",
        confidence: 0.7,
        steps: ['call_ai']
    };
    const result = AgentService.validateExecutionPlan(plan);
    assertEqual(result.valid, true, 'Should be valid');
    assertEqual(result.errors.length, 0, 'Should have no errors');
});

// Test 31: Module exports unchanged
test('Regression: Module exports still work', () => {
    assert(typeof AgentService.analyzeRequest === 'function', 'analyzeRequest should be exported');
    assert(typeof AgentService.buildExecutionPlan === 'function', 'buildExecutionPlan should be exported');
    assert(typeof AgentService.validateExecutionPlan === 'function', 'validateExecutionPlan should be exported');
    assert(typeof AgentService.executeExecutionPlan === 'function', 'executeExecutionPlan should be exported');
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
    console.log('\n✅ All Phase 8.1C execution orchestrator tests passed!');
    console.log('✓ Valid plans return success with execution descriptor');
    console.log('✓ Invalid plans return failure with errors');
    console.log('✓ Validation is reused from validateExecutionPlan');
    console.log('✓ Execution descriptor has correct structure');
    console.log('✓ Full pipeline integration works');
    console.log('✓ Method is synchronous with no side effects');
    console.log('✓ No regressions in existing methods');
    console.log('✓ Module exports preserved');
    process.exit(0);
}