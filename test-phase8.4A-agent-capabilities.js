// Test Phase 8.4A - Agent Capability Registry
// Tests the getAgentCapabilities method

const agentService = require('./server/services/agentService');

console.log('=== Testing Phase 8.4A - Agent Capability Registry ===\n');

// Test 1: Verify getAgentCapabilities exists and returns object
console.log('Test 1: Verify getAgentCapabilities exists and returns object');
const capabilities = agentService.getAgentCapabilities();
const existsPass = typeof capabilities === 'object' && capabilities !== null;
console.log(existsPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 2: Verify routes array
console.log('Test 2: Verify routes array');
const expectedRoutes = ["tool", "memory", "file", "ai"];
const routesPass = Array.isArray(capabilities.routes) &&
    capabilities.routes.length === 4 &&
    JSON.stringify(capabilities.routes) === JSON.stringify(expectedRoutes);
console.log('Expected:', JSON.stringify(expectedRoutes));
console.log('Actual:', JSON.stringify(capabilities.routes));
console.log(routesPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 3: Verify tools array
console.log('Test 3: Verify tools array');
const expectedTools = ["calculator", "weather", "currency", "uuid", "password", "datetime", "web_search"];
const toolsPass = Array.isArray(capabilities.tools) &&
    capabilities.tools.length === 7 &&
    JSON.stringify(capabilities.tools) === JSON.stringify(expectedTools);
console.log('Expected:', JSON.stringify(expectedTools));
console.log('Actual:', JSON.stringify(capabilities.tools));
console.log(toolsPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 4: Verify contexts array
console.log('Test 4: Verify contexts array');
const expectedContexts = ["semantic_memory", "knowledge_graph", "uploaded_files"];
const contextsPass = Array.isArray(capabilities.contexts) &&
    capabilities.contexts.length === 3 &&
    JSON.stringify(capabilities.contexts) === JSON.stringify(expectedContexts);
console.log('Expected:', JSON.stringify(expectedContexts));
console.log('Actual:', JSON.stringify(capabilities.contexts));
console.log(contextsPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 5: Verify responseTypes array
console.log('Test 5: Verify responseTypes array');
const expectedResponseTypes = ["tool_response", "memory_response", "file_response", "ai_response"];
const responseTypesPass = Array.isArray(capabilities.responseTypes) &&
    capabilities.responseTypes.length === 4 &&
    JSON.stringify(capabilities.responseTypes) === JSON.stringify(expectedResponseTypes);
console.log('Expected:', JSON.stringify(expectedResponseTypes));
console.log('Actual:', JSON.stringify(capabilities.responseTypes));
console.log(responseTypesPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 6: Verify complete structure
console.log('Test 6: Verify complete structure');
const hasAllKeys = capabilities.hasOwnProperty('routes') &&
    capabilities.hasOwnProperty('tools') &&
    capabilities.hasOwnProperty('contexts') &&
    capabilities.hasOwnProperty('responseTypes');
const structurePass = hasAllKeys && routesPass && toolsPass && contextsPass && responseTypesPass;
console.log('Has all required keys:', hasAllKeys);
console.log('All arrays valid:', structurePass);
console.log(structurePass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 7: Verify static metadata (no service calls)
console.log('Test 7: Verify static metadata (no service calls)');
const staticPass = typeof capabilities === 'object' &&
    !capabilities.hasOwnProperty('promise') &&
    !capabilities.hasOwnProperty('then') &&
    !capabilities.hasOwnProperty('catch');
console.log('No async indicators:', staticPass);
console.log(staticPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 8: Verify existing methods still work
console.log('Test 8: Verify existing methods still work');
const analyzeResult = agentService.analyzeRequest("weather in London");
const strategyResult = agentService.buildResponseStrategy("tool");
const existingMethodsPass = analyzeResult.route === "tool" &&
    strategyResult.type === "tool_response" &&
    strategyResult.useAI === false;
console.log('analyzeRequest works:', analyzeResult.route === "tool");
console.log('buildResponseStrategy works:', strategyResult.type === "tool_response");
console.log(existingMethodsPass ? '✓ PASS' : '✗ FAIL');
console.log();

// Summary
const allPassed = existsPass && routesPass && toolsPass && contextsPass && responseTypesPass && structurePass && staticPass && existingMethodsPass;
console.log('=== Summary ===');
console.log(allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
console.log(`Total: 8 tests`);

process.exit(allPassed ? 0 : 1);