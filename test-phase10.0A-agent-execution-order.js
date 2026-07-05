// Test Phase 10.0A - Agent Execution Order
// Tests the buildAgentExecutionOrder method

const agentService = require('./server/services/agentService');

console.log('=== Testing buildAgentExecutionOrder ===\n');

// Test 1: Tool route
const toolPlan = agentService.buildMultiAgentPlan({ route: "tool", target: "weather" });
const toolOrder = agentService.buildAgentExecutionOrder(toolPlan);
console.log('Test 1 - Tool route:');
console.log('Input:', JSON.stringify(toolPlan));
console.log('Output:', JSON.stringify(toolOrder));
console.log('Expected: { sequential: true, parallel: false, order: ["tool"] }');
console.log('Pass:', toolOrder.sequential === true && toolOrder.parallel === false &&
    toolOrder.order[0] === "tool" ? '✓' : '✗');
console.log();

// Test 2: Memory route
const memoryPlan = agentService.buildMultiAgentPlan({ route: "memory" });
const memoryOrder = agentService.buildAgentExecutionOrder(memoryPlan);
console.log('Test 2 - Memory route:');
console.log('Input:', JSON.stringify(memoryPlan));
console.log('Output:', JSON.stringify(memoryOrder));
console.log('Expected: { sequential: true, parallel: false, order: ["memory"] }');
console.log('Pass:', memoryOrder.sequential === true && memoryOrder.parallel === false &&
    memoryOrder.order[0] === "memory" ? '✓' : '✗');
console.log();

// Test 3: File route
const filePlan = agentService.buildMultiAgentPlan({ route: "file" });
const fileOrder = agentService.buildAgentExecutionOrder(filePlan);
console.log('Test 3 - File route:');
console.log('Input:', JSON.stringify(filePlan));
console.log('Output:', JSON.stringify(fileOrder));
console.log('Expected: { sequential: true, parallel: false, order: ["file"] }');
console.log('Pass:', fileOrder.sequential === true && fileOrder.parallel === false &&
    fileOrder.order[0] === "file" ? '✓' : '✗');
console.log();

// Test 4: AI route
const aiPlan = agentService.buildMultiAgentPlan({ route: "ai" });
const aiOrder = agentService.buildAgentExecutionOrder(aiPlan);
console.log('Test 4 - AI route:');
console.log('Input:', JSON.stringify(aiPlan));
console.log('Output:', JSON.stringify(aiOrder));
console.log('Expected: { sequential: true, parallel: false, order: ["ai"] }');
console.log('Pass:', aiOrder.sequential === true && aiOrder.parallel === false &&
    aiOrder.order[0] === "ai" ? '✓' : '✗');
console.log();

// Test 5: Multi-agent plan (future support)
const multiAgentPlan = {
    multiAgent: true,
    agents: ["tool", "memory", "ai"],
    reason: "Complex multi-agent request"
};
const multiAgentOrder = agentService.buildAgentExecutionOrder(multiAgentPlan);
console.log('Test 5 - Multi-agent plan:');
console.log('Input:', JSON.stringify(multiAgentPlan));
console.log('Output:', JSON.stringify(multiAgentOrder));
console.log('Expected: { sequential: true, parallel: false, order: ["tool", "memory", "ai"] }');
console.log('Pass:', multiAgentOrder.sequential === true && multiAgentOrder.parallel === false &&
    JSON.stringify(multiAgentOrder.order) === JSON.stringify(["tool", "memory", "ai"]) ? '✓' : '✗');
console.log();

// Test 6: Empty/undefined plan
const emptyOrder = agentService.buildAgentExecutionOrder(null);
console.log('Test 6 - Null/undefined plan:');
console.log('Input:', null);
console.log('Output:', JSON.stringify(emptyOrder));
console.log('Expected: { sequential: true, parallel: false, order: ["ai"] }');
console.log('Pass:', emptyOrder.sequential === true && emptyOrder.parallel === false &&
    emptyOrder.order[0] === "ai" ? '✓' : '✗');
console.log();

// Summary
const allPassed = [
    toolOrder.sequential === true && toolOrder.parallel === false && toolOrder.order[0] === "tool",
    memoryOrder.sequential === true && memoryOrder.parallel === false && memoryOrder.order[0] === "memory",
    fileOrder.sequential === true && fileOrder.parallel === false && fileOrder.order[0] === "file",
    aiOrder.sequential === true && aiOrder.parallel === false && aiOrder.order[0] === "ai",
    multiAgentOrder.sequential === true && multiAgentOrder.parallel === false &&
    JSON.stringify(multiAgentOrder.order) === JSON.stringify(["tool", "memory", "ai"]),
    emptyOrder.sequential === true && emptyOrder.parallel === false && emptyOrder.order[0] === "ai"
].every(result => result);

console.log('=== Summary ===');
console.log('Total tests: 6');
console.log('Passed:', allPassed ? '6/6 ✓' : 'Some tests failed ✗');
console.log('Status:', allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');

process.exit(allPassed ? 0 : 1);