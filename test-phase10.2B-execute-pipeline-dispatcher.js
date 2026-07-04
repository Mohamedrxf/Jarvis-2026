// Test Phase 10.2B - Execute Sequential Pipeline with Dispatcher Lookup
// Tests the executeSequentialPipeline with agent dispatcher lookup
// No actual execution, service calls, or async logic

const agentService = require('./server/services/agentService');

console.log('=== Testing executeSequentialPipeline with Dispatcher Lookup ===\n');

// Test 1: Tool stage (agent found)
console.log('Test 1: Tool stage (agent found)');
const toolDescriptor = {
    ready: true,
    mode: "sequential",
    totalStages: 1,
    stages: [
        { agent: "tool", context: { memory: false, files: false, previousResults: false } }
    ]
};

const toolResult = agentService.executeSequentialPipeline(toolDescriptor);
console.log('Input:', JSON.stringify(toolDescriptor, null, 2));
console.log('Result:', JSON.stringify(toolResult, null, 2));
console.log('Expected: { success: true, results: [{ agent: "tool", found: true, status: "pending" }] }');
const toolPass = toolResult.success === true &&
    Array.isArray(toolResult.results) &&
    toolResult.results.length === 1 &&
    toolResult.results[0].agent === "tool" &&
    toolResult.results[0].found === true &&
    toolResult.results[0].status === "pending";
console.log('Pass:', toolPass);
console.log();

// Test 2: Memory stage (agent found)
console.log('Test 2: Memory stage (agent found)');
const memoryDescriptor = {
    ready: true,
    mode: "sequential",
    totalStages: 1,
    stages: [
        { agent: "memory", context: { memory: true, files: false, previousResults: false } }
    ]
};

const memoryResult = agentService.executeSequentialPipeline(memoryDescriptor);
console.log('Input:', JSON.stringify(memoryDescriptor, null, 2));
console.log('Result:', JSON.stringify(memoryResult, null, 2));
console.log('Expected: { success: true, results: [{ agent: "memory", found: true, status: "pending" }] }');
const memoryPass = memoryResult.success === true &&
    Array.isArray(memoryResult.results) &&
    memoryResult.results.length === 1 &&
    memoryResult.results[0].agent === "memory" &&
    memoryResult.results[0].found === true &&
    memoryResult.results[0].status === "pending";
console.log('Pass:', memoryPass);
console.log();

// Test 3: File stage (agent found)
console.log('Test 3: File stage (agent found)');
const fileDescriptor = {
    ready: true,
    mode: "sequential",
    totalStages: 1,
    stages: [
        { agent: "file", context: { memory: false, files: true, previousResults: false } }
    ]
};

const fileResult = agentService.executeSequentialPipeline(fileDescriptor);
console.log('Input:', JSON.stringify(fileDescriptor, null, 2));
console.log('Result:', JSON.stringify(fileResult, null, 2));
console.log('Expected: { success: true, results: [{ agent: "file", found: true, status: "pending" }] }');
const filePass = fileResult.success === true &&
    Array.isArray(fileResult.results) &&
    fileResult.results.length === 1 &&
    fileResult.results[0].agent === "file" &&
    fileResult.results[0].found === true &&
    fileResult.results[0].status === "pending";
console.log('Pass:', filePass);
console.log();

// Test 4: AI stage (agent found)
console.log('Test 4: AI stage (agent found)');
const aiDescriptor = {
    ready: true,
    mode: "sequential",
    totalStages: 1,
    stages: [
        { agent: "ai", context: { memory: true, files: false, previousResults: false } }
    ]
};

const aiResult = agentService.executeSequentialPipeline(aiDescriptor);
console.log('Input:', JSON.stringify(aiDescriptor, null, 2));
console.log('Result:', JSON.stringify(aiResult, null, 2));
console.log('Expected: { success: true, results: [{ agent: "ai", found: true, status: "pending" }] }');
const aiPass = aiResult.success === true &&
    Array.isArray(aiResult.results) &&
    aiResult.results.length === 1 &&
    aiResult.results[0].agent === "ai" &&
    aiResult.results[0].found === true &&
    aiResult.results[0].status === "pending";
console.log('Pass:', aiPass);
console.log();

// Test 5: Invalid agent (agent not found)
console.log('Test 5: Invalid agent (agent not found)');
const invalidAgentDescriptor = {
    ready: true,
    mode: "sequential",
    totalStages: 1,
    stages: [
        { agent: "invalid_agent", context: { memory: false, files: false, previousResults: false } }
    ]
};

const invalidAgentResult = agentService.executeSequentialPipeline(invalidAgentDescriptor);
console.log('Input:', JSON.stringify(invalidAgentDescriptor, null, 2));
console.log('Result:', JSON.stringify(invalidAgentResult, null, 2));
console.log('Expected: { success: true, results: [{ agent: "invalid_agent", found: false, status: "missing" }] }');
const invalidAgentPass = invalidAgentResult.success === true &&
    Array.isArray(invalidAgentResult.results) &&
    invalidAgentResult.results.length === 1 &&
    invalidAgentResult.results[0].agent === "invalid_agent" &&
    invalidAgentResult.results[0].found === false &&
    invalidAgentResult.results[0].status === "missing";
console.log('Pass:', invalidAgentPass);
console.log();

// Test 6: Multiple stages (mix of found and not found)
console.log('Test 6: Multiple stages (mix of found and not found)');
const multiStageDescriptor = {
    ready: true,
    mode: "sequential",
    totalStages: 4,
    stages: [
        { agent: "memory", context: { memory: true, files: false, previousResults: false } },
        { agent: "invalid_tool", context: { memory: false, files: false, previousResults: true } },
        { agent: "file", context: { memory: true, files: true, previousResults: true } },
        { agent: "unknown_agent", context: { memory: true, files: true, previousResults: true } }
    ]
};

const multiStageResult = agentService.executeSequentialPipeline(multiStageDescriptor);
console.log('Input:', JSON.stringify(multiStageDescriptor, null, 2));
console.log('Result:', JSON.stringify(multiStageResult, null, 2));
console.log('Expected: { success: true, results: 4 stages with found/missing status }');
const multiStagePass = multiStageResult.success === true &&
    Array.isArray(multiStageResult.results) &&
    multiStageResult.results.length === 4 &&
    multiStageResult.results[0].agent === "memory" &&
    multiStageResult.results[0].found === true &&
    multiStageResult.results[0].status === "pending" &&
    multiStageResult.results[1].agent === "invalid_tool" &&
    multiStageResult.results[1].found === false &&
    multiStageResult.results[1].status === "missing" &&
    multiStageResult.results[2].agent === "file" &&
    multiStageResult.results[2].found === true &&
    multiStageResult.results[2].status === "pending" &&
    multiStageResult.results[3].agent === "unknown_agent" &&
    multiStageResult.results[3].found === false &&
    multiStageResult.results[3].status === "missing";
console.log('Pass:', multiStagePass);
console.log();

// Test 7: Not ready descriptor (should return failure, no dispatcher calls)
console.log('Test 7: Not ready descriptor (should return failure)');
const notReadyDescriptor = {
    ready: false,
    mode: "sequential",
    totalStages: 2,
    stages: [
        { agent: "tool", context: { memory: false, files: false, previousResults: false } },
        { agent: "ai", context: { memory: true, files: false, previousResults: true } }
    ]
};

const notReadyResult = agentService.executeSequentialPipeline(notReadyDescriptor);
console.log('Input:', JSON.stringify(notReadyDescriptor, null, 2));
console.log('Result:', JSON.stringify(notReadyResult, null, 2));
console.log('Expected: { success: false, results: [] } (no dispatcher calls)');
const notReadyPass = notReadyResult.success === false &&
    Array.isArray(notReadyResult.results) &&
    notReadyResult.results.length === 0;
console.log('Pass:', notReadyPass);
console.log();

// Test 8: Empty stages (ready but no stages to process)
console.log('Test 8: Empty stages (ready but no stages to process)');
const emptyStagesDescriptor = {
    ready: true,
    mode: "sequential",
    totalStages: 0,
    stages: []
};

const emptyStagesResult = agentService.executeSequentialPipeline(emptyStagesDescriptor);
console.log('Input:', JSON.stringify(emptyStagesDescriptor, null, 2));
console.log('Result:', JSON.stringify(emptyStagesResult, null, 2));
console.log('Expected: { success: true, results: [] }');
const emptyStagesPass = emptyStagesResult.success === true &&
    Array.isArray(emptyStagesResult.results) &&
    emptyStagesResult.results.length === 0;
console.log('Pass:', emptyStagesPass);
console.log();

// Summary
console.log('=== Test Summary ===');
const allTests = [
    { name: 'Tool stage (found)', pass: toolPass },
    { name: 'Memory stage (found)', pass: memoryPass },
    { name: 'File stage (found)', pass: filePass },
    { name: 'AI stage (found)', pass: aiPass },
    { name: 'Invalid agent (not found)', pass: invalidAgentPass },
    { name: 'Multiple stages (mixed)', pass: multiStagePass },
    { name: 'Not ready descriptor', pass: notReadyPass },
    { name: 'Empty stages', pass: emptyStagesPass }
];

const passedTests = allTests.filter(test => test.pass).length;
const totalTests = allTests.length;

allTests.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.name} - ${test.pass ? 'PASS' : 'FAIL'}`);
});

console.log(`\nTotal: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
} else {
    console.log('\n✗ Some tests failed!');
    process.exit(1);
}