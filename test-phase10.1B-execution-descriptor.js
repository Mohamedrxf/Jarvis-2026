// Test Phase 10.1B - Execution Descriptor Builder
// Tests the buildExecutionDescriptor method
// Planning only - no execution, no service calls, no async logic

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.1B: Execution Descriptor Builder Tests ===\n');

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

// Test 1: Valid pipeline - sequential mode
test('Valid pipeline - sequential mode', () => {
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

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, true, 'Ready should be true');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 1, 'Total stages should be 1');
    assertEqual(result.stages.length, 1, 'Stages array should have 1 element');
    assertEqual(result.stages[0].agent, 'tool', 'Stage agent should be tool');
});

// Test 2: Valid pipeline - parallel mode
test('Valid pipeline - parallel mode', () => {
    const pipeline = {
        sequential: false,
        parallel: true,
        stages: [
            {
                agent: 'memory',
                context: {
                    memory: true,
                    files: false,
                    previousResults: false
                }
            },
            {
                agent: 'file',
                context: {
                    memory: false,
                    files: true,
                    previousResults: false
                }
            }
        ]
    };

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, true, 'Ready should be true');
    assertEqual(result.mode, 'parallel', 'Mode should be parallel');
    assertEqual(result.totalStages, 2, 'Total stages should be 2');
    assertEqual(result.stages.length, 2, 'Stages array should have 2 elements');
});

// Test 3: Invalid pipeline - null input
test('Invalid pipeline - null input', () => {
    const result = agentService.buildExecutionDescriptor(null);

    assertEqual(result.ready, false, 'Ready should be false');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 0, 'Total stages should be 0');
    assertEqual(result.stages.length, 0, 'Stages array should be empty');
});

// Test 4: Invalid pipeline - missing stages
test('Invalid pipeline - missing stages property', () => {
    const pipeline = {
        sequential: true,
        parallel: false
    };

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, false, 'Ready should be false');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 0, 'Total stages should be 0');
    assertEqual(result.stages.length, 0, 'Stages array should be empty');
});

// Test 5: Invalid pipeline - stages not an array
test('Invalid pipeline - stages is not an array', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: 'invalid'
    };

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, false, 'Ready should be false');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 0, 'Total stages should be 0');
    assertEqual(result.stages.length, 0, 'Stages array should be empty');
});

// Test 6: Empty stages array
test('Valid pipeline - empty stages array', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: []
    };

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, true, 'Ready should be true');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 0, 'Total stages should be 0');
    assertEqual(result.stages.length, 0, 'Stages array should be empty');
});

// Test 7: Invalid pipeline - stage missing agent
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

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, false, 'Ready should be false');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 0, 'Total stages should be 0');
    assertEqual(result.stages.length, 0, 'Stages array should be empty');
});

// Test 8: Invalid pipeline - stage missing context
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

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, false, 'Ready should be false');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 0, 'Total stages should be 0');
    assertEqual(result.stages.length, 0, 'Stages array should be empty');
});

// Test 9: Invalid pipeline - invalid agent name
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

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, false, 'Ready should be false');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 0, 'Total stages should be 0');
    assertEqual(result.stages.length, 0, 'Stages array should be empty');
});

// Test 10: Valid pipeline - all agent types
test('Valid pipeline - all agent types', () => {
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
            },
            {
                agent: 'memory',
                context: {
                    memory: true,
                    files: false,
                    previousResults: false
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
                    previousResults: false
                }
            }
        ]
    };

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, true, 'Ready should be true');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 4, 'Total stages should be 4');
    assertEqual(result.stages.length, 4, 'Stages array should have 4 elements');

    const expectedAgents = ['tool', 'memory', 'file', 'ai'];
    result.stages.forEach((stage, index) => {
        assertEqual(stage.agent, expectedAgents[index], `Stage ${index} agent should be ${expectedAgents[index]}`);
    });
});

// Test 11: Valid pipeline - parallel mode with multiple stages
test('Valid pipeline - parallel mode with multiple stages', () => {
    const pipeline = {
        sequential: false,
        parallel: true,
        stages: [
            {
                agent: 'memory',
                context: {
                    memory: true,
                    files: false,
                    previousResults: false
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

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, true, 'Ready should be true');
    assertEqual(result.mode, 'parallel', 'Mode should be parallel');
    assertEqual(result.totalStages, 3, 'Total stages should be 3');
    assertEqual(result.stages.length, 3, 'Stages array should have 3 elements');
});

// Test 12: Invalid pipeline - not an object
test('Invalid pipeline - not an object (string)', () => {
    const result = agentService.buildExecutionDescriptor('invalid');

    assertEqual(result.ready, false, 'Ready should be false');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 0, 'Total stages should be 0');
    assertEqual(result.stages.length, 0, 'Stages array should be empty');
});

// Test 13: Invalid pipeline - not an object (array)
test('Invalid pipeline - not an object (array)', () => {
    const result = agentService.buildExecutionDescriptor([]);

    assertEqual(result.ready, false, 'Ready should be false');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 0, 'Total stages should be 0');
    assertEqual(result.stages.length, 0, 'Stages array should be empty');
});

// Test 14: Valid pipeline - single stage
test('Valid pipeline - single stage', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: [
            {
                agent: 'ai',
                context: {
                    memory: true,
                    files: false,
                    previousResults: false
                }
            }
        ]
    };

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, true, 'Ready should be true');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 1, 'Total stages should be 1');
    assertEqual(result.stages.length, 1, 'Stages array should have 1 element');
});

// Test 15: Valid pipeline - context properties preserved
test('Valid pipeline - context properties preserved', () => {
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
            }
        ]
    };

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, true, 'Ready should be true');
    assertEqual(result.stages[0].context.memory, true, 'Memory should be true');
    assertEqual(result.stages[0].context.files, true, 'Files should be true');
    assertEqual(result.stages[0].context.previousResults, true, 'Previous results should be true');
});

// Test 16: Invalid pipeline - multiple errors
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

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, false, 'Ready should be false');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential');
    assertEqual(result.totalStages, 0, 'Total stages should be 0');
    assertEqual(result.stages.length, 0, 'Stages array should be empty');
});

// Test 17: Valid pipeline - default sequential when both flags false
test('Valid pipeline - default sequential when both flags false', () => {
    const pipeline = {
        sequential: false,
        parallel: false,
        stages: [
            {
                agent: 'ai',
                context: {
                    memory: true,
                    files: false,
                    previousResults: false
                }
            }
        ]
    };

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, true, 'Ready should be true');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential when both flags are false');
    assertEqual(result.totalStages, 1, 'Total stages should be 1');
});

// Test 18: Valid pipeline - default sequential when flags missing
test('Valid pipeline - default sequential when flags missing', () => {
    const pipeline = {
        stages: [
            {
                agent: 'ai',
                context: {
                    memory: true,
                    files: false,
                    previousResults: false
                }
            }
        ]
    };

    const result = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(result.ready, true, 'Ready should be true');
    assertEqual(result.mode, 'sequential', 'Mode should be sequential when flags are missing');
    assertEqual(result.totalStages, 1, 'Total stages should be 1');
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