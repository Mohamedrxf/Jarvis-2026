// Test Phase 10.5A1 - Plan Integration
// Tests the integration of buildExecutionPlan() and validateExecutionPlan() in server.js
// Validates that plan building and validation occur after analyzeRequest() and before execution

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.5A1: Plan Integration Tests ===\n');

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

// Test 1: buildExecutionPlan returns a plan object
test('buildExecutionPlan returns a plan object', () => {
    const routeDecision = {
        route: 'ai',
        confidence: 0.9,
        reasoning: 'General AI query'
    };

    const plan = agentService.buildExecutionPlan(routeDecision);

    assertTrue(plan !== null && plan !== undefined, 'Plan should not be null or undefined');
    assertTrue(typeof plan === 'object', 'Plan should be an object');
});

// Test 2: buildExecutionPlan includes required properties
test('buildExecutionPlan includes required properties', () => {
    const routeDecision = {
        route: 'ai',
        confidence: 0.9,
        reasoning: 'General AI query'
    };

    const plan = agentService.buildExecutionPlan(routeDecision);

    assertTrue('route' in plan, 'Plan should have route property');
    assertTrue('steps' in plan, 'Plan should have steps property');
    assertTrue('context' in plan, 'Plan should have context property');
});

// Test 3: validateExecutionPlan returns valid for valid plan
test('validateExecutionPlan returns valid for valid plan', () => {
    const routeDecision = {
        route: 'ai',
        confidence: 0.9,
        reasoning: 'General AI query'
    };

    const plan = agentService.buildExecutionPlan(routeDecision);
    const validation = agentService.validateExecutionPlan(plan);

    assertEqual(validation.valid, true, 'Validation should be valid');
    assertEqual(validation.errors, [], 'Errors should be empty');
});

// Test 4: validateExecutionPlan returns invalid for null plan
test('validateExecutionPlan returns invalid for null plan', () => {
    const validation = agentService.validateExecutionPlan(null);

    assertEqual(validation.valid, false, 'Validation should be invalid');
    assertTrue(validation.errors.length > 0, 'Should have errors');
    assertTrue(validation.errors.some(e => e.includes('Plan must be an object')), 'Should have object error');
});

// Test 5: validateExecutionPlan returns invalid for undefined plan
test('validateExecutionPlan returns invalid for undefined plan', () => {
    const validation = agentService.validateExecutionPlan(undefined);

    assertEqual(validation.valid, false, 'Validation should be invalid');
    assertTrue(validation.errors.length > 0, 'Should have errors');
});

// Test 6: validateExecutionPlan returns invalid for plan without route
test('validateExecutionPlan returns invalid for plan without route', () => {
    const plan = {
        steps: [],
        context: {}
    };

    const validation = agentService.validateExecutionPlan(plan);

    assertEqual(validation.valid, false, 'Validation should be invalid');
    assertTrue(validation.errors.some(e => e.includes('route')), 'Should have route error');
});

// Test 7: validateExecutionPlan returns invalid for plan without steps
test('validateExecutionPlan returns invalid for plan without steps', () => {
    const plan = {
        route: 'ai',
        context: {}
    };

    const validation = agentService.validateExecutionPlan(plan);

    assertEqual(validation.valid, false, 'Validation should be invalid');
    assertTrue(validation.errors.some(e => e.includes('steps')), 'Should have steps error');
});

// Test 8: validateExecutionPlan returns invalid for plan without context
test('validateExecutionPlan returns invalid for plan without context', () => {
    const plan = {
        route: 'ai',
        steps: []
    };

    const validation = agentService.validateExecutionPlan(plan);

    assertEqual(validation.valid, false, 'Validation should be invalid');
    assertTrue(validation.errors.some(e => e.includes('context')), 'Should have context error');
});

// Test 9: validateExecutionPlan returns invalid for non-array steps
test('validateExecutionPlan returns invalid for non-array steps', () => {
    const plan = {
        route: 'ai',
        steps: 'invalid',
        context: {}
    };

    const validation = agentService.validateExecutionPlan(plan);

    assertEqual(validation.valid, false, 'Validation should be invalid');
    assertTrue(validation.errors.some(e => e.includes('steps must be an array')), 'Should have steps array error');
});

// Test 10: validateExecutionPlan returns invalid for non-object context
test('validateExecutionPlan returns invalid for non-object context', () => {
    const plan = {
        route: 'ai',
        steps: [],
        context: 'invalid'
    };

    const validation = agentService.validateExecutionPlan(plan);

    assertEqual(validation.valid, false, 'Validation should be invalid');
    assertTrue(validation.errors.some(e => e.includes('context must be an object')), 'Should have context object error');
});

// Test 11: Full pipeline - analyzeRequest -> buildExecutionPlan -> validateExecutionPlan
test('Full pipeline - analyzeRequest -> buildExecutionPlan -> validateExecutionPlan', () => {
    const userContent = 'What is the weather in London?';

    // Step 1: analyzeRequest
    const routeDecision = agentService.analyzeRequest(userContent);
    assertTrue(routeDecision !== null && routeDecision !== undefined, 'Route decision should exist');

    // Step 2: buildExecutionPlan
    const plan = agentService.buildExecutionPlan(routeDecision);
    assertTrue(plan !== null && plan !== undefined, 'Plan should exist');

    // Step 3: validateExecutionPlan
    const validation = agentService.validateExecutionPlan(plan);
    assertEqual(validation.valid, true, 'Validation should be valid');
    assertEqual(validation.errors, [], 'Errors should be empty');
});

// Test 12: Full pipeline with AI query
test('Full pipeline with AI query', () => {
    const userContent = 'Tell me about artificial intelligence';

    const routeDecision = agentService.analyzeRequest(userContent);
    const plan = agentService.buildExecutionPlan(routeDecision);
    const validation = agentService.validateExecutionPlan(plan);

    assertEqual(validation.valid, true, 'Validation should be valid');
    assertEqual(plan.route, 'ai', 'Plan route should be ai');
});

// Test 13: Full pipeline with memory query
test('Full pipeline with memory query', () => {
    const userContent = 'What do you remember about my preferences?';

    const routeDecision = agentService.analyzeRequest(userContent);
    const plan = agentService.buildExecutionPlan(routeDecision);
    const validation = agentService.validateExecutionPlan(plan);

    assertEqual(validation.valid, true, 'Validation should be valid');
    assertEqual(plan.route, 'memory', 'Plan route should be memory');
});

// Test 14: Full pipeline with file query
test('Full pipeline with file query', () => {
    const userContent = 'show my files';

    const routeDecision = agentService.analyzeRequest(userContent);
    const plan = agentService.buildExecutionPlan(routeDecision);
    const validation = agentService.validateExecutionPlan(plan);

    assertEqual(validation.valid, true, 'Validation should be valid');
    assertEqual(plan.route, 'file', 'Plan route should be file');
});

// Test 15: Validation error handling - invalid plan structure
test('Validation error handling - invalid plan structure', () => {
    const invalidPlan = {
        route: 'ai'
        // Missing steps and context
    };

    const validation = agentService.validateExecutionPlan(invalidPlan);

    assertEqual(validation.valid, false, 'Validation should be invalid');
    assertTrue(validation.errors.length >= 2, 'Should have at least 2 errors');
    assertTrue(validation.error !== undefined || validation.errors.length > 0, 'Should have error message');
});

// Test 16: Plan steps are validated correctly
test('Plan steps are validated correctly', () => {
    const routeDecision = {
        route: 'ai',
        confidence: 0.9,
        reasoning: 'General AI query'
    };

    const plan = agentService.buildExecutionPlan(routeDecision);

    assertTrue(Array.isArray(plan.steps), 'Steps should be an array');
    assertTrue(plan.steps.length > 0, 'Steps should not be empty');
});

// Test 17: Plan context is validated correctly
test('Plan context is validated correctly', () => {
    const routeDecision = {
        route: 'ai',
        confidence: 0.9,
        reasoning: 'General AI query'
    };

    const plan = agentService.buildExecutionPlan(routeDecision);

    assertTrue(typeof plan.context === 'object', 'Context should be an object');
    assertTrue(plan.context !== null, 'Context should not be null');
});

// Test 18: Integration with buildResponseStrategy after validation
test('Integration with buildResponseStrategy after validation', () => {
    const userContent = 'What is 2 + 2?';

    const routeDecision = agentService.analyzeRequest(userContent);
    const plan = agentService.buildExecutionPlan(routeDecision);
    const validation = agentService.validateExecutionPlan(plan);

    // Only proceed if validation passes
    if (validation.valid) {
        const responseStrategy = agentService.buildResponseStrategy(plan.route);
        assertTrue(responseStrategy !== null && responseStrategy !== undefined, 'Response strategy should exist');
        assertTrue('type' in responseStrategy, 'Response strategy should have type');
    } else {
        throw new Error('Validation failed: ' + validation.errors.join(', '));
    }
});

// Test 19: Error propagation when validation fails
test('Error propagation when validation fails', () => {
    const invalidPlan = null;
    const validation = agentService.validateExecutionPlan(invalidPlan);

    assertEqual(validation.valid, false, 'Validation should be invalid');
    assertTrue(validation.errors.length > 0, 'Should have errors');

    // Simulate error handling logic from server.js
    if (!validation.valid) {
        const errorMessage = validation.error || 'Execution plan validation failed';
        assertTrue(errorMessage.length > 0, 'Error message should not be empty');
    }
});

// Test 20: Multiple route types produce valid plans
test('Multiple route types produce valid plans', () => {
    const testCases = [
        { input: 'What is the weather in London?', expectedRoute: 'tool' },
        { input: 'Remember my name is John', expectedRoute: 'memory' },
        { input: 'show my files', expectedRoute: 'file' },
        { input: 'Hello, how are you?', expectedRoute: 'ai' }
    ];

    testCases.forEach(testCase => {
        const routeDecision = agentService.analyzeRequest(testCase.input);
        const plan = agentService.buildExecutionPlan(routeDecision);
        const validation = agentService.validateExecutionPlan(plan);

        assertEqual(validation.valid, true, `Validation should be valid for route: ${testCase.expectedRoute}`);
        assertEqual(plan.route, testCase.expectedRoute, `Plan route should match for input: ${testCase.input}`);
    });
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}