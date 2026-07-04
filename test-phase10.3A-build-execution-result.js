// Test Phase 10.3A - Build Execution Result
// Tests the buildExecutionResult method
// Planning/aggregation only - no execution, no service calls, no async logic

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.3A: Build Execution Result Tests ===\n');

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

// Test 1: All successful results
test('All successful results - success=true, completed=3, failed=0', () => {
    const results = [
        { agent: "tool", success: true, output: "result1" },
        { agent: "memory", success: true, output: "result2" },
        { agent: "ai", success: true, output: "result3" }
    ];

    const result = agentService.buildExecutionResult(results);

    assertEqual(result.success, true, 'Success should be true');
    assertEqual(result.completed, 3, 'Completed should be 3');
    assertEqual(result.failed, 0, 'Failed should be 0');
    assertEqual(result.total, 3, 'Total should be 3');
    assertEqual(result.results, results, 'Results should be preserved');
});

// Test 2: All failed results
test('All failed results - success=false, completed=0, failed=3', () => {
    const results = [
        { agent: "tool", success: false, error: "error1" },
        { agent: "memory", success: false, error: "error2" },
        { agent: "ai", success: false, error: "error3" }
    ];

    const result = agentService.buildExecutionResult(results);

    assertEqual(result.success, false, 'Success should be false');
    assertEqual(result.completed, 0, 'Completed should be 0');
    assertEqual(result.failed, 3, 'Failed should be 3');
    assertEqual(result.total, 3, 'Total should be 3');
    assertEqual(result.results, results, 'Results should be preserved');
});

// Test 3: Mixed results
test('Mixed results - success=false, completed=2, failed=1', () => {
    const results = [
        { agent: "tool", success: true, output: "result1" },
        { agent: "memory", success: false, error: "error1" },
        { agent: "ai", success: true, output: "result2" }
    ];

    const result = agentService.buildExecutionResult(results);

    assertEqual(result.success, false, 'Success should be false');
    assertEqual(result.completed, 2, 'Completed should be 2');
    assertEqual(result.failed, 1, 'Failed should be 1');
    assertEqual(result.total, 3, 'Total should be 3');
    assertEqual(result.results, results, 'Results should be preserved');
});

// Test 4: Empty results array
test('Empty results array - success=true, completed=0, failed=0', () => {
    const results = [];

    const result = agentService.buildExecutionResult(results);

    assertEqual(result.success, true, 'Success should be true (no failures)');
    assertEqual(result.completed, 0, 'Completed should be 0');
    assertEqual(result.failed, 0, 'Failed should be 0');
    assertEqual(result.total, 0, 'Total should be 0');
    assertEqual(result.results, results, 'Results should be preserved');
});

// Test 5: Null results
test('Null results - returns default failure object', () => {
    const result = agentService.buildExecutionResult(null);

    assertEqual(result.success, false, 'Success should be false');
    assertEqual(result.completed, 0, 'Completed should be 0');
    assertEqual(result.failed, 0, 'Failed should be 0');
    assertEqual(result.total, 0, 'Total should be 0');
    assertEqual(result.results, [], 'Results should be empty array');
});

// Test 6: Undefined results
test('Undefined results - returns default failure object', () => {
    const result = agentService.buildExecutionResult(undefined);

    assertEqual(result.success, false, 'Success should be false');
    assertEqual(result.completed, 0, 'Completed should be 0');
    assertEqual(result.failed, 0, 'Failed should be 0');
    assertEqual(result.total, 0, 'Total should be 0');
    assertEqual(result.results, [], 'Results should be empty array');
});

// Test 7: Single successful result
test('Single successful result - success=true, completed=1, failed=0', () => {
    const results = [
        { agent: "tool", success: true, output: "result1" }
    ];

    const result = agentService.buildExecutionResult(results);

    assertEqual(result.success, true, 'Success should be true');
    assertEqual(result.completed, 1, 'Completed should be 1');
    assertEqual(result.failed, 0, 'Failed should be 0');
    assertEqual(result.total, 1, 'Total should be 1');
});

// Test 8: Single failed result
test('Single failed result - success=false, completed=0, failed=1', () => {
    const results = [
        { agent: "tool", success: false, error: "error1" }
    ];

    const result = agentService.buildExecutionResult(results);

    assertEqual(result.success, false, 'Success should be false');
    assertEqual(result.completed, 0, 'Completed should be 0');
    assertEqual(result.failed, 1, 'Failed should be 1');
    assertEqual(result.total, 1, 'Total should be 1');
});

// Test 9: Results with undefined success property (treated as failed)
test('Results with undefined success property - treated as failed', () => {
    const results = [
        { agent: "tool", success: true, output: "result1" },
        { agent: "memory", output: "result2" }, // No success property
        { agent: "ai", success: true, output: "result3" }
    ];

    const result = agentService.buildExecutionResult(results);

    assertEqual(result.success, false, 'Success should be false');
    assertEqual(result.completed, 2, 'Completed should be 2');
    assertEqual(result.failed, 1, 'Failed should be 1');
    assertEqual(result.total, 3, 'Total should be 3');
});

// Test 10: Results with null success property (treated as failed)
test('Results with null success property - treated as failed', () => {
    const results = [
        { agent: "tool", success: true, output: "result1" },
        { agent: "memory", success: null, error: "error1" },
        { agent: "ai", success: true, output: "result3" }
    ];

    const result = agentService.buildExecutionResult(results);

    assertEqual(result.success, false, 'Success should be false');
    assertEqual(result.completed, 2, 'Completed should be 2');
    assertEqual(result.failed, 1, 'Failed should be 1');
    assertEqual(result.total, 3, 'Total should be 3');
});

// Test 11: Not an array (string)
test('Not an array (string) - returns default failure object', () => {
    const result = agentService.buildExecutionResult("invalid");

    assertEqual(result.success, false, 'Success should be false');
    assertEqual(result.completed, 0, 'Completed should be 0');
    assertEqual(result.failed, 0, 'Failed should be 0');
    assertEqual(result.total, 0, 'Total should be 0');
    assertEqual(result.results, [], 'Results should be empty array');
});

// Test 12: Not an array (object)
test('Not an array (object) - returns default failure object', () => {
    const result = agentService.buildExecutionResult({ invalid: "object" });

    assertEqual(result.success, false, 'Success should be false');
    assertEqual(result.completed, 0, 'Completed should be 0');
    assertEqual(result.failed, 0, 'Failed should be 0');
    assertEqual(result.total, 0, 'Total should be 0');
    assertEqual(result.results, [], 'Results should be empty array');
});

// Test 13: Large result set - all successful
test('Large result set (10 agents) - all successful', () => {
    const results = [];
    for (let i = 0; i < 10; i++) {
        results.push({ agent: `agent${i}`, success: true, output: `result${i}` });
    }

    const result = agentService.buildExecutionResult(results);

    assertEqual(result.success, true, 'Success should be true');
    assertEqual(result.completed, 10, 'Completed should be 10');
    assertEqual(result.failed, 0, 'Failed should be 0');
    assertEqual(result.total, 10, 'Total should be 10');
});

// Test 14: Large result set - all failed
test('Large result set (10 agents) - all failed', () => {
    const results = [];
    for (let i = 0; i < 10; i++) {
        results.push({ agent: `agent${i}`, success: false, error: `error${i}` });
    }

    const result = agentService.buildExecutionResult(results);

    assertEqual(result.success, false, 'Success should be false');
    assertEqual(result.completed, 0, 'Completed should be 0');
    assertEqual(result.failed, 10, 'Failed should be 10');
    assertEqual(result.total, 10, 'Total should be 10');
});

// Test 15: Results with null entries in array
test('Results with null entries - treated as failed', () => {
    const results = [
        { agent: "tool", success: true, output: "result1" },
        null,
        { agent: "ai", success: true, output: "result3" }
    ];

    const result = agentService.buildExecutionResult(results);

    assertEqual(result.success, false, 'Success should be false');
    assertEqual(result.completed, 2, 'Completed should be 2');
    assertEqual(result.failed, 1, 'Failed should be 1');
    assertEqual(result.total, 3, 'Total should be 3');
});

// Summary
console.log('\n=== Test Summary ===');
const allTests = [
    { name: 'All successful results', pass: testsPassed > 0 },
    { name: 'All failed results', pass: testsPassed > 1 },
    { name: 'Mixed results', pass: testsPassed > 2 },
    { name: 'Empty results array', pass: testsPassed > 3 },
    { name: 'Null results', pass: testsPassed > 4 },
    { name: 'Undefined results', pass: testsPassed > 5 },
    { name: 'Single successful result', pass: testsPassed > 6 },
    { name: 'Single failed result', pass: testsPassed > 7 },
    { name: 'Results with undefined success property', pass: testsPassed > 8 },
    { name: 'Results with null success property', pass: testsPassed > 9 },
    { name: 'Not an array (string)', pass: testsPassed > 10 },
    { name: 'Not an array (object)', pass: testsPassed > 11 },
    { name: 'Large result set (10 agents) - all successful', pass: testsPassed > 12 },
    { name: 'Large result set (10 agents) - all failed', pass: testsPassed > 13 },
    { name: 'Results with null entries in array', pass: testsPassed > 14 }
];

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