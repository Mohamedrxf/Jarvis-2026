// Test Phase 10.4B - Build Final Response
// Tests the buildFinalResponse method
// Pure transformation only - no execution, no dispatcher calls, no service calls, no async logic

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.4B: Build Final Response Tests ===\n');

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

// Test 1: Successful summary
test('Successful summary', () => {
    const agentSummary = {
        success: true,
        completed: 3,
        failed: 0,
        total: 3
    };

    const response = agentService.buildFinalResponse(agentSummary);

    assertEqual(response.success, true, 'Success should be true');
    assertEqual(response.response, "Execution completed successfully", 'Response message should indicate success');
    assertEqual(response.metadata, {
        completed: 3,
        failed: 0,
        total: 3
    }, 'Metadata should match expected');
});

// Test 2: Failed summary
test('Failed summary', () => {
    const agentSummary = {
        success: false,
        completed: 1,
        failed: 2,
        total: 3
    };

    const response = agentService.buildFinalResponse(agentSummary);

    assertEqual(response.success, false, 'Success should be false');
    assertEqual(response.response, "Execution completed with errors", 'Response message should indicate errors');
    assertEqual(response.metadata, {
        completed: 1,
        failed: 2,
        total: 3
    }, 'Metadata should match expected');
});

// Test 3: Invalid input - null
test('Invalid input - null', () => {
    const response = agentService.buildFinalResponse(null);

    assertEqual(response.success, false, 'Success should be false');
    assertEqual(response.response, "Invalid execution summary", 'Response should indicate invalid summary');
    assertEqual(response.metadata, null, 'Metadata should be null');
});

// Test 4: Invalid input - undefined
test('Invalid input - undefined', () => {
    const response = agentService.buildFinalResponse(undefined);

    assertEqual(response.success, false, 'Success should be false');
    assertEqual(response.response, "Invalid execution summary", 'Response should indicate invalid summary');
    assertEqual(response.metadata, null, 'Metadata should be null');
});

// Test 5: Invalid input - not an object
test('Invalid input - not an object', () => {
    const response = agentService.buildFinalResponse("invalid");

    assertEqual(response.success, false, 'Success should be false');
    assertEqual(response.response, "Invalid execution summary", 'Response should indicate invalid summary');
    assertEqual(response.metadata, null, 'Metadata should be null');
});

// Test 6: Invalid input - array
test('Invalid input - array', () => {
    const response = agentService.buildFinalResponse([]);

    assertEqual(response.success, false, 'Success should be false');
    assertEqual(response.response, "Invalid execution summary", 'Response should indicate invalid summary');
    assertEqual(response.metadata, null, 'Metadata should be null');
});

// Test 7: Invalid input - missing success property
test('Invalid input - missing success property', () => {
    const agentSummary = {
        completed: 1,
        failed: 0,
        total: 1
    };

    const response = agentService.buildFinalResponse(agentSummary);

    assertEqual(response.success, false, 'Success should be false');
    assertEqual(response.response, "Invalid execution summary", 'Response should indicate invalid summary');
    assertEqual(response.metadata, null, 'Metadata should be null');
});

// Test 8: Invalid input - missing completed property
test('Invalid input - missing completed property', () => {
    const agentSummary = {
        success: true,
        failed: 0,
        total: 1
    };

    const response = agentService.buildFinalResponse(agentSummary);

    assertEqual(response.success, false, 'Success should be false');
    assertEqual(response.response, "Invalid execution summary", 'Response should indicate invalid summary');
    assertEqual(response.metadata, null, 'Metadata should be null');
});

// Test 9: Invalid input - missing failed property
test('Invalid input - missing failed property', () => {
    const agentSummary = {
        success: true,
        completed: 1,
        total: 1
    };

    const response = agentService.buildFinalResponse(agentSummary);

    assertEqual(response.success, false, 'Success should be false');
    assertEqual(response.response, "Invalid execution summary", 'Response should indicate invalid summary');
    assertEqual(response.metadata, null, 'Metadata should be null');
});

// Test 10: Invalid input - missing total property
test('Invalid input - missing total property', () => {
    const agentSummary = {
        success: true,
        completed: 1,
        failed: 0
    };

    const response = agentService.buildFinalResponse(agentSummary);

    assertEqual(response.success, false, 'Success should be false');
    assertEqual(response.response, "Invalid execution summary", 'Response should indicate invalid summary');
    assertEqual(response.metadata, null, 'Metadata should be null');
});

// Test 11: Empty results - successful
test('Empty results - successful', () => {
    const agentSummary = {
        success: true,
        completed: 0,
        failed: 0,
        total: 0
    };

    const response = agentService.buildFinalResponse(agentSummary);

    assertEqual(response.success, true, 'Success should be true');
    assertEqual(response.response, "Execution completed successfully", 'Response message should indicate success');
    assertEqual(response.metadata, {
        completed: 0,
        failed: 0,
        total: 0
    }, 'Metadata should match expected');
});

// Test 12: Empty results - failed
test('Empty results - failed', () => {
    const agentSummary = {
        success: false,
        completed: 0,
        failed: 0,
        total: 0
    };

    const response = agentService.buildFinalResponse(agentSummary);

    assertEqual(response.success, false, 'Success should be false');
    assertEqual(response.response, "Execution completed with errors", 'Response message should indicate errors');
    assertEqual(response.metadata, {
        completed: 0,
        failed: 0,
        total: 0
    }, 'Metadata should match expected');
});

// Test 13: Metadata verification - all fields present
test('Metadata verification - all fields present', () => {
    const agentSummary = {
        success: true,
        completed: 5,
        failed: 2,
        total: 7
    };

    const response = agentService.buildFinalResponse(agentSummary);

    assertTrue(response.metadata.hasOwnProperty('completed'), 'Metadata should have completed property');
    assertTrue(response.metadata.hasOwnProperty('failed'), 'Metadata should have failed property');
    assertTrue(response.metadata.hasOwnProperty('total'), 'Metadata should have total property');
    assertEqual(response.metadata.completed, 5, 'Completed should be 5');
    assertEqual(response.metadata.failed, 2, 'Failed should be 2');
    assertEqual(response.metadata.total, 7, 'Total should be 7');
});

// Test 14: Integration with buildAgentSummary - successful execution
test('Integration with buildAgentSummary - successful execution', () => {
    const result = {
        success: true,
        completed: 2,
        failed: 0,
        total: 2,
        results: [
            { agent: "tool", success: true },
            { agent: "ai", success: true }
        ]
    };

    const report = agentService.buildExecutionReport(result);
    const summary = agentService.buildAgentSummary(report);

    // buildAgentSummary returns { valid, agents, successful, failed, overallSuccess }
    // buildFinalResponse expects { success, completed, failed, total }
    // So we need to map the properties
    const agentSummaryForFinalResponse = {
        success: summary.overallSuccess,
        completed: summary.successful,
        failed: summary.failed,
        total: summary.agents
    };

    const finalResponse = agentService.buildFinalResponse(agentSummaryForFinalResponse);

    assertEqual(finalResponse.success, true, 'Success should be true');
    assertEqual(finalResponse.response, "Execution completed successfully", 'Response message should indicate success');
    assertEqual(finalResponse.metadata, {
        completed: 2,
        failed: 0,
        total: 2
    }, 'Metadata should match expected');
});

// Test 15: Integration with buildAgentSummary - failed execution
test('Integration with buildAgentSummary - failed execution', () => {
    const result = {
        success: false,
        completed: 1,
        failed: 2,
        total: 3,
        results: [
            { agent: "tool", success: true },
            { agent: "memory", success: false },
            { agent: "ai", success: false }
        ]
    };

    const report = agentService.buildExecutionReport(result);
    const summary = agentService.buildAgentSummary(report);

    // Map buildAgentSummary output to buildFinalResponse input format
    const agentSummaryForFinalResponse = {
        success: summary.overallSuccess,
        completed: summary.successful,
        failed: summary.failed,
        total: summary.agents
    };

    const finalResponse = agentService.buildFinalResponse(agentSummaryForFinalResponse);

    assertEqual(finalResponse.success, false, 'Success should be false');
    assertEqual(finalResponse.response, "Execution completed with errors", 'Response message should indicate errors');
    assertEqual(finalResponse.metadata, {
        completed: 1,
        failed: 2,
        total: 3
    }, 'Metadata should match expected');
});

// Test 16: Integration with buildAgentSummary - invalid report
test('Integration with buildAgentSummary - invalid report', () => {
    const result = {
        success: true,
        completed: 1,
        failed: 0,
        total: 1,
        results: "invalid"
    };

    const report = agentService.buildExecutionReport(result);
    const summary = agentService.buildAgentSummary(report);

    // buildAgentSummary returns { valid: false, agents: [] } for invalid reports
    // This doesn't have the required properties for buildFinalResponse
    const finalResponse = agentService.buildFinalResponse(summary);

    assertEqual(finalResponse.success, false, 'Success should be false');
    assertEqual(finalResponse.response, "Invalid execution summary", 'Response should indicate invalid summary');
    assertEqual(finalResponse.metadata, null, 'Metadata should be null');
});

// Test 17: Integration with buildAgentSummary - null report
test('Integration with buildAgentSummary - null report', () => {
    const summary = agentService.buildAgentSummary(null);

    // buildAgentSummary returns { valid: false, agents: [] } for null
    // This doesn't have the required properties for buildFinalResponse
    const finalResponse = agentService.buildFinalResponse(summary);

    assertEqual(finalResponse.success, false, 'Success should be false');
    assertEqual(finalResponse.response, "Invalid execution summary", 'Response should indicate invalid summary');
    assertEqual(finalResponse.metadata, null, 'Metadata should be null');
});

// Test 18: Large numbers
test('Large numbers', () => {
    const agentSummary = {
        success: true,
        completed: 1000,
        failed: 500,
        total: 1500
    };

    const response = agentService.buildFinalResponse(agentSummary);

    assertEqual(response.success, true, 'Success should be true');
    assertEqual(response.metadata.completed, 1000, 'Completed should be 1000');
    assertEqual(response.metadata.failed, 500, 'Failed should be 500');
    assertEqual(response.metadata.total, 1500, 'Total should be 1500');
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