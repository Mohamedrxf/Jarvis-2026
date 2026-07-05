// Test Phase 9.1C - Agent Executor
// Verifies the AgentExecutor implementation

const AgentExecutor = require('./server/services/agents/AgentExecutor');

console.log('=== Phase 9.1C: Agent Executor Tests ===\n');

const executor = new AgentExecutor();

// Test 1: Tool route executes ToolAgent
const toolRoute = { route: "tool" };
const toolContext = { target: "calculator", input: { expression: "2+2" } };
const toolResult = executor.execute(toolRoute, toolContext);
console.log('Test 1: Tool route executes ToolAgent');
console.log(`  Expected: result from ToolAgent`);
console.log(`  Actual: ${toolResult !== null ? 'result returned' : 'null'}`);
console.log(`  Status: ${toolResult !== null ? 'PASS' : 'FAIL'}\n`);

// Test 2: Memory route executes MemoryAgent
const memoryRoute = { route: "memory" };
const memoryContext = { operation: "getMemories", userId: "user123" };
const memoryResult = executor.execute(memoryRoute, memoryContext);
console.log('Test 2: Memory route executes MemoryAgent');
console.log(`  Expected: result from MemoryAgent`);
console.log(`  Actual: ${memoryResult !== null ? 'result returned' : 'null'}`);
console.log(`  Status: ${memoryResult !== null ? 'PASS' : 'FAIL'}\n`);

// Test 3: File route executes FileAgent
const fileRoute = { route: "file" };
const fileContext = { operation: "getUserFiles", userId: "user123" };
const fileResult = executor.execute(fileRoute, fileContext);
console.log('Test 3: File route executes FileAgent');
console.log(`  Expected: result from FileAgent`);
console.log(`  Actual: ${fileResult !== null ? 'result returned' : 'null'}`);
console.log(`  Status: ${fileResult !== null ? 'PASS' : 'FAIL'}\n`);

// Test 4: AI route executes AIAgent
const aiRoute = { route: "ai" };
const aiContext = { messages: [{ role: "user", content: "Hello" }] };
const aiResult = executor.execute(aiRoute, aiContext);
console.log('Test 4: AI route executes AIAgent');
console.log(`  Expected: result from AIAgent`);
console.log(`  Actual: ${aiResult !== null ? 'result returned' : 'null'}`);
console.log(`  Status: ${aiResult !== null ? 'PASS' : 'FAIL'}\n`);

// Test 5: Unknown route returns null
const unknownRoute = { route: "unknown" };
const unknownResult = executor.execute(unknownRoute, {});
console.log('Test 5: Unknown route returns null');
console.log(`  Expected: null`);
console.log(`  Actual: ${unknownResult}`);
console.log(`  Status: ${unknownResult === null ? 'PASS' : 'FAIL'}\n`);

// Summary
const tests = [
    toolResult !== null,
    memoryResult !== null,
    fileResult !== null,
    aiResult !== null,
    unknownResult === null
];

const passed = tests.filter(t => t).length;
const total = tests.length;

console.log('=== Test Summary ===');
console.log(`Passed: ${passed}/${total}`);
console.log(`Status: ${passed === total ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

process.exit(passed === total ? 0 : 1);