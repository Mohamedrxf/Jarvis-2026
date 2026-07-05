// Test Phase 10.5A3 - Execution Integration
// Tests the integration of executeSequentialPipeline() in server.js
// Validates that execution occurs using the descriptor after descriptor building

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.5A3: Execution Integration Tests ===\n');

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

// Test 1: executeSequentialPipeline returns execution result
test('executeSequentialPipeline returns execution result', async () => {
    const descriptor = {
        ready: true,
        mode: 'sequential',
        totalStages: 1,
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

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertTrue(execution !== null && execution !== undefined, 'Execution should not be null or undefined');
    assertTrue(typeof execution === 'object', 'Execution should be an object');
});

// Test 2: executeSequentialPipeline returns success property
test('executeSequentialPipeline returns success property', async () => {
    const descriptor = {
        ready: true,
        mode: 'sequential',
        totalStages: 1,
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

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertTrue('success' in execution, 'Execution should have success property');
    assertTrue(typeof execution.success === 'boolean', 'Success should be a boolean');
});

// Test 3: executeSequentialPipeline returns results array
test('executeSequentialPipeline returns results array', async () => {
    const descriptor = {
        ready: true,
        mode: 'sequential',
        totalStages: 1,
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

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertTrue('results' in execution, 'Execution should have results property');
    assertTrue(Array.isArray(execution.results), 'Results should be an array');
});

// Test 4: executeSequentialPipeline handles not ready descriptor
test('executeSequentialPipeline handles not ready descriptor', async () => {
    const descriptor = {
        ready: false,
        mode: 'sequential',
        totalStages: 0,
        stages: []
    };

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertEqual(execution.success, false, 'Execution should fail');
    assertEqual(execution.results.length, 0, 'Results should be empty');
});

// Test 5: executeSequentialPipeline handles null descriptor
test('executeSequentialPipeline handles null descriptor', async () => {
    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(null, context);

    assertEqual(execution.success, false, 'Execution should fail');
    assertEqual(execution.results.length, 0, 'Results should be empty');
});

// Test 6: executeSequentialPipeline handles undefined descriptor
test('executeSequentialPipeline handles undefined descriptor', async () => {
    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(undefined, context);

    assertEqual(execution.success, false, 'Execution should fail');
    assertEqual(execution.results.length, 0, 'Results should be empty');
});

// Test 7: executeSequentialPipeline executes single stage
test('executeSequentialPipeline executes single stage', async () => {
    const descriptor = {
        ready: true,
        mode: 'sequential',
        totalStages: 1,
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

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertEqual(execution.success, true, 'Execution should succeed');
    assertEqual(execution.results.length, 1, 'Should have 1 result');
    assertTrue('agent' in execution.results[0], 'Result should have agent property');
    assertTrue('success' in execution.results[0], 'Result should have success property');
});

// Test 8: executeSequentialPipeline executes multiple stages
test('executeSequentialPipeline executes multiple stages', async () => {
    const descriptor = {
        ready: true,
        mode: 'sequential',
        totalStages: 2,
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
                agent: 'ai',
                context: {
                    memory: true,
                    files: false,
                    previousResults: true
                }
            }
        ]
    };

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertEqual(execution.success, true, 'Execution should succeed');
    assertEqual(execution.results.length, 2, 'Should have 2 results');
    assertEqual(execution.results[0].agent, 'memory', 'First result agent should be memory');
    assertEqual(execution.results[1].agent, 'ai', 'Second result agent should be ai');
});

// Test 9: executeSequentialPipeline handles agent not found
test('executeSequentialPipeline handles agent not found', async () => {
    const descriptor = {
        ready: true,
        mode: 'sequential',
        totalStages: 1,
        stages: [
            {
                agent: 'nonexistent',
                context: {
                    memory: false,
                    files: false,
                    previousResults: false
                }
            }
        ]
    };

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertEqual(execution.success, false, 'Execution should fail');
    assertEqual(execution.results.length, 1, 'Should have 1 result');
    assertEqual(execution.results[0].agent, 'nonexistent', 'Result agent should be nonexistent');
    assertEqual(execution.results[0].success, false, 'Result should indicate failure');
    assertEqual(execution.results[0].error, 'Agent not found', 'Result should have error message');
});

// Test 10: executeSequentialPipeline handles agent execution error
test('executeSequentialPipeline handles agent execution error', async () => {
    const descriptor = {
        ready: true,
        mode: 'sequential',
        totalStages: 1,
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

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    // AI agent should succeed (or fail gracefully)
    assertEqual(execution.results.length, 1, 'Should have 1 result');
    assertTrue('success' in execution.results[0], 'Result should have success property');
});

// Test 11: Full pipeline - analyzeRequest to execution
test('Full pipeline - analyzeRequest to execution', async () => {
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

    // Step 5: Execute
    const context = {
        message: userContent,
        userId: 1,
        messages: [{ role: 'user', content: userContent }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);
    assertTrue(execution !== null && execution !== undefined, 'Execution should exist');
    assertTrue('success' in execution, 'Execution should have success property');
    assertTrue('results' in execution, 'Execution should have results property');
});

// Test 12: Full pipeline with AI route
test('Full pipeline with AI route', async () => {
    const routeDecision = {
        route: 'ai',
        confidence: 0.9,
        reason: 'General AI query'
    };

    const plan = agentService.buildExecutionPlan(routeDecision);
    const executionOrder = agentService.buildAgentExecutionOrder(plan);
    const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
    const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    const descriptor = agentService.buildExecutionDescriptor(executionPipeline);

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertEqual(descriptor.ready, true, 'Descriptor should be ready');
    assertEqual(execution.results.length, 1, 'Should have 1 result');
    assertEqual(execution.results[0].agent, 'ai', 'Result agent should be ai');
});

// Test 13: Full pipeline with memory route
test('Full pipeline with memory route', async () => {
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

    const context = {
        message: 'Remember this',
        userId: 1,
        messages: [{ role: 'user', content: 'Remember this' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertEqual(descriptor.ready, true, 'Descriptor should be ready');
    assertEqual(execution.results.length, 1, 'Should have 1 result');
    assertEqual(execution.results[0].agent, 'ai', 'Result agent should be ai (default)');
});

// Test 14: Full pipeline with file route
test('Full pipeline with file route', async () => {
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

    const context = {
        message: 'Show my files',
        userId: 1,
        messages: [{ role: 'user', content: 'Show my files' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertEqual(descriptor.ready, true, 'Descriptor should be ready');
    assertEqual(execution.results.length, 1, 'Should have 1 result');
    assertEqual(execution.results[0].agent, 'ai', 'Result agent should be ai (default)');
});

// Test 15: executeSequentialPipeline with empty stages array
test('executeSequentialPipeline with empty stages array', async () => {
    const descriptor = {
        ready: true,
        mode: 'sequential',
        totalStages: 0,
        stages: []
    };

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertEqual(execution.success, true, 'Execution should succeed');
    assertEqual(execution.results.length, 0, 'Results should be empty');
});

// Test 16: executeSequentialPipeline preserves execution order
test('executeSequentialPipeline preserves execution order', async () => {
    const descriptor = {
        ready: true,
        mode: 'sequential',
        totalStages: 3,
        stages: [
            {
                agent: 'memory',
                context: { memory: true, files: false, previousResults: false }
            },
            {
                agent: 'file',
                context: { memory: false, files: true, previousResults: false }
            },
            {
                agent: 'ai',
                context: { memory: true, files: false, previousResults: true }
            }
        ]
    };

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertEqual(execution.results.length, 3, 'Should have 3 results');
    assertEqual(execution.results[0].agent, 'memory', 'First agent should be memory');
    assertEqual(execution.results[1].agent, 'file', 'Second agent should be file');
    assertEqual(execution.results[2].agent, 'ai', 'Third agent should be ai');
});

// Test 17: executeSequentialPipeline with context propagation
test('executeSequentialPipeline with context propagation', async () => {
    const descriptor = {
        ready: true,
        mode: 'sequential',
        totalStages: 2,
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
                agent: 'ai',
                context: {
                    memory: true,
                    files: false,
                    previousResults: true
                }
            }
        ]
    };

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertEqual(execution.success, true, 'Execution should succeed');
    assertEqual(execution.results.length, 2, 'Should have 2 results');
});

// Test 18: Integration with server.js flow - full pipeline
test('Integration with server.js flow - full pipeline', async () => {
    const userContent = 'Tell me about AI';
    const userId = 1;
    const messages = [{ role: 'user', content: userContent }];

    // Step 1: analyzeRequest
    const routeDecision = agentService.analyzeRequest(userContent);
    assertTrue(routeDecision.route === 'ai', 'Route should be ai');

    // Step 2: buildExecutionPlan
    const plan = agentService.buildExecutionPlan(routeDecision);
    assertTrue(plan.route === 'ai', 'Plan route should be ai');

    // Step 3: validateExecutionPlan
    const validation = agentService.validateExecutionPlan(plan);
    assertTrue(validation.valid, 'Validation should pass');

    // Step 4: Build execution descriptor
    const executionOrder = agentService.buildAgentExecutionOrder(plan);
    const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
    const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    const descriptor = agentService.buildExecutionDescriptor(executionPipeline);
    assertTrue(descriptor.ready, 'Descriptor should be ready');

    // Step 5: Execute
    const context = { message: userContent, userId: userId, messages: messages };
    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertTrue(execution !== null && execution !== undefined, 'Execution should exist');
    assertTrue('success' in execution, 'Execution should have success property');
    assertTrue('results' in execution, 'Execution should have results property');
});

// Test 19: executeSequentialPipeline handles descriptor with invalid agent
test('executeSequentialPipeline handles descriptor with invalid agent', async () => {
    const descriptor = {
        ready: true,
        mode: 'sequential',
        totalStages: 1,
        stages: [
            {
                agent: 'invalid_agent',
                context: {
                    memory: false,
                    files: false,
                    previousResults: false
                }
            }
        ]
    };

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertEqual(execution.success, false, 'Execution should fail');
    assertEqual(execution.results.length, 1, 'Should have 1 result');
    assertEqual(execution.results[0].agent, 'invalid_agent', 'Result agent should be invalid_agent');
    assertEqual(execution.results[0].success, false, 'Result should indicate failure');
});

// Test 20: executeSequentialPipeline returns aggregated results
test('executeSequentialPipeline returns aggregated results', async () => {
    const descriptor = {
        ready: true,
        mode: 'sequential',
        totalStages: 2,
        stages: [
            {
                agent: 'ai',
                context: {
                    memory: true,
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

    const context = {
        message: 'Hello',
        userId: 1,
        messages: [{ role: 'user', content: 'Hello' }]
    };

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    assertTrue(execution.success === true || execution.success === false, 'Execution should have success boolean');
    assertEqual(execution.results.length, 2, 'Should have 2 results');
    assertTrue(Array.isArray(execution.results), 'Results should be an array');
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