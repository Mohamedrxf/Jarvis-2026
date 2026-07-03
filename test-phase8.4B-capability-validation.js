// Test Phase 8.4B - Capability Validation
// Tests the validateAgentCapabilities method

const agentService = require('./server/services/agentService');

console.log('=== Testing Phase 8.4B - Capability Validation ===\n');

let allPassed = true;

// Test 1: Valid capability object passes
console.log('Test 1: Valid capability object passes');
const validCapabilities = agentService.getAgentCapabilities();
const validationResult1 = agentService.validateAgentCapabilities(validCapabilities);
const test1Pass = validationResult1.valid === true && validationResult1.errors.length === 0;
console.log('Valid capabilities:', validationResult1.valid);
console.log('Errors:', validationResult1.errors);
console.log(test1Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test1Pass) allPassed = false;

// Test 2: Missing arrays fail
console.log('Test 2: Missing arrays fail');
const missingRoutes = {
    tools: ["calculator", "weather", "currency", "uuid", "password", "datetime", "web_search"],
    contexts: ["semantic_memory", "knowledge_graph", "uploaded_files"],
    responseTypes: ["tool_response", "memory_response", "file_response", "ai_response"]
};
const validationResult2 = agentService.validateAgentCapabilities(missingRoutes);
const test2Pass = validationResult2.valid === false &&
    validationResult2.errors.some(err => err.includes('routes must be an array'));
console.log('Valid:', validationResult2.valid);
console.log('Errors:', validationResult2.errors);
console.log(test2Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test2Pass) allPassed = false;

// Test 3: Missing required values fail
console.log('Test 3: Missing required values fail');
const missingRequiredRoutes = {
    routes: ["tool", "memory"], // Missing 'file' and 'ai'
    tools: ["calculator", "weather", "currency", "uuid", "password", "datetime", "web_search"],
    contexts: ["semantic_memory", "knowledge_graph", "uploaded_files"],
    responseTypes: ["tool_response", "memory_response", "file_response", "ai_response"]
};
const validationResult3 = agentService.validateAgentCapabilities(missingRequiredRoutes);
const test3Pass = validationResult3.valid === false &&
    validationResult3.errors.some(err => err.includes('Missing required routes'));
console.log('Valid:', validationResult3.valid);
console.log('Errors:', validationResult3.errors);
console.log(test3Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test3Pass) allPassed = false;

// Test 4: Missing required tools fail
console.log('Test 4: Missing required tools fail');
const missingRequiredTools = {
    routes: ["tool", "memory", "file", "ai"],
    tools: ["calculator", "weather"], // Missing required tools
    contexts: ["semantic_memory", "knowledge_graph", "uploaded_files"],
    responseTypes: ["tool_response", "memory_response", "file_response", "ai_response"]
};
const validationResult4 = agentService.validateAgentCapabilities(missingRequiredTools);
const test4Pass = validationResult4.valid === false &&
    validationResult4.errors.some(err => err.includes('Missing required tools'));
console.log('Valid:', validationResult4.valid);
console.log('Errors:', validationResult4.errors);
console.log(test4Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test4Pass) allPassed = false;

// Test 5: Missing required contexts fail
console.log('Test 5: Missing required contexts fail');
const missingRequiredContexts = {
    routes: ["tool", "memory", "file", "ai"],
    tools: ["calculator", "weather", "currency", "uuid", "password", "datetime", "web_search"],
    contexts: ["semantic_memory"], // Missing required contexts
    responseTypes: ["tool_response", "memory_response", "file_response", "ai_response"]
};
const validationResult5 = agentService.validateAgentCapabilities(missingRequiredContexts);
const test5Pass = validationResult5.valid === false &&
    validationResult5.errors.some(err => err.includes('Missing required contexts'));
console.log('Valid:', validationResult5.valid);
console.log('Errors:', validationResult5.errors);
console.log(test5Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test5Pass) allPassed = false;

// Test 6: Missing required responseTypes fail
console.log('Test 6: Missing required responseTypes fail');
const missingRequiredResponseTypes = {
    routes: ["tool", "memory", "file", "ai"],
    tools: ["calculator", "weather", "currency", "uuid", "password", "datetime", "web_search"],
    contexts: ["semantic_memory", "knowledge_graph", "uploaded_files"],
    responseTypes: ["tool_response"] // Missing required responseTypes
};
const validationResult6 = agentService.validateAgentCapabilities(missingRequiredResponseTypes);
const test6Pass = validationResult6.valid === false &&
    validationResult6.errors.some(err => err.includes('Missing required responseTypes'));
console.log('Valid:', validationResult6.valid);
console.log('Errors:', validationResult6.errors);
console.log(test6Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test6Pass) allPassed = false;

// Test 7: Invalid object (null) fails
console.log('Test 7: Invalid object (null) fails');
const validationResult7 = agentService.validateAgentCapabilities(null);
const test7Pass = validationResult7.valid === false &&
    validationResult7.errors.some(err => err.includes('Capabilities must be an object'));
console.log('Valid:', validationResult7.valid);
console.log('Errors:', validationResult7.errors);
console.log(test7Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test7Pass) allPassed = false;

// Test 8: Invalid object (array) fails
console.log('Test 8: Invalid object (array) fails');
const validationResult8 = agentService.validateAgentCapabilities([]);
const test8Pass = validationResult8.valid === false &&
    validationResult8.errors.some(err => err.includes('Capabilities must be an object'));
console.log('Valid:', validationResult8.valid);
console.log('Errors:', validationResult8.errors);
console.log(test8Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test8Pass) allPassed = false;

// Test 9: Invalid object (string) fails
console.log('Test 9: Invalid object (string) fails');
const validationResult9 = agentService.validateAgentCapabilities("invalid");
const test9Pass = validationResult9.valid === false &&
    validationResult9.errors.some(err => err.includes('Capabilities must be an object'));
console.log('Valid:', validationResult9.valid);
console.log('Errors:', validationResult9.errors);
console.log(test9Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test9Pass) allPassed = false;

// Test 10: Multiple missing arrays fail
console.log('Test 10: Multiple missing arrays fail');
const multipleMissing = {
    routes: "not an array",
    tools: null,
    contexts: undefined,
    responseTypes: 123
};
const validationResult10 = agentService.validateAgentCapabilities(multipleMissing);
const test10Pass = validationResult10.valid === false &&
    validationResult10.errors.length >= 4 &&
    validationResult10.errors.some(err => err.includes('routes must be an array')) &&
    validationResult10.errors.some(err => err.includes('tools must be an array')) &&
    validationResult10.errors.some(err => err.includes('contexts must be an array')) &&
    validationResult10.errors.some(err => err.includes('responseTypes must be an array'));
console.log('Valid:', validationResult10.valid);
console.log('Errors:', validationResult10.errors);
console.log('Error count:', validationResult10.errors.length);
console.log(test10Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test10Pass) allPassed = false;

// Test 11: Empty object fails
console.log('Test 11: Empty object fails');
const validationResult11 = agentService.validateAgentCapabilities({});
const test11Pass = validationResult11.valid === false && validationResult11.errors.length > 0;
console.log('Valid:', validationResult11.valid);
console.log('Errors:', validationResult11.errors);
console.log(test11Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test11Pass) allPassed = false;

// Test 12: Partial valid capabilities (all arrays present but missing values)
console.log('Test 12: Partial valid capabilities (all arrays present but missing values)');
const partialValid = {
    routes: ["tool", "memory", "file", "ai"],
    tools: ["calculator", "weather"], // Missing tools
    contexts: ["semantic_memory", "knowledge_graph", "uploaded_files"],
    responseTypes: ["tool_response", "memory_response", "file_response", "ai_response"]
};
const validationResult12 = agentService.validateAgentCapabilities(partialValid);
const test12Pass = validationResult12.valid === false &&
    validationResult12.errors.some(err => err.includes('Missing required tools'));
console.log('Valid:', validationResult12.valid);
console.log('Errors:', validationResult12.errors);
console.log(test12Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test12Pass) allPassed = false;

// Test 13: Verify validation is synchronous (no async indicators)
console.log('Test 13: Verify validation is synchronous (no async indicators)');
const validationResult13 = agentService.validateAgentCapabilities(validCapabilities);
const test13Pass = typeof validationResult13 === 'object' &&
    !validationResult13.hasOwnProperty('promise') &&
    !validationResult13.hasOwnProperty('then') &&
    !validationResult13.hasOwnProperty('catch');
console.log('No async indicators:', test13Pass);
console.log(test13Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test13Pass) allPassed = false;

// Test 14: Verify existing methods still work
console.log('Test 14: Verify existing methods still work');
const analyzeResult = agentService.analyzeRequest("weather in London");
const strategyResult = agentService.buildResponseStrategy("tool");
const capabilitiesResult = agentService.getAgentCapabilities();
const test14Pass = analyzeResult.route === "tool" &&
    strategyResult.type === "tool_response" &&
    strategyResult.useAI === false &&
    capabilitiesResult.routes.length === 4;
console.log('analyzeRequest works:', analyzeResult.route === "tool");
console.log('buildResponseStrategy works:', strategyResult.type === "tool_response");
console.log('getAgentCapabilities works:', capabilitiesResult.routes.length === 4);
console.log(test14Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test14Pass) allPassed = false;

// Summary
console.log('=== Summary ===');
console.log(allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
console.log(`Total: 14 tests`);

process.exit(allPassed ? 0 : 1);