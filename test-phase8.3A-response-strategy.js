// Test Phase 8.3A - Response Strategy Builder
// Tests the buildResponseStrategy method

const agentService = require('./server/services/agentService');

console.log('=== Testing Phase 8.3A - Response Strategy Builder ===\n');

// Test 1: Tool route
console.log('Test 1: Tool route');
const toolStrategy = agentService.buildResponseStrategy('tool');
console.log('Result:', JSON.stringify(toolStrategy, null, 2));
const toolPass = toolStrategy.type === 'tool_response' &&
    toolStrategy.useAI === false &&
    toolStrategy.stream === false;
console.log(toolPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 2: Memory route
console.log('Test 2: Memory route');
const memoryStrategy = agentService.buildResponseStrategy('memory');
console.log('Result:', JSON.stringify(memoryStrategy, null, 2));
const memoryPass = memoryStrategy.type === 'memory_response' &&
    memoryStrategy.useAI === true &&
    memoryStrategy.stream === false;
console.log(memoryPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 3: File route
console.log('Test 3: File route');
const fileStrategy = agentService.buildResponseStrategy('file');
console.log('Result:', JSON.stringify(fileStrategy, null, 2));
const filePass = fileStrategy.type === 'file_response' &&
    fileStrategy.useAI === true &&
    fileStrategy.stream === false;
console.log(filePass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 4: AI route
console.log('Test 4: AI route');
const aiStrategy = agentService.buildResponseStrategy('ai');
console.log('Result:', JSON.stringify(aiStrategy, null, 2));
const aiPass = aiStrategy.type === 'ai_response' &&
    aiStrategy.useAI === true &&
    aiStrategy.stream === true;
console.log(aiPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 5: Unknown route
console.log('Test 5: Unknown route');
const unknownStrategy = agentService.buildResponseStrategy('unknown');
console.log('Result:', JSON.stringify(unknownStrategy, null, 2));
const unknownPass = unknownStrategy.type === 'unknown' &&
    unknownStrategy.useAI === false &&
    unknownStrategy.stream === false;
console.log(unknownPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 6: Empty string route
console.log('Test 6: Empty string route');
const emptyStrategy = agentService.buildResponseStrategy('');
console.log('Result:', JSON.stringify(emptyStrategy, null, 2));
const emptyPass = emptyStrategy.type === 'unknown' &&
    emptyStrategy.useAI === false &&
    emptyStrategy.stream === false;
console.log(emptyPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 7: Null route
console.log('Test 7: Null route');
const nullStrategy = agentService.buildResponseStrategy(null);
console.log('Result:', JSON.stringify(nullStrategy, null, 2));
const nullPass = nullStrategy.type === 'unknown' &&
    nullStrategy.useAI === false &&
    nullStrategy.stream === false;
console.log(nullPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Summary
const allPassed = toolPass && memoryPass && filePass && aiPass && unknownPass && emptyPass && nullPass;
console.log('=== Summary ===');
console.log(allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
console.log(`Total: 7 tests`);

process.exit(allPassed ? 0 : 1);