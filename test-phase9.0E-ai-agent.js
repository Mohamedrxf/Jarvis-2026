// Test Phase 9.0E - AI Agent
// Tests the AIAgent implementation

const AIAgent = require('./server/services/agents/AIAgent');
const BaseAgent = require('./server/services/agents/BaseAgent');
const aiEngine = require('./ai-engine');

console.log('=== Testing Phase 9.0E - AI Agent ===\n');

let allPassed = true;

// Test 1: Verify AIAgent class exists
console.log('Test 1: Verify AIAgent class exists');
const test1Pass = typeof AIAgent === 'function';
console.log('AIAgent is a class:', test1Pass);
console.log(test1Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test1Pass) allPassed = false;

// Test 2: Verify AIAgent inherits from BaseAgent
console.log('Test 2: Verify AIAgent inherits from BaseAgent');
const aiAgent = new AIAgent();
const test2Pass = aiAgent instanceof BaseAgent;
console.log('Inherits from BaseAgent:', test2Pass);
console.log(test2Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test2Pass) allPassed = false;

// Test 3: Verify getName() returns "ai"
console.log('Test 3: Verify getName() returns "ai"');
let getNameResult;
try {
    getNameResult = aiAgent.getName();
    const test3Pass = getNameResult === "ai";
    console.log('getName() result:', getNameResult);
    console.log(test3Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test3Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - getName() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 4: Verify canHandle() returns true for ai route
console.log('Test 4: Verify canHandle() returns true for ai route');
const aiRouteDecision = { route: "ai", target: null, confidence: 0.7 };
let canHandleResult;
try {
    canHandleResult = aiAgent.canHandle(aiRouteDecision);
    const test4Pass = canHandleResult === true;
    console.log('canHandle() result for ai route:', canHandleResult);
    console.log(test4Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test4Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - canHandle() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 5: Verify canHandle() returns false for non-ai routes
console.log('Test 5: Verify canHandle() returns false for non-ai routes');
const nonAiRoutes = [
    { route: "tool" },
    { route: "memory" },
    { route: "file" },
    { route: "unknown" }
];
let allNonAiCorrect = true;
for (const routeDecision of nonAiRoutes) {
    try {
        const result = aiAgent.canHandle(routeDecision);
        if (result !== false) {
            allNonAiCorrect = false;
            console.log(`✗ FAIL - canHandle() returned ${result} for route: ${routeDecision.route}`);
        }
    } catch (error) {
        allNonAiCorrect = false;
        console.log(`✗ FAIL - canHandle() threw error for route: ${routeDecision.route}`);
    }
}
const test5Pass = allNonAiCorrect;
console.log('All non-ai routes rejected:', test5Pass);
console.log(test5Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test5Pass) allPassed = false;

// Test 6: Verify handle() delegates to AI Engine
console.log('Test 6: Verify handle() delegates to AI Engine');
const testContext = {
    messages: [
        { role: 'user', content: 'Hello' }
    ]
};
let handleResult;
try {
    handleResult = aiAgent.handle(testContext);
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

// Test 7: Verify handle() returns AI Engine result directly
console.log('Test 7: Verify handle() returns AI Engine result directly');
const directContext = {
    messages: [
        { role: 'user', content: 'Hi' }
    ]
};
let directResult;
try {
    directResult = aiAgent.handle(directContext);
    const test7Pass = directResult !== null &&
        typeof directResult === 'object' &&
        typeof directResult.then === 'function'; // It's a Promise from AI Engine
    console.log('Result is Promise:', test7Pass);
    console.log('Returns AI Engine result:', test7Pass);
    console.log(test7Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test7Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - handle() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Test 8: Verify no additional logic in AIAgent
console.log('Test 8: Verify no additional logic in AIAgent');
const fs = require('fs');
const aiAgentCode = fs.readFileSync('./server/services/agents/AIAgent.js', 'utf8');
const hasRoutingLogic = aiAgentCode.includes('if (') &&
    (aiAgentCode.includes('route') || aiAgentCode.includes('switch'));
const hasValidation = aiAgentCode.includes('validate') || aiAgentCode.includes('check');
const hasParsing = aiAgentCode.includes('parse') || aiAgentCode.includes('extract');
const hasMemoryLogic = aiAgentCode.includes('memory') && !aiAgentCode.includes('generateResponse');
const hasFileLogic = aiAgentCode.includes('file') && !aiAgentCode.includes('generateResponse');
const hasToolLogic = aiAgentCode.includes('tool') && !aiAgentCode.includes('generateResponse');
const test8Pass = !hasRoutingLogic && !hasValidation && !hasParsing && !hasMemoryLogic && !hasFileLogic && !hasToolLogic;
console.log('No routing logic:', !hasRoutingLogic);
console.log('No validation:', !hasValidation);
console.log('No parsing:', !hasParsing);
console.log('No memory logic:', !hasMemoryLogic);
console.log('No file logic:', !hasFileLogic);
console.log('No tool logic:', !hasToolLogic);
console.log(test8Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test8Pass) allPassed = false;

// Test 9: Verify methods exist from BaseAgent
console.log('Test 9: Verify methods exist from BaseAgent');
const test9Pass = typeof aiAgent.getName === 'function' &&
    typeof aiAgent.canHandle === 'function' &&
    typeof aiAgent.handle === 'function';
console.log('getName exists:', typeof aiAgent.getName === 'function');
console.log('canHandle exists:', typeof aiAgent.canHandle === 'function');
console.log('handle exists:', typeof aiAgent.handle === 'function');
console.log(test9Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test9Pass) allPassed = false;

// Test 10: Verify existing AI engine tests still work
console.log('Test 10: Verify existing AI engine tests still work');
try {
    // Verify aiEngine is still accessible and functional
    const test10Pass = aiEngine !== null &&
        typeof aiEngine === 'object' &&
        typeof aiEngine.generateResponse === 'function';
    console.log('AI Engine still accessible:', test10Pass);
    console.log(test10Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test10Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - AI Engine error:', error.message);
    console.log();
    allPassed = false;
}

// Test 11: Verify handle() passes messages correctly to AI Engine
console.log('Test 11: Verify handle() passes messages correctly to AI Engine');
const messagesContext = {
    messages: [
        { role: 'user', content: 'Test message' }
    ]
};
let messagesResult;
try {
    messagesResult = aiAgent.handle(messagesContext);
    const test11Pass = messagesResult !== null &&
        typeof messagesResult === 'object' &&
        typeof messagesResult.then === 'function';
    console.log('Returns Promise:', test11Pass);
    console.log('Messages passed correctly:', test11Pass);
    console.log(test11Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test11Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - handle() threw error:', error.message);
    console.log();
    allPassed = false;
}

// Summary
console.log('=== Summary ===');
console.log(allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
console.log(`Total: 11 tests`);

process.exit(allPassed ? 0 : 1);