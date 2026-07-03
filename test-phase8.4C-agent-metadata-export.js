// Test Phase 8.4C - Agent Metadata Export
// Tests the exportAgentMetadata method

const agentService = require('./server/services/agentService');

console.log('=== Testing Phase 8.4C - Agent Metadata Export ===\n');

let allPassed = true;

// Test 1: Verify metadata object structure
console.log('Test 1: Verify metadata object structure');
const metadata = agentService.exportAgentMetadata();
const test1Pass = typeof metadata === 'object' &&
    metadata !== null &&
    metadata.hasOwnProperty('capabilities') &&
    metadata.hasOwnProperty('valid') &&
    metadata.hasOwnProperty('version') &&
    metadata.hasOwnProperty('name');
console.log('Has required properties:', test1Pass);
console.log('Properties:', Object.keys(metadata));
console.log(test1Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test1Pass) allPassed = false;

// Test 2: Verify capabilities populated
console.log('Test 2: Verify capabilities populated');
const test2Pass = metadata.capabilities !== null &&
    typeof metadata.capabilities === 'object' &&
    Array.isArray(metadata.capabilities.routes) &&
    Array.isArray(metadata.capabilities.tools) &&
    Array.isArray(metadata.capabilities.contexts) &&
    Array.isArray(metadata.capabilities.responseTypes) &&
    metadata.capabilities.routes.length === 4 &&
    metadata.capabilities.tools.length === 7 &&
    metadata.capabilities.contexts.length === 3 &&
    metadata.capabilities.responseTypes.length === 4;
console.log('Capabilities is object:', typeof metadata.capabilities === 'object');
console.log('Routes count:', metadata.capabilities.routes.length);
console.log('Tools count:', metadata.capabilities.tools.length);
console.log('Contexts count:', metadata.capabilities.contexts.length);
console.log('ResponseTypes count:', metadata.capabilities.responseTypes.length);
console.log(test2Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test2Pass) allPassed = false;

// Test 3: Verify validation succeeds
console.log('Test 3: Verify validation succeeds');
const test3Pass = metadata.valid === true;
console.log('Validation result:', metadata.valid);
console.log(test3Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test3Pass) allPassed = false;

// Test 4: Verify version is correct
console.log('Test 4: Verify version is correct');
const test4Pass = metadata.version === "8.4";
console.log('Version:', metadata.version);
console.log(test4Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test4Pass) allPassed = false;

// Test 5: Verify name is correct
console.log('Test 5: Verify name is correct');
const test5Pass = metadata.name === "Jarvis Agent Framework";
console.log('Name:', metadata.name);
console.log(test5Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test5Pass) allPassed = false;

// Test 6: Verify capabilities match getAgentCapabilities()
console.log('Test 6: Verify capabilities match getAgentCapabilities()');
const directCapabilities = agentService.getAgentCapabilities();
const test6Pass = JSON.stringify(metadata.capabilities) === JSON.stringify(directCapabilities);
console.log('Capabilities match:', test6Pass);
console.log(test6Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test6Pass) allPassed = false;

// Test 7: Verify validation matches validateAgentCapabilities()
console.log('Test 7: Verify validation matches validateAgentCapabilities()');
const directValidation = agentService.validateAgentCapabilities(directCapabilities);
const test7Pass = metadata.valid === directValidation.valid;
console.log('Validation matches:', test7Pass);
console.log('Metadata valid:', metadata.valid);
console.log('Direct validation valid:', directValidation.valid);
console.log(test7Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test7Pass) allPassed = false;

// Test 8: Verify metadata is static (no async indicators)
console.log('Test 8: Verify metadata is static (no async indicators)');
const test8Pass = typeof metadata === 'object' &&
    !metadata.hasOwnProperty('promise') &&
    !metadata.hasOwnProperty('then') &&
    !metadata.hasOwnProperty('catch') &&
    !metadata.capabilities.hasOwnProperty('promise') &&
    !metadata.capabilities.hasOwnProperty('then') &&
    !metadata.capabilities.hasOwnProperty('catch');
console.log('No async indicators:', test8Pass);
console.log(test8Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test8Pass) allPassed = false;

// Test 9: Verify routes content
console.log('Test 9: Verify routes content');
const expectedRoutes = ["tool", "memory", "file", "ai"];
const test9Pass = JSON.stringify(metadata.capabilities.routes) === JSON.stringify(expectedRoutes);
console.log('Expected:', JSON.stringify(expectedRoutes));
console.log('Actual:', JSON.stringify(metadata.capabilities.routes));
console.log(test9Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test9Pass) allPassed = false;

// Test 10: Verify tools content
console.log('Test 10: Verify tools content');
const expectedTools = ["calculator", "weather", "currency", "uuid", "password", "datetime", "web_search"];
const test10Pass = JSON.stringify(metadata.capabilities.tools) === JSON.stringify(expectedTools);
console.log('Expected:', JSON.stringify(expectedTools));
console.log('Actual:', JSON.stringify(metadata.capabilities.tools));
console.log(test10Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test10Pass) allPassed = false;

// Test 11: Verify contexts content
console.log('Test 11: Verify contexts content');
const expectedContexts = ["semantic_memory", "knowledge_graph", "uploaded_files"];
const test11Pass = JSON.stringify(metadata.capabilities.contexts) === JSON.stringify(expectedContexts);
console.log('Expected:', JSON.stringify(expectedContexts));
console.log('Actual:', JSON.stringify(metadata.capabilities.contexts));
console.log(test11Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test11Pass) allPassed = false;

// Test 12: Verify responseTypes content
console.log('Test 12: Verify responseTypes content');
const expectedResponseTypes = ["tool_response", "memory_response", "file_response", "ai_response"];
const test12Pass = JSON.stringify(metadata.capabilities.responseTypes) === JSON.stringify(expectedResponseTypes);
console.log('Expected:', JSON.stringify(expectedResponseTypes));
console.log('Actual:', JSON.stringify(metadata.capabilities.responseTypes));
console.log(test12Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test12Pass) allPassed = false;

// Test 13: Verify existing methods still work
console.log('Test 13: Verify existing methods still work');
const analyzeResult = agentService.analyzeRequest("weather in London");
const strategyResult = agentService.buildResponseStrategy("tool");
const capabilitiesResult = agentService.getAgentCapabilities();
const validationResult = agentService.validateAgentCapabilities(capabilitiesResult);
const test13Pass = analyzeResult.route === "tool" &&
    strategyResult.type === "tool_response" &&
    capabilitiesResult.routes.length === 4 &&
    validationResult.valid === true;
console.log('analyzeRequest works:', analyzeResult.route === "tool");
console.log('buildResponseStrategy works:', strategyResult.type === "tool_response");
console.log('getAgentCapabilities works:', capabilitiesResult.routes.length === 4);
console.log('validateAgentCapabilities works:', validationResult.valid === true);
console.log(test13Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test13Pass) allPassed = false;

// Test 14: Verify metadata is consistent across multiple calls
console.log('Test 14: Verify metadata is consistent across multiple calls');
const metadata1 = agentService.exportAgentMetadata();
const metadata2 = agentService.exportAgentMetadata();
const test14Pass = JSON.stringify(metadata1) === JSON.stringify(metadata2);
console.log('Consistent across calls:', test14Pass);
console.log(test14Pass ? '✓ PASS' : '✗ FAIL');
console.log();
if (!test14Pass) allPassed = false;

// Summary
console.log('=== Summary ===');
console.log(allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
console.log(`Total: 14 tests`);

process.exit(allPassed ? 0 : 1);