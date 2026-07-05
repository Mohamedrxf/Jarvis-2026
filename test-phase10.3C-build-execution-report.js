// Test Phase 10.3C - Build Execution Report
// Tests the buildExecutionReport method
// Planning/aggregation only - no execution, no service calls, no async logic

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.3C: Build Execution Report Tests ===\n');

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

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, true, 'Ready should be true');
    assertEqual(report.summary, {
        success: true,
        totalAgents: 3,
        completedAgents: 3,
        failedAgents: 0
    }, 'Summary should match expected');
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

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, true, 'Ready should be true');
    assertEqual(report.summary, {
        success: false,
        totalAgents: 3,
        completedAgents: 2,
        failedAgents: 1
    }, 'Summary should match expected');
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

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, true, 'Ready should be true');
    assertEqual(report.summary, {
        success: false,
        totalAgents: 3,
        completedAgents: 0,
        failedAgents: 3
    }, 'Summary should match expected');
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

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, true, 'Ready should be true');
    assertEqual(report.summary, {
        success: true,
        totalAgents: 0,
        completedAgents: 0,
        failedAgents: 0
    }, 'Summary should match expected');
});

// Test 5: Invalid - null result
test('Invalid - null result', () => {
    const report = agentService.buildExecutionReport(null);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
});

// Test 6: Invalid - undefined result
test('Invalid - undefined result', () => {
    const report = agentService.buildExecutionReport(undefined);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
});

// Test 7: Invalid - result is an array
test('Invalid - result is an array', () => {
    const report = agentService.buildExecutionReport([]);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
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

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
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

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
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

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
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

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
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

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
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

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
});

// Test 14: Invalid - missing success property
test('Invalid - missing success property', () => {
    const result = {
        completed: 1,
        failed: 0,
        total: 1,
        results: []
    };

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
});

// Test 15: Invalid - missing completed property
test('Invalid - missing completed property', () => {
    const result = {
        success: true,
        failed: 0,
        total: 1,
        results: []
    };

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
});

// Test 16: Invalid - missing failed property
test('Invalid - missing failed property', () => {
    const result = {
        success: true,
        completed: 1,
        total: 1,
        results: []
    };

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
});

// Test 17: Invalid - missing total property
test('Invalid - missing total property', () => {
    const result = {
        success: true,
        completed: 1,
        failed: 0,
        results: []
    };

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
});

// Test 18: Invalid - missing results property
test('Invalid - missing results property', () => {
    const result = {
        success: true,
        completed: 1,
        failed: 0,
        total: 1
    };

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, false, 'Ready should be false');
    assertEqual(report.summary, null, 'Summary should be null');
});

// Test 19: Valid result with single agent
test('Valid result - single agent successful', () => {
    const result = {
        success: true,
        completed: 1,
        failed: 0,
        total: 1,
        results: [
            { agent: "tool", success: true, output: "result" }
        ]
    };

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, true, 'Ready should be true');
    assertEqual(report.summary, {
        success: true,
        totalAgents: 1,
        completedAgents: 1,
        failedAgents: 0
    }, 'Summary should match expected');
});

// Test 20: Valid result with single failed agent
test('Valid result - single agent failed', () => {
    const result = {
        success: false,
        completed: 0,
        failed: 1,
        total: 1,
        results: [
            { agent: "tool", success: false, error: "error" }
        ]
    };

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, true, 'Ready should be true');
    assertEqual(report.summary, {
        success: false,
        totalAgents: 1,
        completedAgents: 0,
        failedAgents: 1
    }, 'Summary should match expected');
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