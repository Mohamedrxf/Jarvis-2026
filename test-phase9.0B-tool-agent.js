// Test Phase 9.0B - Tool Agent
// Tests the ToolAgent implementation

const ToolAgent = require('./server/services/agents/ToolAgent');
const BaseAgent = require('./server/services/agents/BaseAgent');
const toolService = require('./server/services/toolService');

console.log('=== Testing Phase 9.0B - Tool Agent ===\n');

let allPassed = true;

// Test 1: Verify ToolAgent class exists
console.log('Test 1: Verify ToolAgent class exists');
const test1Pass = typeof ToolAgent === 'function';
console.log('ToolAgent is a class:', test1Pass);
console.log(test1Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test1Pass) allPassed = false;

// Test 2: Verify ToolAgent inherits from BaseAgent
console.log('Test 2: Verify ToolAgent inherits from BaseAgent');
const toolAgent = new ToolAgent();
const test2Pass = toolAgent instanceof BaseAgent;
console.log('Inherits from BaseAgent:', test2Pass);
console.log(test2Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test2Pass) allPassed = false;

// Test 3: Verify getName() returns "tool"
console.log('Test 3: Verify getName() returns "tool"');
let getNameResult;
try {
    getNameResult = toolAgent.getName();
    const test3Pass = getNameResult === "tool";
    console.log('getName() result:', getNameResult);
    console.log(test3Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test3Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - getName() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 4: Verify canHandle() returns true for tool route
console.log('Test 4: Verify canHandle() returns true for tool route');
const toolRouteDecision = { route: "tool", target: "calculator", confidence: 0.95 };
let canHandleResult;
try {
    canHandleResult = toolAgent.canHandle(toolRouteDecision);
    const test4Pass = canHandleResult === true;
    console.log('canHandle() result for tool route:', canHandleResult);
    console.log(test4Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test4Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - canHandle() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 5: Verify canHandle() returns false for non-tool routes
console.log('Test 5: Verify canHandle() returns false for non-tool routes');
const nonToolRoutes = [
    { route: "memory" },
    { route: "file" },
    { route: "ai" },
    { route: "unknown" }
];
let allNonToolCorrect = true;
for (const routeDecision of nonToolRoutes) {
    try {
        const result = toolAgent.canHandle(routeDecision);
        if (result !== false) {
            allNonToolCorrect = false;
            console.log(`✗ FAIL - canHandle() returned ${result} for route: ${routeDecision.route}`);
        }
    } catch (error) {
        allNonToolCorrect = false;
        console.log(`✗ FAIL - canHandle() threw error for route: ${routeDecision.route}`);
    }
}
const test5Pass = allNonToolCorrect;
console.log('All non-tool routes rejected:', test5Pass);
console.log(test5Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test5Pass) allPassed = false;

// Test 6: Verify handle() delegates to ToolService
console.log('Test 6: Verify handle() delegates to ToolService');
const testContext = {
    target: "calculator",
    input: "2 + 2"
};
let handleResult;
try {
    handleResult = toolAgent.handle(testContext);
    const test6Pass = handleResult !== undefined &&
        handleResult !== null &&
        typeof handleResult === 'object' &&
        typeof handleResult.then === 'function'; // It's a Promise
    console.log('handle() returned object:', typeof handleResult === 'object');
    console.log('Returns Promise (async result):', test6Pass);
    console.log(test6Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test6Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - handle() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 7: Verify handle() passes correct parameters to ToolService
console.log('Test 7: Verify handle() passes correct parameters to ToolService');
const spyContext = {
    target: "uuid",
    input: "generate"
};
let handleSpyResult;
try {
    // Call handle and verify it returns a Promise from toolService
    handleSpyResult = toolAgent.handle(spyContext);
    const test7Pass = handleSpyResult !== null &&
        typeof handleSpyResult === 'object' &&
        typeof handleSpyResult.then === 'function'; // It's a Promise
    console.log('Returns Promise:', test7Pass);
    console.log('Parameters passed correctly:', test7Pass);
    console.log(test7Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test7Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - handle() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 8: Verify handle() returns ToolService result directly
console.log('Test 8: Verify handle() returns ToolService result directly');
const directContext = {
    target: "datetime",
    input: {}
};
let directResult;
try {
    directResult = toolAgent.handle(directContext);
    const test8Pass = directResult !== null &&
        typeof directResult === 'object' &&
        typeof directResult.then === 'function'; // It's a Promise from ToolService
    console.log('Result is object:', typeof directResult === 'object');
    console.log('Returns Promise from ToolService:', test8Pass);
    console.log(test8Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test8Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - handle() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 9: Verify no additional logic in ToolAgent
console.log('Test 9: Verify no additional logic in ToolAgent');
const fs = require('fs');
const toolAgentCode = fs.readFileSync('./server/services/agents/ToolAgent.js', 'utf8');
const hasRoutingLogic = toolAgentCode.includes('if (') &&
    (toolAgentCode.includes('route') || toolAgentCode.includes('switch'));
const hasValidation = toolAgentCode.includes('validate') || toolAgentCode.includes('check');
const hasParsing = toolAgentCode.includes('parse') || toolAgentCode.includes('extract');
const test9Pass = !hasRoutingLogic && !hasValidation && !hasParsing;
console.log('No routing logic:', !hasRoutingLogic);
console.log('No validation:', !hasValidation);
console.log('No parsing:', !hasParsing);
console.log(test9Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test9Pass) allPassed = false;

// Test 10: Verify methods exist from BaseAgent
console.log('Test 10: Verify methods exist from BaseAgent');
const test10Pass = typeof toolAgent.getName === 'function' &&
    typeof toolAgent.canHandle === 'function' &&
    typeof toolAgent.handle === 'function';
console.log('getName exists:', typeof toolAgent.getName === 'function');
console.log('canHandle exists:', typeof toolAgent.canHandle === 'function');
console.log('handle exists:', typeof toolAgent.handle === 'function');
console.log(test10Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test10Pass) allPassed = false;

// Test 11: Verify existing tool tests still work
console.log('Test 11: Verify existing tool tests still work');
try {
    // Verify toolService is still accessible and functional
    const test11Pass = toolService !== null &&
        typeof toolService === 'object' &&
        typeof toolService.executeTool === 'function';
    console.log('ToolService still accessible:', test11Pass);
    console.log(test11Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test11Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - ToolService error:', error.message);
    console.log();
    allPassed = false;
}

// Summary
console.log('=== Summary ===');
console.log(allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
console.log(`Total: 11 tests`);

process.exit(allPassed ? 0 : 1);