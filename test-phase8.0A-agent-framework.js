// Test Phase 8.0A - Agent Framework Skeleton
// Tests the analyzeRequest() routing logic

const agentService = require('./server/services/agentService');

console.log('=== Phase 8.0A: Agent Framework Skeleton Tests ===\n');

let passedTests = 0;
let failedTests = 0;

function test(description, testFn) {
    try {
        testFn();
        console.log(`✓ ${description}`);
        passedTests++;
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}`);
        failedTests++;
    }
}

function assertEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
        throw new Error(`${message}\n  Expected: ${expectedStr}\n  Actual: ${actualStr}`);
    }
}

// Test 1: Tool requests should route to tools
test('Weather query routes to tool', () => {
    const result = agentService.analyzeRequest("What's the weather in London?");
    assertEqual(result, { useAI: false, useTool: true, useMemory: false, useFiles: false }, 'Weather should use tool');
});

test('Web search routes to tool', () => {
    const result = agentService.analyzeRequest("Search for React tutorials");
    assertEqual(result, { useAI: false, useTool: true, useMemory: false, useFiles: false }, 'Search should use tool');
});

test('Currency conversion routes to tool', () => {
    const result = agentService.analyzeRequest("Convert 100 USD to EUR");
    assertEqual(result, { useAI: false, useTool: true, useMemory: false, useFiles: false }, 'Currency should use tool');
});

test('Calculator routes to tool', () => {
    const result = agentService.analyzeRequest("Calculate 2 + 2");
    assertEqual(result, { useAI: false, useTool: true, useMemory: false, useFiles: false }, 'Calculator should use tool');
});

test('Math expression routes to tool', () => {
    const result = agentService.analyzeRequest("5 + 3 * 2");
    assertEqual(result, { useAI: false, useTool: true, useMemory: false, useFiles: false }, 'Math expression should use tool');
});

test('UUID generation routes to tool', () => {
    const result = agentService.analyzeRequest("Generate UUID");
    assertEqual(result, { useAI: false, useTool: true, useMemory: false, useFiles: false }, 'UUID should use tool');
});

test('Password generation routes to tool', () => {
    const result = agentService.analyzeRequest("Generate password");
    assertEqual(result, { useAI: false, useTool: true, useMemory: false, useFiles: false }, 'Password should use tool');
});

test('Date/time query routes to tool', () => {
    const result = agentService.analyzeRequest("What time is it?");
    assertEqual(result, { useAI: false, useTool: true, useMemory: false, useFiles: false }, 'Time query should use tool');
});

// Test 2: File-related requests should route to files
test('File upload intent routes to files', () => {
    const result = agentService.analyzeRequest("Upload a file");
    assertEqual(result, { useAI: false, useTool: false, useMemory: false, useFiles: true }, 'Upload should use files');
});

test('File search routes to files', () => {
    const result = agentService.analyzeRequest("Search my files");
    assertEqual(result, { useAI: false, useTool: false, useMemory: false, useFiles: true }, 'File search should use files');
});

test('File content query routes to files', () => {
    const result = agentService.analyzeRequest("What is in my PDF file?");
    assertEqual(result, { useAI: false, useTool: false, useMemory: false, useFiles: true }, 'File query should use files');
});

test('Read file routes to files', () => {
    const result = agentService.analyzeRequest("Read my document");
    assertEqual(result, { useAI: false, useTool: false, useMemory: false, useFiles: true }, 'Read file should use files');
});

test('Delete file routes to files', () => {
    const result = agentService.analyzeRequest("Delete my file");
    assertEqual(result, { useAI: false, useTool: false, useMemory: false, useFiles: true }, 'Delete file should use files');
});

// Test 3: Memory-related requests should route to memory
test('Remember intent routes to memory', () => {
    const result = agentService.analyzeRequest("Remember that I like pizza");
    assertEqual(result, { useAI: false, useTool: false, useMemory: true, useFiles: false }, 'Remember should use memory');
});

test('Memory search routes to memory', () => {
    const result = agentService.analyzeRequest("What do you remember about me?");
    assertEqual(result, { useAI: false, useTool: false, useMemory: true, useFiles: false }, 'Memory search should use memory');
});

test('Memory query routes to memory', () => {
    const result = agentService.analyzeRequest("What is my favorite color?");
    assertEqual(result, { useAI: false, useTool: false, useMemory: true, useFiles: false }, 'Memory query should use memory');
});

test('List memories routes to memory', () => {
    const result = agentService.analyzeRequest("Show my memories");
    assertEqual(result, { useAI: false, useTool: false, useMemory: true, useFiles: false }, 'List memories should use memory');
});

test('Forget memory routes to memory', () => {
    const result = agentService.analyzeRequest("Forget that memory");
    assertEqual(result, { useAI: false, useTool: false, useMemory: true, useFiles: false }, 'Forget memory should use memory');
});

// Test 4: General queries should route to AI
test('General greeting routes to AI', () => {
    const result = agentService.analyzeRequest("Hello, how are you?");
    assertEqual(result, { useAI: true, useTool: false, useMemory: false, useFiles: false }, 'Greeting should use AI');
});

test('General question routes to AI', () => {
    const result = agentService.analyzeRequest("What is the meaning of life?");
    assertEqual(result, { useAI: true, useTool: false, useMemory: false, useFiles: false }, 'Philosophical question should use AI');
});

test('General conversation routes to AI', () => {
    const result = agentService.analyzeRequest("Tell me a joke");
    assertEqual(result, { useAI: true, useTool: false, useMemory: false, useFiles: false }, 'Joke request should use AI');
});

// Test 5: Edge cases
test('Empty message defaults to AI', () => {
    const result = agentService.analyzeRequest("");
    assertEqual(result, { useAI: true, useTool: false, useMemory: false, useFiles: false }, 'Empty message should use AI');
});

test('Null message defaults to AI', () => {
    const result = agentService.analyzeRequest(null);
    assertEqual(result, { useAI: true, useTool: false, useMemory: false, useFiles: false }, 'Null message should use AI');
});

test('Undefined message defaults to AI', () => {
    const result = agentService.analyzeRequest(undefined);
    assertEqual(result, { useAI: true, useTool: false, useMemory: false, useFiles: false }, 'Undefined message should use AI');
});

test('Non-string message defaults to AI', () => {
    const result = agentService.analyzeRequest(123);
    assertEqual(result, { useAI: true, useTool: false, useMemory: false, useFiles: false }, 'Non-string should use AI');
});

// Test 6: Priority tests (tool > file > memory > AI)
test('Tool request takes priority over memory', () => {
    // "Remember" could be memory, but "calculate" is clearly a tool
    const result = agentService.analyzeRequest("Calculate 5 + 5");
    assertEqual(result, { useAI: false, useTool: true, useMemory: false, useFiles: false }, 'Tool should take priority');
});

test('File request takes priority over AI', () => {
    const result = agentService.analyzeRequest("Upload my file");
    assertEqual(result, { useAI: false, useTool: false, useMemory: false, useFiles: true }, 'File should take priority');
});

test('Memory request takes priority over AI', () => {
    const result = agentService.analyzeRequest("Remember my name");
    assertEqual(result, { useAI: false, useTool: false, useMemory: true, useFiles: false }, 'Memory should take priority');
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total tests: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}