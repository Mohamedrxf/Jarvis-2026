// Test Phase 10.0B - Shared Context Plan
// Tests the buildSharedContextPlan method

const agentService = require('./server/services/agentService');

console.log('=== Testing buildSharedContextPlan ===\n');

// Test 1: Tool route (single agent, no memory, no file)
const toolExecutionOrder = {
    sequential: true,
    parallel: false,
    order: ["tool"]
};
const toolContext = agentService.buildSharedContextPlan(toolExecutionOrder);
console.log('Test 1 - Tool route:');
console.log('Input:', JSON.stringify(toolExecutionOrder));
console.log('Output:', JSON.stringify(toolContext));
console.log('Expected: { shareMemory: false, shareFiles: false, shareToolResults: false }');
console.log('Pass:', toolContext.shareMemory === false && toolContext.shareFiles === false &&
    toolContext.shareToolResults === false ? '✓' : '✗');
console.log();

// Test 2: Memory route (single agent, has memory)
const memoryExecutionOrder = {
    sequential: true,
    parallel: false,
    order: ["memory"]
};
const memoryContext = agentService.buildSharedContextPlan(memoryExecutionOrder);
console.log('Test 2 - Memory route:');
console.log('Input:', JSON.stringify(memoryExecutionOrder));
console.log('Output:', JSON.stringify(memoryContext));
console.log('Expected: { shareMemory: true, shareFiles: false, shareToolResults: false }');
console.log('Pass:', memoryContext.shareMemory === true && memoryContext.shareFiles === false &&
    memoryContext.shareToolResults === false ? '✓' : '✗');
console.log();

// Test 3: File route (single agent, has file)
const fileExecutionOrder = {
    sequential: true,
    parallel: false,
    order: ["file"]
};
const fileContext = agentService.buildSharedContextPlan(fileExecutionOrder);
console.log('Test 3 - File route:');
console.log('Input:', JSON.stringify(fileExecutionOrder));
console.log('Output:', JSON.stringify(fileContext));
console.log('Expected: { shareMemory: false, shareFiles: true, shareToolResults: false }');
console.log('Pass:', fileContext.shareMemory === false && fileContext.shareFiles === true &&
    fileContext.shareToolResults === false ? '✓' : '✗');
console.log();

// Test 4: AI route (single agent, no memory, no file)
const aiExecutionOrder = {
    sequential: true,
    parallel: false,
    order: ["ai"]
};
const aiContext = agentService.buildSharedContextPlan(aiExecutionOrder);
console.log('Test 4 - AI route:');
console.log('Input:', JSON.stringify(aiExecutionOrder));
console.log('Output:', JSON.stringify(aiContext));
console.log('Expected: { shareMemory: false, shareFiles: false, shareToolResults: false }');
console.log('Pass:', aiContext.shareMemory === false && aiContext.shareFiles === false &&
    aiContext.shareToolResults === false ? '✓' : '✗');
console.log();

// Test 5: Multi-agent plan (multiple agents)
const multiAgentExecutionOrder = {
    sequential: true,
    parallel: false,
    order: ["tool", "memory", "ai"]
};
const multiAgentContext = agentService.buildSharedContextPlan(multiAgentExecutionOrder);
console.log('Test 5 - Multi-agent plan:');
console.log('Input:', JSON.stringify(multiAgentExecutionOrder));
console.log('Output:', JSON.stringify(multiAgentContext));
console.log('Expected: { shareMemory: true, shareFiles: false, shareToolResults: true }');
console.log('Pass:', multiAgentContext.shareMemory === true && multiAgentContext.shareFiles === false &&
    multiAgentContext.shareToolResults === true ? '✓' : '✗');
console.log();

// Test 6: Multi-agent with file and memory
const multiAgentFileMemory = {
    sequential: true,
    parallel: false,
    order: ["file", "memory"]
};
const multiAgentFileMemoryContext = agentService.buildSharedContextPlan(multiAgentFileMemory);
console.log('Test 6 - Multi-agent (file + memory):');
console.log('Input:', JSON.stringify(multiAgentFileMemory));
console.log('Output:', JSON.stringify(multiAgentFileMemoryContext));
console.log('Expected: { shareMemory: true, shareFiles: true, shareToolResults: true }');
console.log('Pass:', multiAgentFileMemoryContext.shareMemory === true &&
    multiAgentFileMemoryContext.shareFiles === true &&
    multiAgentFileMemoryContext.shareToolResults === true ? '✓' : '✗');
console.log();

// Test 7: Empty/null execution order
const emptyContext = agentService.buildSharedContextPlan(null);
console.log('Test 7 - Null/undefined execution order:');
console.log('Input:', null);
console.log('Output:', JSON.stringify(emptyContext));
console.log('Expected: { shareMemory: false, shareFiles: false, shareToolResults: false }');
console.log('Pass:', emptyContext.shareMemory === false && emptyContext.shareFiles === false &&
    emptyContext.shareToolResults === false ? '✓' : '✗');
console.log();

// Test 8: Empty order array
const emptyOrderContext = agentService.buildSharedContextPlan({ order: [] });
console.log('Test 8 - Empty order array:');
console.log('Input:', JSON.stringify({ order: [] }));
console.log('Output:', JSON.stringify(emptyOrderContext));
console.log('Expected: { shareMemory: false, shareFiles: false, shareToolResults: false }');
console.log('Pass:', emptyOrderContext.shareMemory === false && emptyOrderContext.shareFiles === false &&
    emptyOrderContext.shareToolResults === false ? '✓' : '✗');
console.log();

// Summary
const allPassed = [
    toolContext.shareMemory === false && toolContext.shareFiles === false && toolContext.shareToolResults === false,
    memoryContext.shareMemory === true && memoryContext.shareFiles === false && memoryContext.shareToolResults === false,
    fileContext.shareMemory === false && fileContext.shareFiles === true && fileContext.shareToolResults === false,
    aiContext.shareMemory === false && aiContext.shareFiles === false && aiContext.shareToolResults === false,
    multiAgentContext.shareMemory === true && multiAgentContext.shareFiles === false && multiAgentContext.shareToolResults === true,
    multiAgentFileMemoryContext.shareMemory === true && multiAgentFileMemoryContext.shareFiles === true && multiAgentFileMemoryContext.shareToolResults === true,
    emptyContext.shareMemory === false && emptyContext.shareFiles === false && emptyContext.shareToolResults === false,
    emptyOrderContext.shareMemory === false && emptyOrderContext.shareFiles === false && emptyOrderContext.shareToolResults === false
].every(result => result);

console.log('=== Summary ===');
console.log('Total tests: 8');
console.log('Passed:', allPassed ? '8/8 ✓' : 'Some tests failed ✗');
console.log('Status:', allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');

process.exit(allPassed ? 0 : 1);