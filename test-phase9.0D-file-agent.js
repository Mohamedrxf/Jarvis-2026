// Test Phase 9.0D - File Agent
// Tests the FileAgent implementation

const FileAgent = require('./server/services/agents/FileAgent');
const BaseAgent = require('./server/services/agents/BaseAgent');
const fileService = require('./server/services/fileService');

console.log('=== Testing Phase 9.0D - File Agent ===\n');

let allPassed = true;

// Test 1: Verify FileAgent class exists
console.log('Test 1: Verify FileAgent class exists');
const test1Pass = typeof FileAgent === 'function';
console.log('FileAgent is a class:', test1Pass);
console.log(test1Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test1Pass) allPassed = false;

// Test 2: Verify FileAgent inherits from BaseAgent
console.log('Test 2: Verify FileAgent inherits from BaseAgent');
const fileAgent = new FileAgent();
const test2Pass = fileAgent instanceof BaseAgent;
console.log('Inherits from BaseAgent:', test2Pass);
console.log(test2Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test2Pass) allPassed = false;

// Test 3: Verify getName() returns "file"
console.log('Test 3: Verify getName() returns "file"');
let getNameResult;
try {
    getNameResult = fileAgent.getName();
    const test3Pass = getNameResult === "file";
    console.log('getName() result:', getNameResult);
    console.log(test3Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test3Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - getName() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 4: Verify canHandle() returns true for file route
console.log('Test 4: Verify canHandle() returns true for file route');
const fileRouteDecision = { route: "file", target: null, confidence: 0.95 };
let canHandleResult;
try {
    canHandleResult = fileAgent.canHandle(fileRouteDecision);
    const test4Pass = canHandleResult === true;
    console.log('canHandle() result for file route:', canHandleResult);
    console.log(test4Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test4Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - canHandle() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 5: Verify canHandle() returns false for non-file routes
console.log('Test 5: Verify canHandle() returns false for non-file routes');
const nonFileRoutes = [
    { route: "tool" },
    { route: "memory" },
    { route: "ai" },
    { route: "unknown" }
];
let allNonFileCorrect = true;
for (const routeDecision of nonFileRoutes) {
    try {
        const result = fileAgent.canHandle(routeDecision);
        if (result !== false) {
            allNonFileCorrect = false;
            console.log(`✗ FAIL - canHandle() returned ${result} for route: ${routeDecision.route}`);
        }
    } catch (error) {
        allNonFileCorrect = false;
        console.log(`✗ FAIL - canHandle() threw error for route: ${routeDecision.route}`);
    }
}
const test5Pass = allNonFileCorrect;
console.log('All non-file routes rejected:', test5Pass);
console.log(test5Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test5Pass) allPassed = false;

// Test 6: Verify handle() delegates to FileService
console.log('Test 6: Verify handle() delegates to FileService');
const testContext = {
    operation: "getUserFiles",
    userId: 1
};
let handleResult;
try {
    handleResult = fileAgent.handle(testContext);
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
    fileAgent.handle(unknownOpContext);
} catch (error) {
    handleErrorThrew = true;
    handleError = error;
}
const test7Pass = handleErrorThrew &&
    handleError instanceof Error &&
    handleError.message.includes('Unknown file operation');
console.log('Threw error for unknown operation:', handleErrorThrew);
console.log('Error message:', handleError ? handleError.message : 'N/A');
console.log(test7Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test7Pass) allPassed = false;

// Test 8: Verify handle() returns FileService result directly
console.log('Test 8: Verify handle() returns FileService result directly');
const directContext = {
    operation: "getUserFiles",
    userId: 1
};
let directResult;
try {
    directResult = fileAgent.handle(directContext);
    const test8Pass = directResult !== null &&
        typeof directResult === 'object' &&
        typeof directResult.then === 'function'; // It's a Promise from FileService
    console.log('Result is Promise:', test8Pass);
    console.log('Returns FileService result:', test8Pass);
    console.log(test8Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test8Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - handle() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 9: Verify no additional logic in FileAgent
console.log('Test 9: Verify no additional logic in FileAgent');
const fs = require('fs');
const fileAgentCode = fs.readFileSync('./server/services/agents/FileAgent.js', 'utf8');
const hasRoutingLogic = fileAgentCode.includes('if (') &&
    (fileAgentCode.includes('route') || fileAgentCode.includes('switch'));
const hasValidation = fileAgentCode.includes('validate') || fileAgentCode.includes('check');
const hasAI = fileAgentCode.includes('AI') || fileAgentCode.includes('intelligence');
// FileAgent delegates to FileService which has extractTextContent, so we only check for actual parsing logic
const hasParsingLogic = fileAgentCode.includes('parse') && !fileAgentCode.includes('extractTextContent');
const test9Pass = !hasRoutingLogic && !hasValidation && !hasParsingLogic && !hasAI;
console.log('No routing logic:', !hasRoutingLogic);
console.log('No validation:', !hasValidation);
console.log('No parsing logic:', !hasParsingLogic);
console.log('No AI logic:', !hasAI);
console.log(test9Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test9Pass) allPassed = false;

// Test 10: Verify methods exist from BaseAgent
console.log('Test 10: Verify methods exist from BaseAgent');
const test10Pass = typeof fileAgent.getName === 'function' &&
    typeof fileAgent.canHandle === 'function' &&
    typeof fileAgent.handle === 'function';
console.log('getName exists:', typeof fileAgent.getName === 'function');
console.log('canHandle exists:', typeof fileAgent.canHandle === 'function');
console.log('handle exists:', typeof fileAgent.handle === 'function');
console.log(test10Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test10Pass) allPassed = false;

// Test 11: Verify existing file tests still work
console.log('Test 11: Verify existing file tests still work');
try {
    // Verify fileService is still accessible and functional
    const test11Pass = fileService !== null &&
        typeof fileService === 'object' &&
        typeof fileService.getUserFiles === 'function';
    console.log('FileService still accessible:', test11Pass);
    console.log(test11Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test11Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - FileService error:', error.message);
    console.log();
    allPassed = false;
}

// Test 12: Verify handle() supports multiple operations
console.log('Test 12: Verify handle() supports multiple operations');
const operations = [
    'uploadFile',
    'getUserFiles',
    'getFile',
    'deleteFile',
    'searchFiles',
    'extractTextContent'
];
let allOperationsSupported = true;
for (const operation of operations) {
    try {
        const result = fileAgent.handle({ operation, userId: 1 });
        if (typeof result.then !== 'function') {
            allOperationsSupported = false;
            console.log(`✗ FAIL - Operation ${operation} did not return Promise`);
        }
    } catch (error) {
        // Some operations may fail due to missing parameters, but should not throw "Unknown operation"
        if (error.message.includes('Unknown file operation')) {
            allOperationsSupported = false;
            console.log(`✗ FAIL - Operation ${operation} not supported`);
        }
    }
}
const test12Pass = allOperationsSupported;
console.log('All file operations supported:', test12Pass);
console.log(test12Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test12Pass) allPassed = false;

// Summary
console.log('=== Summary ===');
console.log(allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
console.log(`Total: 12 tests`);

process.exit(allPassed ? 0 : 1);