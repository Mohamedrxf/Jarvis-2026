// Test Phase 9.0A - Base Agent Interface
// Tests the BaseAgent abstract class

const BaseAgent = require('./server/services/agents/BaseAgent');

console.log('=== Testing Phase 9.0A - Base Agent Interface ===\n');

let allPassed = true;

// Test 1: Verify BaseAgent class exists
console.log('Test 1: Verify BaseAgent class exists');
const test1Pass = typeof BaseAgent === 'function';
console.log('BaseAgent is a class:', test1Pass);
console.log(test1Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test1Pass) allPassed = false;

// Test 2: Verify can instantiate
console.log('Test 2: Verify can instantiate');
let agent;
try {
    agent = new BaseAgent();
    const test2Pass = agent !== null && typeof agent === 'object';
    console.log('Instantiation successful:', test2Pass);
    console.log(test2Pass ? '✓ PASS' : '✗ FAIL');
    console.log();
    if (!test2Pass) allPassed = false;
} catch (error) {
    console.log('✗ FAIL - Instantiation failed:', error.message);
    console.log();
    allPassed = false;
}

// Test 3: Verify getName() throws "Not implemented"
console.log('Test 3: Verify getName() throws "Not implemented"');
let getNameThrew = false;
let getNameError = null;
try {
    agent.getName();
} catch (error) {
    getNameThrew = true;
    getNameError = error;
}
const test3Pass = getNameThrew && getNameError instanceof Error && getNameError.message === "Not implemented";
console.log('Threw error:', getNameThrew);
console.log('Error message:', getNameError ? getNameError.message : 'N/A');
console.log(test3Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test3Pass) allPassed = false;

// Test 4: Verify canHandle() throws "Not implemented"
console.log('Test 4: Verify canHandle() throws "Not implemented"');
let canHandleThrew = false;
let canHandleError = null;
try {
    agent.canHandle("test message");
} catch (error) {
    canHandleThrew = true;
    canHandleError = error;
}
const test4Pass = canHandleThrew && canHandleError instanceof Error && canHandleError.message === "Not implemented";
console.log('Threw error:', canHandleThrew);
console.log('Error message:', canHandleError ? canHandleError.message : 'N/A');
console.log(test4Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test4Pass) allPassed = false;

// Test 5: Verify handle() throws "Not implemented"
console.log('Test 5: Verify handle() throws "Not implemented"');
let handleThrew = false;
let handleError = null;
try {
    agent.handle({ route: "ai", message: "test" });
} catch (error) {
    handleThrew = true;
    handleError = error;
}
const test5Pass = handleThrew && handleError instanceof Error && handleError.message === "Not implemented";
console.log('Threw error:', handleThrew);
console.log('Error message:', handleError ? handleError.message : 'N/A');
console.log(test5Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test5Pass) allPassed = false;

// Test 6: Verify methods exist on prototype
console.log('Test 6: Verify methods exist on prototype');
const test6Pass = typeof BaseAgent.prototype.getName === 'function' &&
    typeof BaseAgent.prototype.canHandle === 'function' &&
    typeof BaseAgent.prototype.handle === 'function';
console.log('getName is function:', typeof BaseAgent.prototype.getName === 'function');
console.log('canHandle is function:', typeof BaseAgent.prototype.canHandle === 'function');
console.log('handle is function:', typeof BaseAgent.prototype.handle === 'function');
console.log(test6Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test6Pass) allPassed = false;

// Test 7: Verify no async indicators
console.log('Test 7: Verify no async indicators');
const test7Pass = !BaseAgent.prototype.getName.constructor.name.includes('Async') &&
    !BaseAgent.prototype.canHandle.constructor.name.includes('Async') &&
    !BaseAgent.prototype.handle.constructor.name.includes('Async');
console.log('No async function indicators:', test7Pass);
console.log(test7Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test7Pass) allPassed = false;

// Test 8: Verify no service calls or execution
console.log('Test 8: Verify interface contains no logic');
const fs = require('fs');
const baseAgentCode = fs.readFileSync('./server/services/agents/BaseAgent.js', 'utf8');
const hasImports = baseAgentCode.includes('require(') && !baseAgentCode.includes('module.exports');
const hasLogic = baseAgentCode.includes('if (') ||
    baseAgentCode.includes('for (') ||
    baseAgentCode.includes('while (') ||
    baseAgentCode.includes('switch (');
const test8Pass = !hasImports && !hasLogic;
console.log('No imports:', !hasImports);
console.log('No logic:', !hasLogic);
console.log(test8Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test8Pass) allPassed = false;

// Summary
console.log('=== Summary ===');
console.log(allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
console.log(`Total: 8 tests`);

process.exit(allPassed ? 0 : 1);