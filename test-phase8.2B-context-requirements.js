// Test Phase 8.2B - Context Requirement Builder
// Tests the buildContextRequirements method

const agentService = require('./server/services/agentService');

console.log('=== Phase 8.2B: Context Requirement Builder Tests ===\n');

let testsPassed = 0;
let testsFailed = 0;

function test(description, actual, expected) {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    if (passed) {
        console.log(`✓ PASS: ${description}`);
        testsPassed++;
    } else {
        console.log(`✗ FAIL: ${description}`);
        console.log(`  Expected: ${JSON.stringify(expected)}`);
        console.log(`  Actual:   ${JSON.stringify(actual)}`);
        testsFailed++;
    }
}

// Test 1: Tool route
test(
    'Tool route returns tools:true, memory:false, files:false',
    agentService.buildContextRequirements('tool'),
    { memory: false, files: false, tools: true }
);

// Test 2: Memory route
test(
    'Memory route returns memory:true, files:false, tools:false',
    agentService.buildContextRequirements('memory'),
    { memory: true, files: false, tools: false }
);

// Test 3: File route
test(
    'File route returns files:true, memory:false, tools:false',
    agentService.buildContextRequirements('file'),
    { memory: false, files: true, tools: false }
);

// Test 4: AI route
test(
    'AI route returns memory:true, files:false, tools:false',
    agentService.buildContextRequirements('ai'),
    { memory: true, files: false, tools: false }
);

// Test 5: Default/unknown route
test(
    'Unknown route returns all false',
    agentService.buildContextRequirements('unknown'),
    { memory: false, files: false, tools: false }
);

// Test 6: Empty string route
test(
    'Empty string route returns all false',
    agentService.buildContextRequirements(''),
    { memory: false, files: false, tools: false }
);

// Test 7: Null route
test(
    'Null route returns all false',
    agentService.buildContextRequirements(null),
    { memory: false, files: false, tools: false }
);

// Test 8: Undefined route
test(
    'Undefined route returns all false',
    agentService.buildContextRequirements(undefined),
    { memory: false, files: false, tools: false }
);

// Test 9: Case sensitivity - uppercase (should return default)
test(
    'Uppercase TOOL route returns default (all false)',
    agentService.buildContextRequirements('TOOL'),
    { memory: false, files: false, tools: false }
);

// Test 10: Case sensitivity - mixed case (should return default)
test(
    'Mixed case Memory route returns default (all false)',
    agentService.buildContextRequirements('Memory'),
    { memory: false, files: false, tools: false }
);

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