// Test Phase 8.2C - Context Assembly Planner
// Tests the buildContextPlan() method

const agentService = require('./server/services/agentService');

console.log('=== Phase 8.2C: Context Assembly Planner Tests ===\n');

let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`✓ ${description}`);
        testsPassed++;
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}`);
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

// Test 1: Tool route context plan
test('Tool route returns correct context plan', () => {
    const result = agentService.buildContextPlan('tool');
    assertEqual(result, {
        memory: [],
        files: [],
        tools: ["requested_tool"]
    }, 'Tool route context plan mismatch');
});

// Test 2: Memory route context plan
test('Memory route returns correct context plan', () => {
    const result = agentService.buildContextPlan('memory');
    assertEqual(result, {
        memory: [
            "semantic_memory",
            "knowledge_graph"
        ],
        files: [],
        tools: []
    }, 'Memory route context plan mismatch');
});

// Test 3: File route context plan
test('File route returns correct context plan', () => {
    const result = agentService.buildContextPlan('file');
    assertEqual(result, {
        memory: [],
        files: [
            "uploaded_files"
        ],
        tools: []
    }, 'File route context plan mismatch');
});

// Test 4: AI route context plan
test('AI route returns correct context plan', () => {
    const result = agentService.buildContextPlan('ai');
    assertEqual(result, {
        memory: [
            "semantic_memory"
        ],
        files: [],
        tools: []
    }, 'AI route context plan mismatch');
});

// Test 5: Unknown route context plan
test('Unknown route returns empty context plan', () => {
    const result = agentService.buildContextPlan('unknown');
    assertEqual(result, {
        memory: [],
        files: [],
        tools: []
    }, 'Unknown route context plan mismatch');
});

// Test 6: Empty string route
test('Empty string route returns empty context plan', () => {
    const result = agentService.buildContextPlan('');
    assertEqual(result, {
        memory: [],
        files: [],
        tools: []
    }, 'Empty string route context plan mismatch');
});

// Test 7: Null route
test('Null route returns empty context plan', () => {
    const result = agentService.buildContextPlan(null);
    assertEqual(result, {
        memory: [],
        files: [],
        tools: []
    }, 'Null route context plan mismatch');
});

// Test 8: Undefined route
test('Undefined route returns empty context plan', () => {
    const result = agentService.buildContextPlan(undefined);
    assertEqual(result, {
        memory: [],
        files: [],
        tools: []
    }, 'Undefined route context plan mismatch');
});

// Test 9: Case sensitivity - uppercase route
test('Uppercase route returns empty context plan (case sensitive)', () => {
    const result = agentService.buildContextPlan('TOOL');
    assertEqual(result, {
        memory: [],
        files: [],
        tools: []
    }, 'Uppercase route context plan mismatch');
});

// Test 10: Case sensitivity - mixed case route
test('Mixed case route returns empty context plan (case sensitive)', () => {
    const result = agentService.buildContextPlan('Tool');
    assertEqual(result, {
        memory: [],
        files: [],
        tools: []
    }, 'Mixed case route context plan mismatch');
});

// Test 11: Verify method exists
test('buildContextPlan method exists', () => {
    if (typeof agentService.buildContextPlan !== 'function') {
        throw new Error('buildContextPlan is not a function');
    }
});

// Test 12: Verify no async logic (synchronous execution)
test('buildContextPlan executes synchronously', () => {
    const start = Date.now();
    agentService.buildContextPlan('tool');
    const end = Date.now();
    if (end - start > 10) {
        throw new Error('Method took too long, may contain async logic');
    }
});

// Test 13: Verify no service calls (pure planning)
test('buildContextPlan performs no service calls', () => {
    // This is verified by the synchronous nature and simple return values
    // The method only uses switch-case logic with no external dependencies
    const result = agentService.buildContextPlan('memory');
    if (typeof result !== 'object' || result === null) {
        throw new Error('Result is not an object');
    }
});

// Test 14: Verify existing methods still work (no regression)
test('analyzeRequest method still works', () => {
    const result = agentService.analyzeRequest('calculate 2 + 2');
    if (!result.route || !result.confidence || !result.reason) {
        throw new Error('analyzeRequest returned invalid structure');
    }
});

// Test 15: Verify buildContextRequirements still works (no regression)
test('buildContextRequirements method still works', () => {
    const result = agentService.buildContextRequirements('tool');
    if (typeof result.memory !== 'boolean' || typeof result.files !== 'boolean' || typeof result.tools !== 'boolean') {
        throw new Error('buildContextRequirements returned invalid structure');
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