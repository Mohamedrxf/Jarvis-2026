// Test Phase 8.0B - Agent Decision Pipeline
// Tests the structured execution plan from analyzeRequest()

const agentService = require('./server/services/agentService');

console.log('=== Phase 8.0B: Agent Decision Pipeline Tests ===\n');

let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
    try {
        testFn();
        console.log(`✓ ${description}`);
        testsPassed++;
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}`);
        testsFailed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Test 1: Response format validation
test('analyzeRequest returns object with required fields', () => {
    const result = agentService.analyzeRequest('hello');
    assert(result.hasOwnProperty('route'), 'Missing route field');
    assert(result.hasOwnProperty('target'), 'Missing target field');
    assert(result.hasOwnProperty('confidence'), 'Missing confidence field');
    assert(result.hasOwnProperty('reason'), 'Missing reason field');
});

// Test 2: Route type validation
test('route is one of: "ai", "tool", "memory", "file"', () => {
    const testCases = [
        'hello',
        'what is the weather in London',
        'remember my name is John',
        'upload my file',
        'calculate 2 + 2',
        'search for JavaScript tutorials'
    ];

    const validRoutes = ['ai', 'tool', 'memory', 'file'];

    testCases.forEach(message => {
        const result = agentService.analyzeRequest(message);
        assert(validRoutes.includes(result.route),
            `Invalid route "${result.route}" for message: ${message}`);
    });
});

// Test 3: Tool routing - Weather
test('Weather query routes to tool with target "weather"', () => {
    const result = agentService.analyzeRequest('what is the weather in London');
    assert(result.route === 'tool', `Expected route "tool", got "${result.route}"`);
    assert(result.target === 'weather', `Expected target "weather", got "${result.target}"`);
    assert(result.confidence > 0.9, `Expected high confidence, got ${result.confidence}`);
    assert(result.reason.length > 0, 'Reason should not be empty');
});

// Test 4: Tool routing - Web search
test('Web search routes to tool with target "web_search"', () => {
    const result = agentService.analyzeRequest('search for JavaScript tutorials');
    assert(result.route === 'tool', `Expected route "tool", got "${result.route}"`);
    assert(result.target === 'web_search', `Expected target "web_search", got "${result.target}"`);
    assert(result.confidence > 0.9, `Expected high confidence, got ${result.confidence}`);
});

// Test 5: Tool routing - Currency
test('Currency conversion routes to tool with target "currency"', () => {
    const result = agentService.analyzeRequest('convert 100 USD to EUR');
    assert(result.route === 'tool', `Expected route "tool", got "${result.route}"`);
    assert(result.target === 'currency', `Expected target "currency", got "${result.target}"`);
    assert(result.confidence > 0.9, `Expected high confidence, got ${result.confidence}`);
});

// Test 6: Tool routing - Calculator
test('Calculator command routes to tool with target "calculator"', () => {
    const result = agentService.analyzeRequest('calculate 2 + 2');
    assert(result.route === 'tool', `Expected route "tool", got "${result.route}"`);
    assert(result.target === 'calculator', `Expected target "calculator", got "${result.target}"`);
    assert(result.confidence > 0.9, `Expected high confidence, got ${result.confidence}`);
});

// Test 7: Tool routing - Math expression
test('Math expression routes to tool with target "calculator"', () => {
    const result = agentService.analyzeRequest('2 + 2');
    assert(result.route === 'tool', `Expected route "tool", got "${result.route}"`);
    assert(result.target === 'calculator', `Expected target "calculator", got "${result.target}"`);
    assert(result.confidence >= 0.85, `Expected confidence >= 0.85, got ${result.confidence}`);
});

// Test 8: Tool routing - UUID
test('UUID generation routes to tool with target "uuid"', () => {
    const result = agentService.analyzeRequest('generate uuid');
    assert(result.route === 'tool', `Expected route "tool", got "${result.route}"`);
    assert(result.target === 'uuid', `Expected target "uuid", got "${result.target}"`);
    assert(result.confidence > 0.9, `Expected high confidence, got ${result.confidence}`);
});

// Test 9: Tool routing - Password
test('Password generation routes to tool with target "password"', () => {
    const result = agentService.analyzeRequest('generate password');
    assert(result.route === 'tool', `Expected route "tool", got "${result.route}"`);
    assert(result.target === 'password', `Expected target "password", got "${result.target}"`);
    assert(result.confidence > 0.9, `Expected high confidence, got ${result.confidence}`);
});

// Test 10: Tool routing - Date/time
test('Date/time query routes to tool with target "datetime"', () => {
    const result = agentService.analyzeRequest('what time is it');
    assert(result.route === 'tool', `Expected route "tool", got "${result.route}"`);
    assert(result.target === 'datetime', `Expected target "datetime", got "${result.target}"`);
    assert(result.confidence > 0.9, `Expected high confidence, got ${result.confidence}`);
});

// Test 11: Memory routing
test('Memory request routes to memory with target null', () => {
    const result = agentService.analyzeRequest('remember my name is John');
    assert(result.route === 'memory', `Expected route "memory", got "${result.route}"`);
    assert(result.target === null, `Expected target null, got "${result.target}"`);
    assert(result.confidence > 0.9, `Expected high confidence, got ${result.confidence}`);
    assert(result.reason.length > 0, 'Reason should not be empty');
});

// Test 12: File routing
test('File request routes to file with target null', () => {
    const result = agentService.analyzeRequest('upload my file');
    assert(result.route === 'file', `Expected route "file", got "${result.route}"`);
    assert(result.target === null, `Expected target null, got "${result.target}"`);
    assert(result.confidence > 0.9, `Expected high confidence, got ${result.confidence}`);
    assert(result.reason.length > 0, 'Reason should not be empty');
});

// Test 13: AI routing (default)
test('General conversation routes to AI with target null', () => {
    const result = agentService.analyzeRequest('hello, how are you?');
    assert(result.route === 'ai', `Expected route "ai", got "${result.route}"`);
    assert(result.target === null, `Expected target null, got "${result.target}"`);
    assert(result.confidence > 0, `Expected positive confidence, got ${result.confidence}`);
    assert(result.reason.length > 0, 'Reason should not be empty');
});

// Test 14: Confidence is a number between 0 and 1
test('Confidence is a number between 0 and 1', () => {
    const testCases = [
        'hello',
        'weather in London',
        'remember this',
        'upload file',
        'calculate 2+2'
    ];

    testCases.forEach(message => {
        const result = agentService.analyzeRequest(message);
        assert(typeof result.confidence === 'number',
            `Confidence should be a number, got ${typeof result.confidence}`);
        assert(result.confidence >= 0 && result.confidence <= 1,
            `Confidence should be between 0 and 1, got ${result.confidence}`);
    });
});

// Test 15: Reason is a non-empty string
test('Reason is a non-empty string', () => {
    const testCases = [
        'hello',
        'weather in London',
        'remember this',
        'upload file',
        'calculate 2+2'
    ];

    testCases.forEach(message => {
        const result = agentService.analyzeRequest(message);
        assert(typeof result.reason === 'string',
            `Reason should be a string, got ${typeof result.reason}`);
        assert(result.reason.length > 0, 'Reason should not be empty');
    });
});

// Test 16: Invalid/empty message handling
test('Invalid/empty message returns AI route with confidence 0.5', () => {
    const result1 = agentService.analyzeRequest('');
    assert(result1.route === 'ai', `Expected route "ai" for empty string, got "${result1.route}"`);
    assert(result1.confidence === 0.5, `Expected confidence 0.5, got ${result1.confidence}`);

    const result2 = agentService.analyzeRequest(null);
    assert(result2.route === 'ai', `Expected route "ai" for null, got "${result2.route}"`);
    assert(result2.confidence === 0.5, `Expected confidence 0.5, got ${result2.confidence}`);

    const result3 = agentService.analyzeRequest(123);
    assert(result3.route === 'ai', `Expected route "ai" for number, got "${result3.route}"`);
    assert(result3.confidence === 0.5, `Expected confidence 0.5, got ${result3.confidence}`);
});

// Test 17: Priority order - tool > file > memory > ai
test('Routing priority: tool > file > memory > ai', () => {
    // Tool should take priority over file/memory
    const result1 = agentService.analyzeRequest('search for files'); // web search, not file search
    assert(result1.route === 'tool', 'Web search should route to tool, not file');
    assert(result1.target === 'web_search', 'Should detect web_search tool');

    // File should take priority over memory
    const result2 = agentService.analyzeRequest('show my files'); // file, not memory
    assert(result2.route === 'file', 'File request should route to file, not memory');

    // Memory should take priority over AI
    const result3 = agentService.analyzeRequest('remember this'); // memory, not AI
    assert(result3.route === 'memory', 'Memory request should route to memory, not AI');
});

// Test 18: Deterministic routing
test('Routing is deterministic (same input = same output)', () => {
    const testCases = [
        'weather in London',
        'calculate 2 + 2',
        'remember my name',
        'upload file',
        'hello'
    ];

    testCases.forEach(message => {
        const result1 = agentService.analyzeRequest(message);
        const result2 = agentService.analyzeRequest(message);
        assert(result1.route === result2.route,
            `Route should be deterministic for: ${message}`);
        assert(result1.target === result2.target,
            `Target should be deterministic for: ${message}`);
        assert(result1.confidence === result2.confidence,
            `Confidence should be deterministic for: ${message}`);
        assert(result1.reason === result2.reason,
            `Reason should be deterministic for: ${message}`);
    });
});

// Test 19: All tool types have correct targets
test('All tool types have correct target values', () => {
    const toolTests = [
        { message: 'weather in Paris', expectedTarget: 'weather' },
        { message: 'web search for news', expectedTarget: 'web_search' },
        { message: 'convert 100 USD to EUR', expectedTarget: 'currency' },
        { message: 'calculate 5 * 5', expectedTarget: 'calculator' },
        { message: 'generate uuid', expectedTarget: 'uuid' },
        { message: 'generate password', expectedTarget: 'password' },
        { message: 'what time is it', expectedTarget: 'datetime' }
    ];

    toolTests.forEach(test => {
        const result = agentService.analyzeRequest(test.message);
        assert(result.target === test.expectedTarget,
            `Expected target "${test.expectedTarget}" for "${test.message}", got "${result.target}"`);
    });
});

// Test 20: Existing routing behavior preserved
test('Existing routing behavior is preserved', () => {
    // These patterns should route to tools (from original implementation)
    const toolPatterns = [
        'weather in London',
        'search for JavaScript',
        'convert 100 USD to EUR',
        'calculate 2 + 2',
        'generate uuid',
        'generate password',
        'what time is it'
    ];

    toolPatterns.forEach(pattern => {
        const result = agentService.analyzeRequest(pattern);
        assert(result.route === 'tool',
            `Pattern "${pattern}" should route to tool`);
    });

    // These patterns should route to memory (from original implementation)
    const memoryPatterns = [
        'remember my name',
        'what do you remember',
        'show my memories'
    ];

    memoryPatterns.forEach(pattern => {
        const result = agentService.analyzeRequest(pattern);
        assert(result.route === 'memory',
            `Pattern "${pattern}" should route to memory`);
    });

    // These patterns should route to files (from original implementation)
    const filePatterns = [
        'upload my file',
        'search my files',
        'read my document'
    ];

    filePatterns.forEach(pattern => {
        const result = agentService.analyzeRequest(pattern);
        assert(result.route === 'file',
            `Pattern "${pattern}" should route to file`);
    });
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}