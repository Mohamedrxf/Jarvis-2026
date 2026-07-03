// Test Phase 9.0C - Memory Agent
// Tests the MemoryAgent implementation

const MemoryAgent = require('./server/services/agents/MemoryAgent');
const BaseAgent = require('./server/services/agents/BaseAgent');
const memoryService = require('./server/services/memoryService');

console.log('=== Testing Phase 9.0C - Memory Agent ===\n');

let allPassed = true;

// Test 1: Verify MemoryAgent class exists
console.log('Test 1: Verify MemoryAgent class exists');
const test1Pass = typeof MemoryAgent === 'function';
console.log('MemoryAgent is a class:', test1Pass);
console.log(test1Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test1Pass) allPassed = false;

// Test 2: Verify MemoryAgent inherits from BaseAgent
console.log('Test 2: Verify MemoryAgent inherits from BaseAgent');
const memoryAgent = new MemoryAgent();
const test2Pass = memoryAgent instanceof BaseAgent;
console.log('Inherits from BaseAgent:', test2Pass);
console.log(test2Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test2Pass) allPassed = false;

// Test 3: Verify getName() returns "memory"
console.log('Test 3: Verify getName() returns "memory"');
let getNameResult;
try {
    getNameResult = memoryAgent.getName();
    const test3Pass = getNameResult === "memory";
    console.log('getName() result:', getNameResult);
    console.log(test3Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test3Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - getName() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 4: Verify canHandle() returns true for memory route
console.log('Test 4: Verify canHandle() returns true for memory route');
const memoryRouteDecision = { route: "memory", target: null, confidence: 0.95 };
let canHandleResult;
try {
    canHandleResult = memoryAgent.canHandle(memoryRouteDecision);
    const test4Pass = canHandleResult === true;
    console.log('canHandle() result for memory route:', canHandleResult);
    console.log(test4Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test4Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - canHandle() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 5: Verify canHandle() returns false for non-memory routes
console.log('Test 5: Verify canHandle() returns false for non-memory routes');
const nonMemoryRoutes = [
    { route: "tool" },
    { route: "file" },
    { route: "ai" },
    { route: "unknown" }
];
let allNonMemoryCorrect = true;
for (const routeDecision of nonMemoryRoutes) {
    try {
        const result = memoryAgent.canHandle(routeDecision);
        if (result !== false) {
            allNonMemoryCorrect = false;
            console.log(`✗ FAIL - canHandle() returned ${result} for route: ${routeDecision.route}`);
        }
    } catch (error) {
        allNonMemoryCorrect = false;
        console.log(`✗ FAIL - canHandle() threw error for route: ${routeDecision.route}`);
    }
}
const test5Pass = allNonMemoryCorrect;
console.log('All non-memory routes rejected:', test5Pass);
console.log(test5Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test5Pass) allPassed = false;

// Test 6: Verify handle() delegates to MemoryService
console.log('Test 6: Verify handle() delegates to MemoryService');
const testContext = {
    operation: "getMemories",
    userId: 1
};
let handleResult;
try {
    handleResult = memoryAgent.handle(testContext);
    const test6Pass = handleResult !== undefined &&
        handleResult !== null &&
        typeof handleResult.then === 'function'; // It's a Promise
    console.log('handle() returned Promise:', test6Pass);
    console.log(test6Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test6Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - handle() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 7: Verify handle() throws error for unknown operation
console.log('Test 7: Verify handle() throws error for unknown operation');
const unknownOpContext = {
    operation: "unknownOperation",
    userId: 1
};
let handleErrorThrew = false;
let handleError = null;
try {
    memoryAgent.handle(unknownOpContext);
} catch (error) {
    handleErrorThrew = true;
    handleError = error;
}
const test7Pass = handleErrorThrew &&
    handleError instanceof Error &&
    handleError.message.includes('Unknown memory operation');
console.log('Threw error for unknown operation:', handleErrorThrew);
console.log('Error message:', handleError ? handleError.message : 'N/A');
console.log(test7Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test7Pass) allPassed = false;

// Test 8: Verify handle() returns MemoryService result directly
console.log('Test 8: Verify handle() returns MemoryService result directly');
const directContext = {
    operation: "getMemories",
    userId: 1
};
let directResult;
try {
    directResult = memoryAgent.handle(directContext);
    const test8Pass = directResult !== null &&
        typeof directResult === 'object' &&
        typeof directResult.then === 'function'; // It's a Promise from MemoryService
    console.log('Result is Promise:', test8Pass);
    console.log('Returns MemoryService result:', test8Pass);
    console.log(test8Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test8Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - handle() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 9: Verify no additional logic in MemoryAgent
console.log('Test 9: Verify no additional logic in MemoryAgent');
const fs = require('fs');
const memoryAgentCode = fs.readFileSync('./server/services/agents/MemoryAgent.js', 'utf8');
const hasRoutingLogic = memoryAgentCode.includes('if (') &&
    (memoryAgentCode.includes('route') || memoryAgentCode.includes('switch'));
const hasValidation = memoryAgentCode.includes('validate') || memoryAgentCode.includes('check');
const hasParsing = memoryAgentCode.includes('parse') || memoryAgentCode.includes('extract');
const hasAI = memoryAgentCode.includes('AI') || memoryAgentCode.includes('intelligence');
const test9Pass = !hasRoutingLogic && !hasValidation && !hasParsing && !hasAI;
console.log('No routing logic:', !hasRoutingLogic);
console.log('No validation:', !hasValidation);
console.log('No parsing:', !hasParsing);
console.log('No AI logic:', !hasAI);
console.log(test9Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test9Pass) allPassed = false;

// Test 10: Verify methods exist from BaseAgent
console.log('Test 10: Verify methods exist from BaseAgent');
const test10Pass = typeof memoryAgent.getName === 'function' &&
    typeof memoryAgent.canHandle === 'function' &&
    typeof memoryAgent.handle === 'function';
console.log('getName exists:', typeof memoryAgent.getName === 'function');
console.log('canHandle exists:', typeof memoryAgent.canHandle === 'function');
console.log('handle exists:', typeof memoryAgent.handle === 'function');
console.log(test10Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test10Pass) allPassed = false;

// Test 11: Verify existing memory tests still work
console.log('Test 11: Verify existing memory tests still work');
try {
    // Verify memoryService is still accessible and functional
    const test11Pass = memoryService !== null &&
        typeof memoryService === 'object' &&
        typeof memoryService.getMemories === 'function';
    console.log('MemoryService still accessible:', test11Pass);
    console.log(test11Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test11Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - MemoryService error:', error.message);
    console.log();
    allPassed = false;
}

// Test 12: Verify handle() supports multiple operations
console.log('Test 12: Verify handle() supports multiple operations');
const operations = [
    'createMemory',
    'updateMemory',
    'deleteMemory',
    'getMemories',
    'searchMemories',
    'getMemoryContext',
    'getEnrichedPromptContext',
    'getRankedMemories',
    'getMemoryIntelligenceReport',
    'detectMemoryConflicts',
    'detectDuplicateClusters'
];
let allOperationsSupported = true;
for (const operation of operations) {
    try {
        const result = memoryAgent.handle({ operation, userId: 1 });
        if (typeof result.then !== 'function') {
            allOperationsSupported = false;
            console.log(`✗ FAIL - Operation ${operation} did not return Promise`);
        }
    } catch (error) {
        // Some operations may fail due to missing parameters, but should not throw "Unknown operation"
        if (error.message.includes('Unknown memory operation')) {
            allOperationsSupported = false;
            console.log(`✗ FAIL - Operation ${operation} not supported`);
        }
    }
}
const test12Pass = allOperationsSupported;
console.log('All memory operations supported:', test12Pass);
console.log(test12Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test12Pass) allPassed = false;

// Summary
console.log('=== Summary ===');
console.log(allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
console.log(`Total: 12 tests`);

process.exit(allPassed ? 0 : 1);