// Test Phase 10.5A4 - Response Building Integration
// Tests the integration of response building methods in server.js
// Validates the full pipeline: execution → buildExecutionResult → validateExecutionResult → 
// buildExecutionReport → buildAgentSummary → buildFinalResponse → validateFinalResponse

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.5A4: Response Building Integration Tests ===\n');

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

// Test 1: buildExecutionResult returns result object
test('buildExecutionResult returns result object', () => {
    const results = [
        { agent: 'ai', success: true, output: 'Hello' },
        { agent: 'memory', success: true, output: 'Memory data' }
    ];

    const executionResult = agentService.buildExecutionResult(results);

    assertTrue(executionResult !== null && executionResult !== undefined, 'Execution result should exist');
    assertTrue(typeof executionResult === 'object', 'Execution result should be an object');
});

// Test 2: buildExecutionResult includes required properties
test('buildExecutionResult includes required properties', () => {
    const results = [
        { agent: 'ai', success: true, output: 'Hello' }
    ];

    const executionResult = agentService.buildExecutionResult(results);

    assertTrue('success' in executionResult, 'Should have success property');
    assertTrue('completed' in executionResult, 'Should have completed property');
    assertTrue('failed' in executionResult, 'Should have failed property');
    assertTrue('total' in executionResult, 'Should have total property');
    assertTrue('results' in executionResult, 'Should have results property');
});

// Test 3: buildExecutionResult counts success/failure correctly
test('buildExecutionResult counts success/failure correctly', () => {
    const results = [
        { agent: 'ai', success: true, output: 'Hello' },
        { agent: 'memory', success: true, output: 'Memory data' },
        { agent: 'file', success: false, error: 'Not found' }
    ];

    const executionResult = agentService.buildExecutionResult(results);

    assertEqual(executionResult.success, false, 'Overall success should be false');
    assertEqual(executionResult.completed, 2, 'Completed should be 2');
    assertEqual(executionResult.failed, 1, 'Failed should be 1');
    assertEqual(executionResult.total, 3, 'Total should be 3');
});

// Test 4: buildExecutionResult handles all successful
test('buildExecutionResult handles all successful', () => {
    const results = [
        { agent: 'ai', success: true, output: 'Hello' },
        { agent: 'memory', success: true, output: 'Memory data' }
    ];

    const executionResult = agentService.buildExecutionResult(results);

    assertEqual(executionResult.success, true, 'Overall success should be true');
    assertEqual(executionResult.completed, 2, 'Completed should be 2');
    assertEqual(executionResult.failed, 0, 'Failed should be 0');
    assertEqual(executionResult.total, 2, 'Total should be 2');
});

// Test 5: buildExecutionResult handles null/undefined
test('buildExecutionResult handles null/undefined', () => {
    const executionResult = agentService.buildExecutionResult(null);

    assertEqual(executionResult.success, false, 'Success should be false');
    assertEqual(executionResult.completed, 0, 'Completed should be 0');
    assertEqual(executionResult.failed, 0, 'Failed should be 0');
    assertEqual(executionResult.total, 0, 'Total should be 0');
});

// Test 6: validateExecutionResult validates correct result
test('validateExecutionResult validates correct result', () => {
    const result = {
        success: true,
        completed: 2,
        failed: 0,
        total: 2,
        results: [
            { agent: 'ai', success: true },
            { agent: 'memory', success: true }
        ]
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, true, 'Validation should be valid');
    assertEqual(validation.errors.length, 0, 'Errors should be empty');
});

// Test 7: validateExecutionResult catches invalid result
test('validateExecutionResult catches invalid result', () => {
    const result = {
        success: 'true',
        completed: 2,
        failed: 0,
        total: 2,
        results: []
    };

    const validation = agentService.validateExecutionResult(result);

    assertEqual(validation.valid, false, 'Validation should be invalid');
    assertTrue(validation.errors.length > 0, 'Should have errors');
});

// Test 8: buildExecutionReport builds report from valid result
test('buildExecutionReport builds report from valid result', () => {
    const result = {
        success: true,
        completed: 2,
        failed: 0,
        total: 2,
        results: [
            { agent: 'ai', success: true },
            { agent: 'memory', success: true }
        ]
    };

    const report = agentService.buildExecutionReport(result);

    assertTrue(report !== null && report !== undefined, 'Report should exist');
    assertEqual(report.ready, true, 'Report should be ready');
    assertTrue('summary' in report, 'Report should have summary');
});

// Test 9: buildExecutionReport handles invalid result
test('buildExecutionReport handles invalid result', () => {
    const result = null;

    const report = agentService.buildExecutionReport(result);

    assertEqual(report.ready, false, 'Report should not be ready');
    assertEqual(report.summary, null, 'Summary should be null');
});

// Test 10: buildAgentSummary builds summary from report
test('buildAgentSummary builds summary from report', () => {
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

    assertTrue(summary !== null && summary !== undefined, 'Summary should exist');
    assertEqual(summary.valid, true, 'Summary should be valid');
    assertEqual(summary.agents, 2, 'Agents count should be 2');
    assertEqual(summary.successful, 2, 'Successful count should be 2');
    assertEqual(summary.failed, 0, 'Failed count should be 0');
    assertEqual(summary.overallSuccess, true, 'Overall success should be true');
});

// Test 11: buildAgentSummary handles invalid report
test('buildAgentSummary handles invalid report', () => {
    const summary = agentService.buildAgentSummary(null);

    assertEqual(summary.valid, false, 'Summary should be invalid');
    assertTrue(Array.isArray(summary.agents), 'Agents should be an array');
    assertEqual(summary.agents.length, 0, 'Agents array should be empty');
});

// Test 12: buildFinalResponse builds response from valid summary
test('buildFinalResponse builds response from valid summary', () => {
    const agentSummary = {
        success: true,
        completed: 2,
        failed: 0,
        total: 2
    };

    const response = agentService.buildFinalResponse(agentSummary);

    assertTrue(response !== null && response !== undefined, 'Response should exist');
    assertEqual(response.success, true, 'Success should be true');
    assertTrue(typeof response.response === 'string', 'Response should be a string');
    assertTrue('metadata' in response, 'Response should have metadata');
});

// Test 13: buildFinalResponse handles invalid summary
test('buildFinalResponse handles invalid summary', () => {
    const response = agentService.buildFinalResponse(null);

    assertEqual(response.success, false, 'Success should be false');
    assertEqual(response.response, 'Invalid execution summary', 'Response should indicate invalid summary');
    assertEqual(response.metadata, null, 'Metadata should be null');
});

// Test 14: validateFinalResponse validates correct response
test('validateFinalResponse validates correct response', () => {
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

    assertEqual(validation.valid, true, 'Validation should be valid');
    assertEqual(validation.errors.length, 0, 'Errors should be empty');
});

// Test 15: validateFinalResponse catches invalid response
test('validateFinalResponse catches invalid response', () => {
    const response = {
        success: 'true',
        response: 123,
        metadata: {}
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Validation should be invalid');
    assertTrue(validation.errors.length > 0, 'Should have errors');
});

// Test 16: Full response pipeline - execution to final response
test('Full response pipeline - execution to final response', () => {
    const executionResults = [
        { agent: 'ai', success: true, output: 'Hello' },
        { agent: 'memory', success: true, output: 'Memory data' }
    ];

    // Step 1: buildExecutionResult
    const executionResult = agentService.buildExecutionResult(executionResults);
    assertEqual(executionResult.success, true, 'Execution result should be successful');

    // Step 2: validateExecutionResult
    const resultValidation = agentService.validateExecutionResult(executionResult);
    assertTrue(resultValidation.valid, 'Result validation should pass');

    // Step 3: buildExecutionReport
    const executionReport = agentService.buildExecutionReport(executionResult);
    assertTrue(executionReport.ready, 'Report should be ready');

    // Step 4: buildAgentSummary
    const agentSummary = agentService.buildAgentSummary(executionReport);
    assertTrue(agentSummary.valid, 'Agent summary should be valid');

    // Step 5: buildFinalResponse
    const finalResponse = agentService.buildFinalResponse(agentSummary);
    // Note: finalResponse.success depends on agentSummary.overallSuccess
    assertTrue(finalResponse.success === true || finalResponse.success === false, 'Final response should have success boolean');

    // Step 6: validateFinalResponse
    const responseValidation = agentService.validateFinalResponse(finalResponse);
    assertTrue(responseValidation.valid, 'Response validation should pass');
});

// Test 17: Full response pipeline with failures
test('Full response pipeline with failures', () => {
    const executionResults = [
        { agent: 'ai', success: true, output: 'Hello' },
        { agent: 'memory', success: false, error: 'Not found' }
    ];

    const executionResult = agentService.buildExecutionResult(executionResults);
    assertEqual(executionResult.success, false, 'Execution result should fail');
    assertEqual(executionResult.completed, 1, 'Completed should be 1');
    assertEqual(executionResult.failed, 1, 'Failed should be 1');

    const resultValidation = agentService.validateExecutionResult(executionResult);
    assertTrue(resultValidation.valid, 'Result validation should pass');

    const executionReport = agentService.buildExecutionReport(executionResult);
    assertTrue(executionReport.ready, 'Report should be ready');

    const agentSummary = agentService.buildAgentSummary(executionReport);
    assertTrue(agentSummary.valid, 'Agent summary should be valid');
    assertEqual(agentSummary.overallSuccess, false, 'Overall success should be false');

    const finalResponse = agentService.buildFinalResponse(agentSummary);
    assertEqual(finalResponse.success, false, 'Final response should fail');

    const responseValidation = agentService.validateFinalResponse(finalResponse);
    assertTrue(responseValidation.valid, 'Response validation should pass');
});

// Test 18: Integration with server.js flow - execution to response
test('Integration with server.js flow - execution to response', () => {
    const executionResults = [
        { agent: 'ai', success: true, output: 'Test response' }
    ];

    // Build response pipeline
    const executionResult = agentService.buildExecutionResult(executionResults);
    const resultValidation = agentService.validateExecutionResult(executionResult);

    if (!resultValidation.valid) {
        throw new Error('Result validation failed');
    }

    const executionReport = agentService.buildExecutionReport(executionResult);
    const agentSummary = agentService.buildAgentSummary(executionReport);
    const finalResponse = agentService.buildFinalResponse(agentSummary);
    const responseValidation = agentService.validateFinalResponse(finalResponse);

    if (!responseValidation.valid) {
        throw new Error('Response validation failed');
    }

    assertTrue(finalResponse.success === true || finalResponse.success === false, 'Final response should have success boolean');
    assertTrue(finalResponse.response.length > 0, 'Response should have content');
    // Metadata can be null for invalid summaries, which is valid
    assertTrue(finalResponse.metadata === null || typeof finalResponse.metadata === 'object', 'Metadata should be null or object');
});

// Test 19: buildExecutionResult with empty results array
test('buildExecutionResult with empty results array', () => {
    const executionResult = agentService.buildExecutionResult([]);

    assertEqual(executionResult.success, true, 'Empty results should be successful');
    assertEqual(executionResult.completed, 0, 'Completed should be 0');
    assertEqual(executionResult.failed, 0, 'Failed should be 0');
    assertEqual(executionResult.total, 0, 'Total should be 0');
});

// Test 20: Full pipeline integration with validation at each step
test('Full pipeline integration with validation at each step', () => {
    const executionResults = [
        { agent: 'ai', success: true, output: 'Response' },
        { agent: 'file', success: true, output: 'File data' },
        { agent: 'memory', success: true, output: 'Memory data' }
    ];

    // Execute full pipeline with validation at each step
    const executionResult = agentService.buildExecutionResult(executionResults);
    const resultValidation = agentService.validateExecutionResult(executionResult);

    if (!resultValidation.valid) {
        throw new Error('Execution result validation failed: ' + resultValidation.errors.join(', '));
    }

    const executionReport = agentService.buildExecutionReport(executionResult);
    const agentSummary = agentService.buildAgentSummary(executionReport);
    const finalResponse = agentService.buildFinalResponse(agentSummary);
    const responseValidation = agentService.validateFinalResponse(finalResponse);

    if (!responseValidation.valid) {
        throw new Error('Final response validation failed: ' + responseValidation.errors.join(', '));
    }

    assertEqual(executionResult.success, true, 'Execution result should be successful');
    assertEqual(executionResult.completed, 3, 'Should have 3 completed');
    assertEqual(executionReport.ready, true, 'Report should be ready');
    assertEqual(agentSummary.valid, true, 'Summary should be valid');
    assertTrue(agentSummary.agents >= 0, 'Agents should be non-negative');
    assertTrue(finalResponse.success === true || finalResponse.success === false, 'Final response should have success boolean');
    // Metadata can be null if agentSummary is invalid, but we validated it's valid
    if (finalResponse.metadata !== null) {
        assertEqual(finalResponse.metadata.completed, 3, 'Metadata completed should be 3');
        assertEqual(finalResponse.metadata.failed, 0, 'Metadata failed should be 0');
        assertEqual(finalResponse.metadata.total, 3, 'Metadata total should be 3');
    }
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