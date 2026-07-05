// Test Phase 9.1B - Agent Dispatcher
// Verifies the AgentDispatcher implementation

const AgentDispatcher = require('./server/services/agents/AgentDispatcher');

console.log('=== Phase 9.1B: Agent Dispatcher Tests ===\n');

const dispatcher = new AgentDispatcher();

// Test 1: Tool route returns ToolAgent
const toolRoute = { route: "tool" };
const toolAgent = dispatcher.dispatch(toolRoute);
console.log('Test 1: Tool route returns ToolAgent');
console.log(`  Expected: ToolAgent instance`);
console.log(`  Actual: ${toolAgent ? toolAgent.constructor.name : 'null'}`);
console.log(`  Status: ${toolAgent && toolAgent.getName() === 'tool' ? 'PASS' : 'FAIL'}\n`);

// Test 2: Memory route returns MemoryAgent
const memoryRoute = { route: "memory" };
const memoryAgent = dispatcher.dispatch(memoryRoute);
console.log('Test 2: Memory route returns MemoryAgent');
console.log(`  Expected: MemoryAgent instance`);
console.log(`  Actual: ${memoryAgent ? memoryAgent.constructor.name : 'null'}`);
console.log(`  Status: ${memoryAgent && memoryAgent.getName() === 'memory' ? 'PASS' : 'FAIL'}\n`);

// Test 3: File route returns FileAgent
const fileRoute = { route: "file" };
const fileAgent = dispatcher.dispatch(fileRoute);
console.log('Test 3: File route returns FileAgent');
console.log(`  Expected: FileAgent instance`);
console.log(`  Actual: ${fileAgent ? fileAgent.constructor.name : 'null'}`);
console.log(`  Status: ${fileAgent && fileAgent.getName() === 'file' ? 'PASS' : 'FAIL'}\n`);

// Test 4: AI route returns AIAgent
const aiRoute = { route: "ai" };
const aiAgent = dispatcher.dispatch(aiRoute);
console.log('Test 4: AI route returns AIAgent');
console.log(`  Expected: AIAgent instance`);
console.log(`  Actual: ${aiAgent ? aiAgent.constructor.name : 'null'}`);
console.log(`  Status: ${aiAgent && aiAgent.getName() === 'ai' ? 'PASS' : 'FAIL'}\n`);

// Test 5: Unknown route returns null
const unknownRoute = { route: "unknown" };
const unknownAgent = dispatcher.dispatch(unknownRoute);
console.log('Test 5: Unknown route returns null');
console.log(`  Expected: null`);
console.log(`  Actual: ${unknownAgent}`);
console.log(`  Status: ${unknownAgent === null ? 'PASS' : 'FAIL'}\n`);

// Summary
const tests = [
    toolAgent && toolAgent.getName() === 'tool',
    memoryAgent && memoryAgent.getName() === 'memory',
    fileAgent && fileAgent.getName() === 'file',
    aiAgent && aiAgent.getName() === 'ai',
    unknownAgent === null
];

const passed = tests.filter(t => t).length;
const total = tests.length;

console.log('=== Test Summary ===');
console.log(`Passed: ${passed}/${total}`);
console.log(`Status: ${passed === total ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

process.exit(passed === total ? 0 : 1);