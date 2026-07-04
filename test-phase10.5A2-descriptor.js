// Test Phase 10.5A2 - Descriptor Integration
// Tests the integration of buildExecutionDescriptor() in server.js
// Validates that descriptor building occurs after plan validation and before execution

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.5A2: Descriptor Integration Tests ===\n');

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

// Test 1: buildExecutionDescriptor returns a descriptor object
test('buildExecutionDescriptor returns a descriptor object', () => {
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

    const descriptor = agentService.buildExecutionDescriptor(pipeline);

    assertTrue(descriptor !== null && descriptor !== undefined, 'Descriptor should not be null or undefined');
    assertTrue(typeof descriptor === 'object', 'Descriptor should be an object');
});

// Test 2: buildExecutionDescriptor includes required properties
test('buildExecutionDescriptor includes required properties', () => {
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

    const descriptor = agentService.buildExecutionDescriptor(pipeline);

    assertTrue('ready' in descriptor, 'Descriptor should have ready property');
    assertTrue('mode' in descriptor, 'Descriptor should have mode property');
    assertTrue('totalStages' in descriptor, 'Descriptor should have totalStages property');
    assertTrue('stages' in descriptor, 'Descriptor should have stages property');
});

// Test 3: buildExecutionDescriptor returns ready=true for valid pipeline
test('buildExecutionDescriptor returns ready=true for valid pipeline', () => {
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

    const descriptor = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(descriptor.ready, true, 'Descriptor should be ready');
    assertEqual(descriptor.mode, 'sequential', 'Mode should be sequential');
});

// Test 4: buildExecutionDescriptor returns ready=false for invalid pipeline
test('buildExecutionDescriptor returns ready=false for invalid pipeline', () => {
    const invalidPipeline = {
        stages: 'invalid'
    };

    const descriptor = agentService.buildExecutionDescriptor(invalidPipeline);

    assertEqual(descriptor.ready, false, 'Descriptor should not be ready');
    assertEqual(descriptor.totalStages, 0, 'Total stages should be 0');
    assertEqual(descriptor.stages.length, 0, 'Stages should be empty');
});

// Test 5: buildExecutionDescriptor handles null pipeline
test('buildExecutionDescriptor handles null pipeline', () => {
    const descriptor = agentService.buildExecutionDescriptor(null);

    assertEqual(descriptor.ready, false, 'Descriptor should not be ready');
    assertEqual(descriptor.totalStages, 0, 'Total stages should be 0');
    assertEqual(descriptor.stages.length, 0, 'Stages should be empty');
});

// Test 6: buildExecutionDescriptor handles undefined pipeline
test('buildExecutionDescriptor handles undefined pipeline', () => {
    const descriptor = agentService.buildExecutionDescriptor(undefined);

    assertEqual(descriptor.ready, false, 'Descriptor should not be ready');
    assertEqual(descriptor.totalStages, 0, 'Total stages should be 0');
    assertEqual(descriptor.stages.length, 0, 'Stages should be empty');
});

// Test 7: buildExecutionDescriptor counts stages correctly
test('buildExecutionDescriptor counts stages correctly', () => {
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
                agent: 'ai',
                context: {
                    memory: true,
                    files: false,
                    previousResults: true
                }
            }
        ]
    };

    const descriptor = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(descriptor.ready, true, 'Descriptor should be ready');
    assertEqual(descriptor.totalStages, 2, 'Total stages should be 2');
    assertEqual(descriptor.stages.length, 2, 'Stages array length should be 2');
});

// Test 8: buildExecutionDescriptor handles parallel mode
test('buildExecutionDescriptor handles parallel mode', () => {
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

    const descriptor = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(descriptor.ready, true, 'Descriptor should be ready');
    assertEqual(descriptor.mode, 'parallel', 'Mode should be parallel');
    assertEqual(descriptor.totalStages, 2, 'Total stages should be 2');
});

// Test 9: Full pipeline - plan -> executionOrder -> sharedContextPlan -> executionPipeline -> descriptor
test('Full pipeline - plan to descriptor', () => {
    const routeDecision = {
        route: 'ai',
        confidence: 0.9,
        reasoning: 'General AI query'
    };

    // Step 1: Build execution plan
    const plan = agentService.buildExecutionPlan(routeDecision);
    assertTrue(plan !== null && plan !== undefined, 'Plan should exist');

    // Step 2: Build execution order
    const executionOrder = agentService.buildAgentExecutionOrder(plan);
    assertTrue(executionOrder !== null && executionOrder !== undefined, 'Execution order should exist');

    // Step 3: Build shared context plan
    const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
    assertTrue(sharedContextPlan !== null && sharedContextPlan !== undefined, 'Shared context plan should exist');

    // Step 4: Build execution pipeline
    const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    assertTrue(executionPipeline !== null && executionPipeline !== undefined, 'Execution pipeline should exist');

    // Step 5: Build execution descriptor
    const descriptor = agentService.buildExecutionDescriptor(executionPipeline);
    assertTrue(descriptor !== null && descriptor !== undefined, 'Descriptor should exist');
    assertEqual(descriptor.ready, true, 'Descriptor should be ready');
});

// Test 10: Full pipeline with tool route
test('Full pipeline with tool route', () => {
    const routeDecision = {
        route: 'tool',
        target: 'weather',
        confidence: 0.95,
        reason: 'Weather query'
    };

    const plan = agentService.buildExecutionPlan(routeDecision);
    const executionOrder = agentService.buildAgentExecutionOrder(plan);
    const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
    const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    const descriptor = agentService.buildExecutionDescriptor(executionPipeline);

    assertEqual(descriptor.ready, true, 'Descriptor should be ready');
    assertEqual(descriptor.totalStages, 1, 'Total stages should be 1');
    // buildAgentExecutionOrder defaults to 'ai' for single-agent plans
    assertEqual(descriptor.stages[0].agent, 'ai', 'First stage agent should be ai (default for single-agent)');
});

// Test 11: Full pipeline with memory route
test('Full pipeline with memory route', () => {
    const routeDecision = {
        route: 'memory',
        confidence: 0.95,
        reason: 'Memory query'
    };

    const plan = agentService.buildExecutionPlan(routeDecision);
    const executionOrder = agentService.buildAgentExecutionOrder(plan);
    const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
    const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    const descriptor = agentService.buildExecutionDescriptor(executionPipeline);

    assertEqual(descriptor.ready, true, 'Descriptor should be ready');
    assertEqual(descriptor.totalStages, 1, 'Total stages should be 1');
    // buildAgentExecutionOrder defaults to 'ai' for single-agent plans
    assertEqual(descriptor.stages[0].agent, 'ai', 'First stage agent should be ai (default for single-agent)');
});

// Test 12: Full pipeline with file route
test('Full pipeline with file route', () => {
    const routeDecision = {
        route: 'file',
        confidence: 0.95,
        reason: 'File operation'
    };

    const plan = agentService.buildExecutionPlan(routeDecision);
    const executionOrder = agentService.buildAgentExecutionOrder(plan);
    const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
    const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    const descriptor = agentService.buildExecutionDescriptor(executionPipeline);

    assertEqual(descriptor.ready, true, 'Descriptor should be ready');
    assertEqual(descriptor.totalStages, 1, 'Total stages should be 1');
    // buildAgentExecutionOrder defaults to 'ai' for single-agent plans
    assertEqual(descriptor.stages[0].agent, 'ai', 'First stage agent should be ai (default for single-agent)');
});

// Test 13: buildExecutionDescriptor preserves stages from pipeline
test('buildExecutionDescriptor preserves stages from pipeline', () => {
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
                agent: 'ai',
                context: {
                    memory: true,
                    files: false,
                    previousResults: true
                }
            }
        ]
    };

    const descriptor = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(descriptor.stages.length, 2, 'Should have 2 stages');
    assertEqual(descriptor.stages[0].agent, 'tool', 'First stage agent should match');
    assertEqual(descriptor.stages[1].agent, 'ai', 'Second stage agent should match');
    assertEqual(descriptor.stages[0].context.memory, false, 'First stage context should match');
    assertEqual(descriptor.stages[1].context.memory, true, 'Second stage context should match');
});

// Test 14: buildExecutionDescriptor handles empty stages array
test('buildExecutionDescriptor handles empty stages array', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: []
    };

    const descriptor = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(descriptor.ready, true, 'Descriptor should be ready');
    assertEqual(descriptor.totalStages, 0, 'Total stages should be 0');
    assertEqual(descriptor.stages.length, 0, 'Stages should be empty');
});

// Test 15: buildExecutionDescriptor defaults to sequential mode
test('buildExecutionDescriptor defaults to sequential mode', () => {
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

    const descriptor = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(descriptor.mode, 'sequential', 'Mode should default to sequential');
});

// Test 16: Integration with server.js flow - analyzeRequest to descriptor
test('Integration with server.js flow - analyzeRequest to descriptor', () => {
    const userContent = 'What is the weather in London?';

    // Step 1: analyzeRequest
    const routeDecision = agentService.analyzeRequest(userContent);
    assertTrue(routeDecision.route === 'tool', 'Route should be tool');

    // Step 2: buildExecutionPlan
    const plan = agentService.buildExecutionPlan(routeDecision);
    assertTrue(plan.route === 'tool', 'Plan route should be tool');

    // Step 3: validateExecutionPlan
    const validation = agentService.validateExecutionPlan(plan);
    assertTrue(validation.valid, 'Validation should pass');

    // Step 4: Build execution descriptor
    const executionOrder = agentService.buildAgentExecutionOrder(plan);
    const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
    const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    const descriptor = agentService.buildExecutionDescriptor(executionPipeline);

    assertTrue(descriptor.ready, 'Descriptor should be ready');
    assertTrue(descriptor.totalStages > 0, 'Should have stages');
});

// Test 17: buildExecutionDescriptor with invalid stages (non-array)
test('buildExecutionDescriptor with invalid stages (non-array)', () => {
    const pipeline = {
        sequential: true,
        parallel: false,
        stages: 'invalid'
    };

    const descriptor = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(descriptor.ready, false, 'Descriptor should not be ready');
    assertEqual(descriptor.totalStages, 0, 'Total stages should be 0');
});

// Test 18: buildExecutionDescriptor handles missing stages property
test('buildExecutionDescriptor handles missing stages property', () => {
    const pipeline = {
        sequential: true,
        parallel: false
    };

    const descriptor = agentService.buildExecutionDescriptor(pipeline);

    // When stages is missing, pipeline validation fails, so descriptor is not ready
    assertEqual(descriptor.ready, false, 'Descriptor should not be ready');
    assertEqual(descriptor.totalStages, 0, 'Total stages should be 0');
    assertEqual(descriptor.stages.length, 0, 'Stages should be empty');
});

// Test 19: Full pipeline integration with all route types
test('Full pipeline integration with all route types', () => {
    const routes = ['tool', 'memory', 'file', 'ai'];

    routes.forEach(route => {
        const routeDecision = { route: route, confidence: 0.9, reason: 'Test' };
        const plan = agentService.buildExecutionPlan(routeDecision);
        const executionOrder = agentService.buildAgentExecutionOrder(plan);
        const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
        const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
        const descriptor = agentService.buildExecutionDescriptor(executionPipeline);

        assertEqual(descriptor.ready, true, `Descriptor should be ready for route: ${route}`);
        assertTrue(descriptor.totalStages > 0, `Should have stages for route: ${route}`);
    });
});

// Test 20: buildExecutionDescriptor preserves pipeline properties
test('buildExecutionDescriptor preserves pipeline properties', () => {
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

    const descriptor = agentService.buildExecutionDescriptor(pipeline);

    assertEqual(descriptor.ready, true, 'Descriptor should be ready');
    assertEqual(descriptor.mode, 'sequential', 'Mode should be sequential');
    assertEqual(descriptor.totalStages, 1, 'Total stages should be 1');
    assertTrue(Array.isArray(descriptor.stages), 'Stages should be an array');
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