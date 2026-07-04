// Test Phase 10.0C - Execution Pipeline Builder
// Tests the buildExecutionPipeline method
// Planning only - no execution, no service calls, no async logic

const agentService = require('./server/services/agentService');

console.log('=== Phase 10.0C: Execution Pipeline Builder Tests ===\n');

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

// Test 1: Tool agent pipeline
test('Tool agent pipeline - single tool execution', () => {
    const executionOrder = {
        sequential: true,
        parallel: false,
        order: ['tool']
    };

    const sharedContextPlan = {
        shareMemory: false,
        shareFiles: false,
        shareToolResults: false
    };

    const result = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);

    assertEqual(result.sequential, true, 'Sequential should be true');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 1, 'Should have 1 stage');
    assertEqual(result.stages[0].agent, 'tool', 'Stage agent should be tool');
    assertEqual(result.stages[0].context.memory, false, 'Memory should be false');
    assertEqual(result.stages[0].context.files, false, 'Files should be false');
    assertEqual(result.stages[0].context.previousResults, false, 'Previous results should be false');
});

// Test 2: Memory agent pipeline
test('Memory agent pipeline - single memory execution', () => {
    const executionOrder = {
        sequential: true,
        parallel: false,
        order: ['memory']
    };

    const sharedContextPlan = {
        shareMemory: true,
        shareFiles: false,
        shareToolResults: false
    };

    const result = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);

    assertEqual(result.sequential, true, 'Sequential should be true');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 1, 'Should have 1 stage');
    assertEqual(result.stages[0].agent, 'memory', 'Stage agent should be memory');
    assertEqual(result.stages[0].context.memory, true, 'Memory should be true');
    assertEqual(result.stages[0].context.files, false, 'Files should be false');
    assertEqual(result.stages[0].context.previousResults, false, 'Previous results should be false');
});

// Test 3: File agent pipeline
test('File agent pipeline - single file execution', () => {
    const executionOrder = {
        sequential: true,
        parallel: false,
        order: ['file']
    };

    const sharedContextPlan = {
        shareMemory: false,
        shareFiles: true,
        shareToolResults: false
    };

    const result = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);

    assertEqual(result.sequential, true, 'Sequential should be true');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 1, 'Should have 1 stage');
    assertEqual(result.stages[0].agent, 'file', 'Stage agent should be file');
    assertEqual(result.stages[0].context.memory, false, 'Memory should be false');
    assertEqual(result.stages[0].context.files, true, 'Files should be true');
    assertEqual(result.stages[0].context.previousResults, false, 'Previous results should be false');
});

// Test 4: AI agent pipeline
test('AI agent pipeline - single AI execution', () => {
    const executionOrder = {
        sequential: true,
        parallel: false,
        order: ['ai']
    };

    const sharedContextPlan = {
        shareMemory: true,
        shareFiles: false,
        shareToolResults: false
    };

    const result = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);

    assertEqual(result.sequential, true, 'Sequential should be true');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 1, 'Should have 1 stage');
    assertEqual(result.stages[0].agent, 'ai', 'Stage agent should be ai');
    assertEqual(result.stages[0].context.memory, true, 'Memory should be true');
    assertEqual(result.stages[0].context.files, false, 'Files should be false');
    assertEqual(result.stages[0].context.previousResults, false, 'Previous results should be false');
});

// Test 5: Multi-agent pipeline (sequential)
test('Multi-agent pipeline - sequential execution', () => {
    const executionOrder = {
        sequential: true,
        parallel: false,
        order: ['tool', 'memory', 'ai']
    };

    const sharedContextPlan = {
        shareMemory: true,
        shareFiles: true,
        shareToolResults: true
    };

    const result = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);

    assertEqual(result.sequential, true, 'Sequential should be true');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 3, 'Should have 3 stages');
    assertEqual(result.stages[0].agent, 'tool', 'First stage agent should be tool');
    assertEqual(result.stages[1].agent, 'memory', 'Second stage agent should be memory');
    assertEqual(result.stages[2].agent, 'ai', 'Third stage agent should be ai');

    // All stages should have the same context
    result.stages.forEach((stage, index) => {
        assertEqual(stage.context.memory, true, `Stage ${index} memory should be true`);
        assertEqual(stage.context.files, true, `Stage ${index} files should be true`);
        assertEqual(stage.context.previousResults, true, `Stage ${index} previousResults should be true`);
    });
});

// Test 6: Multi-agent pipeline (parallel)
test('Multi-agent pipeline - parallel execution', () => {
    const executionOrder = {
        sequential: false,
        parallel: true,
        order: ['memory', 'file']
    };

    const sharedContextPlan = {
        shareMemory: true,
        shareFiles: true,
        shareToolResults: true
    };

    const result = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);

    assertEqual(result.sequential, false, 'Sequential should be false');
    assertEqual(result.parallel, true, 'Parallel should be true');
    assertEqual(result.stages.length, 2, 'Should have 2 stages');
    assertEqual(result.stages[0].agent, 'memory', 'First stage agent should be memory');
    assertEqual(result.stages[1].agent, 'file', 'Second stage agent should be file');
});

// Test 7: Empty order array
test('Empty order array - returns empty stages', () => {
    const executionOrder = {
        sequential: true,
        parallel: false,
        order: []
    };

    const sharedContextPlan = {
        shareMemory: false,
        shareFiles: false,
        shareToolResults: false
    };

    const result = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);

    assertEqual(result.sequential, true, 'Sequential should be true');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 0, 'Should have 0 stages');
});

// Test 8: Null executionOrder
test('Null executionOrder - returns empty pipeline', () => {
    const sharedContextPlan = {
        shareMemory: false,
        shareFiles: false,
        shareToolResults: false
    };

    const result = agentService.buildExecutionPipeline(null, sharedContextPlan);

    assertEqual(result.sequential, false, 'Sequential should be false');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 0, 'Should have 0 stages');
});

// Test 9: Null sharedContextPlan
test('Null sharedContextPlan - returns pipeline with empty stages', () => {
    const executionOrder = {
        sequential: true,
        parallel: false,
        order: ['tool', 'ai']
    };

    const result = agentService.buildExecutionPipeline(executionOrder, null);

    assertEqual(result.sequential, true, 'Sequential should be true');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 0, 'Should have 0 stages');
});

// Test 10: Missing order property
test('Missing order property - returns empty stages', () => {
    const executionOrder = {
        sequential: true,
        parallel: false
    };

    const sharedContextPlan = {
        shareMemory: true,
        shareFiles: true,
        shareToolResults: true
    };

    const result = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);

    assertEqual(result.sequential, true, 'Sequential should be true');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 0, 'Should have 0 stages');
});

// Test 11: Invalid executionOrder (not an object)
test('Invalid executionOrder (string) - returns empty pipeline', () => {
    const sharedContextPlan = {
        shareMemory: false,
        shareFiles: false,
        shareToolResults: false
    };

    const result = agentService.buildExecutionPipeline('invalid', sharedContextPlan);

    assertEqual(result.sequential, false, 'Sequential should be false');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 0, 'Should have 0 stages');
});

// Test 12: Invalid sharedContextPlan (not an object)
test('Invalid sharedContextPlan (string) - returns pipeline with empty stages', () => {
    const executionOrder = {
        sequential: true,
        parallel: false,
        order: ['ai']
    };

    const result = agentService.buildExecutionPipeline(executionOrder, 'invalid');

    assertEqual(result.sequential, true, 'Sequential should be true');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 0, 'Should have 0 stages');
});

// Test 13: Order is not an array
test('Order is not an array - returns empty stages', () => {
    const executionOrder = {
        sequential: true,
        parallel: false,
        order: 'invalid'
    };

    const sharedContextPlan = {
        shareMemory: true,
        shareFiles: true,
        shareToolResults: true
    };

    const result = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);

    assertEqual(result.sequential, true, 'Sequential should be true');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 0, 'Should have 0 stages');
});

// Test 14: Default values for missing properties
test('Default values for missing properties', () => {
    const executionOrder = {
        order: ['tool']
    };

    const sharedContextPlan = {
        shareMemory: true
    };

    const result = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);

    assertEqual(result.sequential, false, 'Sequential should default to false');
    assertEqual(result.parallel, false, 'Parallel should default to false');
    assertEqual(result.stages[0].context.memory, true, 'Memory should be true');
    assertEqual(result.stages[0].context.files, false, 'Files should default to false');
    assertEqual(result.stages[0].context.previousResults, false, 'Previous results should default to false');
});

// Test 15: Complex multi-agent workflow
test('Complex multi-agent workflow - all agents with full context', () => {
    const executionOrder = {
        sequential: true,
        parallel: false,
        order: ['tool', 'file', 'memory', 'ai']
    };

    const sharedContextPlan = {
        shareMemory: true,
        shareFiles: true,
        shareToolResults: true
    };

    const result = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);

    assertEqual(result.sequential, true, 'Sequential should be true');
    assertEqual(result.parallel, false, 'Parallel should be false');
    assertEqual(result.stages.length, 4, 'Should have 4 stages');

    const expectedAgents = ['tool', 'file', 'memory', 'ai'];
    result.stages.forEach((stage, index) => {
        assertEqual(stage.agent, expectedAgents[index], `Stage ${index} agent should be ${expectedAgents[index]}`);
        assertEqual(stage.context.memory, true, `Stage ${index} memory should be true`);
        assertEqual(stage.context.files, true, `Stage ${index} files should be true`);
        assertEqual(stage.context.previousResults, true, `Stage ${index} previousResults should be true`);
    });
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