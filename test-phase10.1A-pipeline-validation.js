// Test Phase 10.1A - Execution Pipeline Validation
// Tests the validateExecutionPipeline method
// Validation only - no execution, no service calls, no async logic

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.1A: Execution Pipeline Validation Tests ===\n');

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
    if (actual !== expected) {
        throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
    }
}

function assertTrue(value, message) {
    if (!value) {
        throw new Error(message || 'Expected true but got false');
    }
}

function assertArrayLength(actual, expected, message) {
    if (actual.length !== expected) {
        throw new Error(`${message}\n  Expected length: ${expected}\n  Actual length: ${actual.length}`);
    }
}

// Test 1: Valid pipeline with single tool stage
test('Valid pipeline - single tool stage', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'tool',
                context: {
                    memory: false,
                    files: false,
                    previousResults: false
                }
            }
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, true, 'Pipeline should be valid');
    assertArrayLength(result.errors, 0, 'Should have no errors');
});

// Test 2: Valid pipeline with multiple stages
test('Valid pipeline - multiple stages with all agent types', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'tool',
                context: {
                    memory: true,
                    files: true,
                    previousResults: true
                }
            },
            {
                agent: 'memory',
                context: {
                    memory: true,
                    files: false,
                    previousResults: true
                }
            },
            {
                agent: 'file',
                context: {
                    memory: false,
                    files: true,
                    previousResults: false
                }
            },
            {
                agent: 'ai',
                context: {
                    memory: true,
                    files: false,
                    previousResults: true
                }
            }
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, true, 'Pipeline should be valid');
    assertArrayLength(result.errors, 0, 'Should have no errors');
});

// Test 3: Invalid pipeline - not an object (null)
test('Invalid pipeline - null input', () => {
    const result = agentService.validateExecutionPipeline(null);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertEqual(result.errors[0], 'Pipeline must be an object', 'Error message should match');
});

// Test 4: Invalid pipeline - not an object (string)
test('Invalid pipeline - string input', () => {
    const result = agentService.validateExecutionPipeline('invalid');

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertEqual(result.errors[0], 'Pipeline must be an object', 'Error message should match');
});

// Test 5: Invalid pipeline - not an object (array)
test('Invalid pipeline - array input', () => {
    const result = agentService.validateExecutionPipeline([]);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertEqual(result.errors[0], 'Pipeline must be an object', 'Error message should match');
});

// Test 6: Missing stages property
test('Invalid pipeline - missing stages property', () => {
    const pipeline = {
        sequential: true,
        parallel: false
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertEqual(result.errors[0], 'Stages must be an array', 'Error message should match');
});

// Test 7: Stages is not an array
test('Invalid pipeline - stages is not an array', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: 'invalid'
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertEqual(result.errors[0], 'Stages must be an array', 'Error message should match');
});

// Test 8: Empty stages array
test('Valid pipeline - empty stages array', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: []
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, true, 'Pipeline should be valid');
    assertArrayLength(result.errors, 0, 'Should have no errors');
});

// Test 9: Stage missing agent property
test('Invalid pipeline - stage missing agent property', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                context: {
                    memory: true,
                    files: false,
                    previousResults: false
                }
            }
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertEqual(result.errors[0], 'Stage 0 must have an agent property', 'Error message should match');
});

// Test 10: Stage missing context property
test('Invalid pipeline - stage missing context property', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'tool'
            }
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertEqual(result.errors[0], 'Stage 0 must have a context property', 'Error message should match');
});

// Test 11: Stage context missing memory property
test('Invalid pipeline - stage context missing memory property', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'tool',
                context: {
                    files: false,
                    previousResults: false
                }
            }
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertEqual(result.errors[0], 'Stage 0 context must have memory property', 'Error message should match');
});

// Test 12: Stage context missing files property
test('Invalid pipeline - stage context missing files property', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'tool',
                context: {
                    memory: true,
                    previousResults: false
                }
            }
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertEqual(result.errors[0], 'Stage 0 context must have files property', 'Error message should match');
});

// Test 13: Stage context missing previousResults property
test('Invalid pipeline - stage context missing previousResults property', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'tool',
                context: {
                    memory: true,
                    files: false
                }
            }
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertEqual(result.errors[0], 'Stage 0 context must have previousResults property', 'Error message should match');
});

// Test 14: Invalid agent name
test('Invalid pipeline - invalid agent name', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'invalid_agent',
                context: {
                    memory: true,
                    files: false,
                    previousResults: false
                }
            }
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertTrue(result.errors[0].includes('invalid agent name'), 'Error should mention invalid agent name');
    assertTrue(result.errors[0].includes('tool, memory, file, ai'), 'Error should list valid agents');
});

// Test 15: Stage is not an object
test('Invalid pipeline - stage is not an object', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            'invalid_stage'
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertEqual(result.errors[0], 'Stage 0 must be an object', 'Error message should match');
});

// Test 16: Context is not an object
test('Invalid pipeline - stage context is not an object', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'tool',
                context: 'invalid_context'
            }
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertArrayLength(result.errors, 1, 'Should have 1 error');
    assertEqual(result.errors[0], 'Stage 0 context must be an object', 'Error message should match');
});

// Test 17: Multiple validation errors
test('Invalid pipeline - multiple validation errors', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'invalid_agent',
                context: {
                    memory: true
                }
            },
            {
                agent: 'tool',
                context: 'invalid'
            },
            'not_an_object'
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, false, 'Pipeline should be invalid');
    assertTrue(result.errors.length >= 4, 'Should have at least 4 errors');

    // Check for specific errors (error message includes valid agents list)
    const hasInvalidAgentError = result.errors.some(error => error.includes('Stage 0 has invalid agent name: invalid_agent'));
    assertTrue(hasInvalidAgentError, 'Should have invalid agent error');

    assertTrue(result.errors.includes('Stage 0 context must have files property'), 'Should have missing files error');
    assertTrue(result.errors.includes('Stage 0 context must have previousResults property'), 'Should have missing previousResults error');
    assertTrue(result.errors.includes('Stage 1 context must be an object'), 'Should have invalid context error');
    assertTrue(result.errors.includes('Stage 2 must be an object'), 'Should have invalid stage error');
});

// Test 18: All valid agent names
test('Valid pipeline - all valid agent names accepted', () => {
    const validAgents = ['tool', 'memory', 'file', 'ai'];

    validAgents.forEach(agentName => {
        const pipeline = {
            sequential: true,
            parallel: false,
            stages: [
                {
                    agent: agentName,
                    context: {
                        memory: true,
                        files: true,
                        previousResults: true
                    }
                }
            ]
        };

        const result = agentService.validateExecutionPipeline(pipeline);
        assertEqual(result.valid, true, `Pipeline with agent '${agentName}' should be valid`);
        assertArrayLength(result.errors, 0, `Should have no errors for agent '${agentName}'`);
    });
});

// Test 19: Stage with null values
test('Valid pipeline - stage with null context values', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'tool',
                context: {
                    memory: null,
                    files: null,
                    previousResults: null
                }
            }
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, true, 'Pipeline should be valid');
    assertArrayLength(result.errors, 0, 'Should have no errors');
});

// Test 20: Stage with undefined values
test('Valid pipeline - stage with undefined context values', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'tool',
                context: {
                    memory: undefined,
                    files: undefined,
                    previousResults: undefined
                }
            }
        ]
    };

    const result = agentService.validateExecutionPipeline(pipeline);

    assertEqual(result.valid, true, 'Pipeline should be valid');
    assertArrayLength(result.errors, 0, 'Should have no errors');
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