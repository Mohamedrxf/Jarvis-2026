// Test Phase 10.4C - Validate Final Response
// Tests the validateFinalResponse method
// Validation only - no execution, no dispatcher calls, no service calls, no async logic

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.4C: Validate Final Response Tests ===\n');

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

// Test 1: Valid success response
test('Valid success response', () => {
    const response = {
        success: true,
        response: "Execution completed successfully",
        metadata: {
            completed: 3,
            failed: 0,
            total: 3
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, true, 'Valid should be true');
    assertEqual(validation.errors, [], 'Errors should be empty');
});

// Test 2: Valid failed response
test('Valid failed response', () => {
    const response = {
        success: false,
        response: "Execution completed with errors",
        metadata: {
            completed: 1,
            failed: 2,
            total: 3
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, true, 'Valid should be true');
    assertEqual(validation.errors, [], 'Errors should be empty');
});

// Test 3: Null metadata
test('Null metadata', () => {
    const response = {
        success: false,
        response: "Invalid execution summary",
        metadata: null
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, true, 'Valid should be true');
    assertEqual(validation.errors, [], 'Errors should be empty');
});

// Test 4: Invalid metadata - not an object
test('Invalid metadata - not an object', () => {
    const response = {
        success: true,
        response: "Execution completed successfully",
        metadata: "invalid"
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.length > 0, 'Should have errors');
    assertTrue(validation.errors.some(e => e.includes('metadata must be null or an object')), 'Should have metadata object error');
});

// Test 5: Invalid metadata - missing completed
test('Invalid metadata - missing completed', () => {
    const response = {
        success: true,
        response: "Execution completed successfully",
        metadata: {
            failed: 0,
            total: 3
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('metadata.completed must be a number')), 'Should have completed error');
});

// Test 6: Invalid metadata - missing failed
test('Invalid metadata - missing failed', () => {
    const response = {
        success: true,
        response: "Execution completed successfully",
        metadata: {
            completed: 3,
            total: 3
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('metadata.failed must be a number')), 'Should have failed error');
});

// Test 7: Invalid metadata - missing total
test('Invalid metadata - missing total', () => {
    const response = {
        success: true,
        response: "Execution completed successfully",
        metadata: {
            completed: 3,
            failed: 0
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('metadata.total must be a number')), 'Should have total error');
});

// Test 8: Invalid metadata - completed + failed != total
test('Invalid metadata - completed + failed != total', () => {
    const response = {
        success: true,
        response: "Execution completed successfully",
        metadata: {
            completed: 2,
            failed: 1,
            total: 5
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('must equal metadata.total')), 'Should have sum error');
});

// Test 9: Invalid response object - null
test('Invalid response object - null', () => {
    const validation = agentService.validateFinalResponse(null);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('Response must be an object')), 'Should have object error');
});

// Test 10: Invalid response object - undefined
test('Invalid response object - undefined', () => {
    const validation = agentService.validateFinalResponse(undefined);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('Response must be an object')), 'Should have object error');
});

// Test 11: Invalid response object - array
test('Invalid response object - array', () => {
    const validation = agentService.validateFinalResponse([]);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('Response must be an object')), 'Should have object error');
});

// Test 12: Invalid response object - string
test('Invalid response object - string', () => {
    const validation = agentService.validateFinalResponse("invalid");

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('Response must be an object')), 'Should have object error');
});

// Test 13: Invalid success type - not a boolean
test('Invalid success type - not a boolean', () => {
    const response = {
        success: "true",
        response: "Execution completed successfully",
        metadata: {
            completed: 3,
            failed: 0,
            total: 3
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('success must be a boolean')), 'Should have success error');
});

// Test 14: Invalid success type - missing success property
test('Invalid success type - missing success property', () => {
    const response = {
        response: "Execution completed successfully",
        metadata: {
            completed: 3,
            failed: 0,
            total: 3
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('success must be a boolean')), 'Should have success error');
});

// Test 15: Invalid response text - not a string
test('Invalid response text - not a string', () => {
    const response = {
        success: true,
        response: 123,
        metadata: {
            completed: 3,
            failed: 0,
            total: 3
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('response must be a string')), 'Should have response error');
});

// Test 16: Invalid response text - missing response property
test('Invalid response text - missing response property', () => {
    const response = {
        success: true,
        metadata: {
            completed: 3,
            failed: 0,
            total: 3
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('response must be a string')), 'Should have response error');
});

// Test 17: Invalid metadata - missing metadata property
test('Invalid metadata - missing metadata property', () => {
    const response = {
        success: true,
        response: "Execution completed successfully"
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('metadata must be present')), 'Should have metadata error');
});

// Test 18: Invalid metadata - completed is not a number
test('Invalid metadata - completed is not a number', () => {
    const response = {
        success: true,
        response: "Execution completed successfully",
        metadata: {
            completed: "3",
            failed: 0,
            total: 3
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('metadata.completed must be a number')), 'Should have completed error');
});

// Test 19: Invalid metadata - failed is not a number
test('Invalid metadata - failed is not a number', () => {
    const response = {
        success: true,
        response: "Execution completed successfully",
        metadata: {
            completed: 3,
            failed: "0",
            total: 3
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('metadata.failed must be a number')), 'Should have failed error');
});

// Test 20: Invalid metadata - total is not a number
test('Invalid metadata - total is not a number', () => {
    const response = {
        success: true,
        response: "Execution completed successfully",
        metadata: {
            completed: 3,
            failed: 0,
            total: "3"
        }
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('metadata.total must be a number')), 'Should have total error');
});

// Test 21: Integration with buildFinalResponse - valid response
test('Integration with buildFinalResponse - valid response', () => {
    const agentSummary = {
        success: true,
        completed: 2,
        failed: 0,
        total: 2
    };

    const response = agentService.buildFinalResponse(agentSummary);
    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, true, 'Valid should be true');
    assertEqual(validation.errors, [], 'Errors should be empty');
});

// Test 22: Integration with buildFinalResponse - invalid input
test('Integration with buildFinalResponse - invalid input', () => {
    const response = agentService.buildFinalResponse(null);
    const validation = agentService.validateFinalResponse(response);

    // buildFinalResponse returns a structurally valid response even for invalid input
    // The response object itself is valid, but indicates an error condition
    assertEqual(validation.valid, true, 'Response object should be structurally valid');
    assertEqual(response.success, false, 'Success should be false');
    assertEqual(response.response, "Invalid execution summary", 'Response should indicate invalid summary');
    assertEqual(response.metadata, null, 'Metadata should be null');
});

// Test 23: Integration with buildFinalResponse - full pipeline
test('Integration with buildFinalResponse - full pipeline', () => {
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
    const summary = agentService.buildAgentSummary(report);

    const agentSummaryForFinalResponse = {
        success: summary.overallSuccess,
        completed: summary.successful,
        failed: summary.failed,
        total: summary.agents
    };

    const response = agentService.buildFinalResponse(agentSummaryForFinalResponse);
    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, true, 'Valid should be true');
    assertEqual(validation.errors, [], 'Errors should be empty');
});

// Test 24: Empty metadata object
test('Empty metadata object', () => {
    const response = {
        success: true,
        response: "Execution completed successfully",
        metadata: {}
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.length >= 3, 'Should have at least 3 errors for missing properties');
});

// Test 25: Metadata with array instead of object
test('Metadata with array instead of object', () => {
    const response = {
        success: true,
        response: "Execution completed successfully",
        metadata: [1, 2, 3]
    };

    const validation = agentService.validateFinalResponse(response);

    assertEqual(validation.valid, false, 'Valid should be false');
    assertTrue(validation.errors.some(e => e.includes('metadata must be null or an object')), 'Should have metadata object error');
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