// Test Phase 10.3B - Validate Execution Result
// Tests the validateExecutionResult method
// Validation only - no execution, no service calls, no async logic

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.3B: Validate Execution Result Tests ===\n');

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

// Test 1: Valid result - all successful
test('Valid result - all successful', () => {
    const result = {
        success: true,
        completed: 3,
        failed: 0,
        total: 3,
        results: [
            { agent: "tool", success: true },
            { agent: "memory", success: true },
            { agent: "ai", success: true }
        ]
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, true, 'Valid should be true');
    assertEqual(validation.errors, [], 'Errors should be empty');
});

// Test 2: Valid result - mixed success/failure
test('Valid result - mixed success/failure', () => {
    const result = {
        success: false,
        completed: 2,
        failed: 1,
        total: 3,
        results: [
            { agent: "tool", success: true },
            { agent: "memory", success: false },
            { agent: "ai", success: true }
        ]
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, true, 'Valid should be true');
    assertEqual(validation.errors, [], 'Errors should be empty');
});

// Test 3: Valid result - all failed
test('Valid result - all failed', () => {
    const result = {
        success: false,
        completed: 0,
        failed: 3,
        total: 3,
        results: [
            { agent: "tool", success: false },
            { agent: "memory", success: false },
            { agent: "ai", success: false }
        ]
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, true, 'Valid should be true');
    assertEqual(validation.errors, [], 'Errors should be empty');
});

// Test 4: Valid result - empty results
test('Valid result - empty results', () => {
    const result = {
        success: true,
        completed: 0,
        failed: 0,
        total: 0,
        results: []
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, true, 'Valid should be true');
    assertEqual(validation.errors, [], 'Errors should be empty');
});

// Test 5: Invalid - null result
test('Invalid - null result', () => {
    const validation = agentService.validateExecutionResult(null);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('Result must be an object'), 'Should have error: Result must be an object');
});

// Test 6: Invalid - undefined result
test('Invalid - undefined result', () => {
    const validation = agentService.validateExecutionResult(undefined);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('Result must be an object'), 'Should have error: Result must be an object');
});

// Test 7: Invalid - result is an array
test('Invalid - result is an array', () => {
    const validation = agentService.validateExecutionResult([]);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('Result must be an object'), 'Should have error: Result must be an object');
});

// Test 8: Invalid - success is not a boolean
test('Invalid - success is not a boolean', () => {
    const result = {
        success: "true",
        completed: 1,
        failed: 0,
        total: 1,
        results: []
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('success must be a boolean'), 'Should have error: success must be a boolean');
});

// Test 9: Invalid - completed is not a number
test('Invalid - completed is not a number', () => {
    const result = {
        success: true,
        completed: "1",
        failed: 0,
        total: 1,
        results: []
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('completed must be a number'), 'Should have error: completed must be a number');
});

// Test 10: Invalid - failed is not a number
test('Invalid - failed is not a number', () => {
    const result = {
        success: true,
        completed: 1,
        failed: "0",
        total: 1,
        results: []
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('failed must be a number'), 'Should have error: failed must be a number');
});

// Test 11: Invalid - total is not a number
test('Invalid - total is not a number', () => {
    const result = {
        success: true,
        completed: 1,
        failed: 0,
        total: "1",
        results: []
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('total must be a number'), 'Should have error: total must be a number');
});

// Test 12: Invalid - results is not an array
test('Invalid - results is not an array', () => {
    const result = {
        success: true,
        completed: 1,
        failed: 0,
        total: 1,
        results: "invalid"
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('results must be an array'), 'Should have error: results must be an array');
});

// Test 13: Invalid - completed + failed != total
test('Invalid - completed + failed != total', () => {
    const result = {
        success: true,
        completed: 2,
        failed: 1,
        total: 5,
        results: []
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('must equal total')), 'Should have error about completed + failed = total');
});

// Test 14: Invalid - missing success property
test('Invalid - missing success property', () => {
    const result = {
        completed: 1,
        failed: 0,
        total: 1,
        results: []
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('success must be a boolean'), 'Should have error: success must be a boolean');
});

// Test 15: Invalid - missing completed property
test('Invalid - missing completed property', () => {
    const result = {
        success: true,
        failed: 0,
        total: 1,
        results: []
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('completed must be a number'), 'Should have error: completed must be a number');
});

// Test 16: Invalid - missing failed property
test('Invalid - missing failed property', () => {
    const result = {
        success: true,
        completed: 1,
        total: 1,
        results: []
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('failed must be a number'), 'Should have error: failed must be a number');
});

// Test 17: Invalid - missing total property
test('Invalid - missing total property', () => {
    const result = {
        success: true,
        completed: 1,
        failed: 0,
        results: []
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('total must be a number'), 'Should have error: total must be a number');
});

// Test 18: Invalid - missing results property
test('Invalid - missing results property', () => {
    const result = {
        success: true,
        completed: 1,
        failed: 0,
        total: 1
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('results must be an array'), 'Should have error: results must be an array');
});

// Test 19: Multiple errors
test('Multiple errors - collects all validation errors', () => {
    const result = {
        success: "true",
        completed: "1",
        failed: 0,
        total: 1,
        results: "invalid"
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.length >= 3, 'Should have multiple errors');
    assertTrue(validation.errors.includes('success must be a boolean'), 'Should have error: success must be a boolean');
    assertTrue(validation.errors.includes('completed must be a number'), 'Should have error: completed must be a number');
    assertTrue(validation.errors.includes('results must be an array'), 'Should have error: results must be an array');
});

// Test 20: Valid result with null success (treated as invalid)
test('Invalid - success is null', () => {
    const result = {
        success: null,
        completed: 1,
        failed: 0,
        total: 1,
        results: []
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.includes('success must be a boolean'), 'Should have error: success must be a boolean');
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