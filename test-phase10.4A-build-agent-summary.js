// Test Phase 10.4A - Build Agent Summary
// Tests the buildAgentSummary method
// Planning only - no execution, no dispatcher calls, no service calls, no async logic

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.4A: Build Agent Summary Tests ===\n');

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

// Test 1: Valid report - all successful
test('Valid report - all successful', () => {
    const report = {
        ready: true,
        summary: {
            success: true,
            totalAgents: 3,
            completedAgents: 3,
            failedAgents: 0
        }
    };

    const summary = agentService.buildAgentSummary(report);

    assertEqual(summary.valid, true, 'Valid should be true');
    assertEqual(summary.agents, 3, 'Agents should be 3');
    assertEqual(summary.successful, 3, 'Successful should be 3');
    assertEqual(summary.failed, 0, 'Failed should be 0');
    assertEqual(summary.overallSuccess, true, 'OverallSuccess should be true');
});

// Test 2: Valid report - mixed success/failure
test('Valid report - mixed success/failure', () => {
    const report = {
        ready: true,
        summary: {
            success: false,
            totalAgents: 3,
            completedAgents: 2,
            failedAgents: 1
        }
    };

    const summary = agentService.buildAgentSummary(report);

    assertEqual(summary.valid, true, 'Valid should be true');
    assertEqual(summary.agents, 3, 'Agents should be 3');
    assertEqual(summary.successful, 2, 'Successful should be 2');
    assertEqual(summary.failed, 1, 'Failed should be 1');
    assertEqual(summary.overallSuccess, false, 'OverallSuccess should be false');
});

// Test 3: Valid report - all failed
test('Valid report - all failed', () => {
    const report = {
        ready: true,
        summary: {
            success: false,
            totalAgents: 3,
            completedAgents: 0,
            failedAgents: 3
        }
    };

    const summary = agentService.buildAgentSummary(report);

    assertEqual(summary.valid, true, 'Valid should be true');
    assertEqual(summary.agents, 3, 'Agents should be 3');
    assertEqual(summary.successful, 0, 'Successful should be 0');
    assertEqual(summary.failed, 3, 'Failed should be 3');
    assertEqual(summary.overallSuccess, false, 'OverallSuccess should be false');
});

// Test 4: Valid report - single agent successful
test('Valid report - single agent successful', () => {
    const report = {
        ready: true,
        summary: {
            success: true,
            totalAgents: 1,
            completedAgents: 1,
            failedAgents: 0
        }
    };

    const summary = agentService.buildAgentSummary(report);

    assertEqual(summary.valid, true, 'Valid should be true');
    assertEqual(summary.agents, 1, 'Agents should be 1');
    assertEqual(summary.successful, 1, 'Successful should be 1');
    assertEqual(summary.failed, 0, 'Failed should be 0');
    assertEqual(summary.overallSuccess, true, 'OverallSuccess should be true');
});

// Test 5: Valid report - single agent failed
test('Valid report - single agent failed', () => {
    const report = {
        ready: true,
        summary: {
            success: false,
            totalAgents: 1,
            completedAgents: 0,
            failedAgents: 1
        }
    };

    const summary = agentService.buildAgentSummary(report);

    assertEqual(summary.valid, true, 'Valid should be true');
    assertEqual(summary.agents, 1, 'Agents should be 1');
    assertEqual(summary.successful, 0, 'Successful should be 0');
    assertEqual(summary.failed, 1, 'Failed should be 1');
    assertEqual(summary.overallSuccess, false, 'OverallSuccess should be false');
});

// Test 6: Valid report - empty agents
test('Valid report - empty agents', () => {
    const report = {
        ready: true,
        summary: {
            success: true,
            totalAgents: 0,
            completedAgents: 0,
            failedAgents: 0
        }
    };

    const summary = agentService.buildAgentSummary(report);

    assertEqual(summary.valid, true, 'Valid should be true');
    assertEqual(summary.agents, 0, 'Agents should be 0');
    assertEqual(summary.successful, 0, 'Successful should be 0');
    assertEqual(summary.failed, 0, 'Failed should be 0');
    assertEqual(summary.overallSuccess, true, 'OverallSuccess should be true');
});

// Test 7: Invalid - null report
test('Invalid - null report', () => {
    const summary = agentService.buildAgentSummary(null);

    assertEqual(summary.valid, false, 'Valid should be false');
    assertEqual(summary.agents, [], 'Agents should be empty array');
});

// Test 8: Invalid - undefined report
test('Invalid - undefined report', () => {
    const summary = agentService.buildAgentSummary(undefined);

    assertEqual(summary.valid, false, 'Valid should be false');
    assertEqual(summary.agents, [], 'Agents should be empty array');
});

// Test 9: Invalid - report.ready is false
test('Invalid - report.ready is false', () => {
    const report = {
        ready: false,
        summary: null
    };

    const summary = agentService.buildAgentSummary(report);

    assertEqual(summary.valid, false, 'Valid should be false');
    assertEqual(summary.agents, [], 'Agents should be empty array');
});

// Test 10: Integration - buildAgentSummary with buildExecutionReport (valid result)
test('Integration - buildAgentSummary with buildExecutionReport (valid result)', () => {
    const result = {
        success: false,
        completed: 2,
        failed: 1,
        total: 3,
        results: [
            { agent: "tool", success: true },
            { agent: "memory", success: true },
            { agent: "ai", success: false }
        ]
    };

    const report = agentService.buildExecutionReport(result);
    const summary = agentService.buildAgentSummary(report);

    assertEqual(summary.valid, true, 'Valid should be true');
    assertEqual(summary.agents, 3, 'Agents should be 3');
    assertEqual(summary.successful, 2, 'Successful should be 2');
    assertEqual(summary.failed, 1, 'Failed should be 1');
    assertEqual(summary.overallSuccess, false, 'OverallSuccess should be false');
});

// Test 11: Integration - buildAgentSummary with buildExecutionReport (invalid result)
test('Integration - buildAgentSummary with buildExecutionReport (invalid result)', () => {
    const result = {
        success: true,
        completed: 1,
        failed: 0,
        total: 1,
        results: "invalid"
    };

    const report = agentService.buildExecutionReport(result);
    const summary = agentService.buildAgentSummary(report);

    assertEqual(summary.valid, false, 'Valid should be false');
    assertEqual(summary.agents, [], 'Agents should be empty array');
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