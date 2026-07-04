// Test Phase 9.1A - Agent Registry
// Verifies the AgentRegistry implementation

const AgentRegistry = require('./server/services/agents/AgentRegistry');

console.log('=== Phase 9.1A: Agent Registry Tests ===\n');

// Test 1: All four agents registered
const agents = AgentRegistry.getAgents();
console.log('Test 1: All four agents registered');
console.log(`  Expected: 4 agents`);
console.log(`  Actual: ${agents.length} agents`);
console.log(`  Status: ${agents.length === 4 ? 'PASS' : 'FAIL'}\n`);

// Test 2: getAgents() returns four instances
console.log('Test 2: getAgents() returns four instances');
console.log(`  Expected: 4`);
console.log(`  Actual: ${agents.length}`);
console.log(`  Status: ${agents.length === 4 ? 'PASS' : 'FAIL'}\n`);

// Test 3: getAgent("tool") works
const toolAgent = AgentRegistry.getAgent("tool");
console.log('Test 3: getAgent("tool") works');
console.log(`  Expected: agent instance`);
console.log(`  Actual: ${toolAgent ? 'found' : 'null'}`);
console.log(`  Status: ${toolAgent && toolAgent.getName() === 'tool' ? 'PASS' : 'FAIL'}\n`);

// Test 4: getAgent("memory") works
const memoryAgent = AgentRegistry.getAgent("memory");
console.log('Test 4: getAgent("memory") works');
console.log(`  Expected: agent instance`);
console.log(`  Actual: ${memoryAgent ? 'found' : 'null'}`);
console.log(`  Status: ${memoryAgent && memoryAgent.getName() === 'memory' ? 'PASS' : 'FAIL'}\n`);

// Test 5: getAgent("file") works
const fileAgent = AgentRegistry.getAgent("file");
console.log('Test 5: getAgent("file") works');
console.log(`  Expected: agent instance`);
console.log(`  Actual: ${fileAgent ? 'found' : 'null'}`);
console.log(`  Status: ${fileAgent && fileAgent.getName() === 'file' ? 'PASS' : 'FAIL'}\n`);

// Test 6: getAgent("ai") works
const aiAgent = AgentRegistry.getAgent("ai");
console.log('Test 6: getAgent("ai") works');
console.log(`  Expected: agent instance`);
console.log(`  Actual: ${aiAgent ? 'found' : 'null'}`);
console.log(`  Status: ${aiAgent && aiAgent.getName() === 'ai' ? 'PASS' : 'FAIL'}\n`);

// Test 7: Unknown agent returns null
const unknownAgent = AgentRegistry.getAgent("unknown");
console.log('Test 7: Unknown agent returns null');
console.log(`  Expected: null`);
console.log(`  Actual: ${unknownAgent}`);
console.log(`  Status: ${unknownAgent === null ? 'PASS' : 'FAIL'}\n`);

// Summary
const tests = [
    agents.length === 4,
    agents.length === 4,
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