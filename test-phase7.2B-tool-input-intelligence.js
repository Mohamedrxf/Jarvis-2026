/**
 * Phase 7.2B Test - Tool Input Intelligence Layer
 * Tests the enhanced decideTool() function with input extraction
 */

// Load the decideTool function from server.js
const fs = require('fs');
const serverCode = fs.readFileSync('./server/server.js', 'utf8');

// Extract the decideTool function and helper functions
const functionMatch = serverCode.match(/function decideTool\(message\) \{[\s\S]*?\n  return \{\n    useTool: false\n  \};\n\}\n\n\/\*\*[\s\S]*?function normalizeCurrency\(currency\) \{[\s\S]*?\n\}/);
if (!functionMatch) {
    console.error('❌ Could not extract decideTool and normalizeCurrency functions');
    process.exit(1);
}

// Evaluate the functions
eval(functionMatch[0]);

console.log('🧪 Testing Phase 7.2B - Tool Input Intelligence Layer\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

// Test cases for each tool with input extraction
const testCases = [
    // ===== CALCULATOR TESTS =====
    {
        input: 'hey can you calculate 10 + 20 please',
        expected: { useTool: true, toolName: 'calculator', input: { expression: '10 + 20' } },
        description: 'Calculator with extra words'
    },
    {
        input: 'calculate 25 * (4 + 2)',
        expected: { useTool: true, toolName: 'calculator', input: { expression: '25 * (4 + 2)' } },
        description: 'Calculator with complex expression'
    },
    {
        input: '10 + 20',
        expected: { useTool: true, toolName: 'calculator', input: { expression: '10 + 20' } },
        description: 'Calculator with pure math expression'
    },
    {
        input: 'calculate 100 / 5',
        expected: { useTool: true, toolName: 'calculator', input: { expression: '100 / 5' } },
        description: 'Calculator with division'
    },

    // ===== WEATHER TESTS =====
    {
        input: "what's the weather in Bangalore today",
        expected: { useTool: true, toolName: 'weather', input: { city: 'Bangalore' } },
        description: 'Weather with "what\'s the" prefix'
    },
    {
        input: 'weather in Chennai today',
        expected: { useTool: true, toolName: 'weather', input: { city: 'Chennai' } },
        description: 'Weather with "today" suffix'
    },
    {
        input: 'what is weather in New York city',
        expected: { useTool: true, toolName: 'weather', input: { city: 'New York city' } },
        description: 'Weather with "what is" prefix'
    },
    {
        input: 'weather in London',
        expected: { useTool: true, toolName: 'weather', input: { city: 'London' } },
        description: 'Weather simple format'
    },

    // ===== CURRENCY TESTS =====
    {
        input: 'convert 100 USD to INR fast',
        expected: { useTool: true, toolName: 'currency', input: { amount: 100, from: 'USD', to: 'INR' } },
        description: 'Currency with extra words'
    },
    {
        input: 'convert 50 euros to dollars',
        expected: { useTool: true, toolName: 'currency', input: { amount: 50, from: 'EUR', to: 'USD' } },
        description: 'Currency with lowercase currency codes'
    },
    {
        input: 'convert 99.99 USD to EUR',
        expected: { useTool: true, toolName: 'currency', input: { amount: 99.99, from: 'USD', to: 'EUR' } },
        description: 'Currency with decimal amount'
    },
    {
        input: 'currency 100 USD to GBP',
        expected: { useTool: true, toolName: 'currency', input: { amount: 100, from: 'USD', to: 'GBP' } },
        description: 'Currency with "currency" keyword'
    },

    // ===== PASSWORD TESTS =====
    {
        input: 'generate password 16',
        expected: { useTool: true, toolName: 'password', input: { length: 16 } },
        description: 'Password with custom length'
    },
    {
        input: 'generate password',
        expected: { useTool: true, toolName: 'password', input: { length: 12 } },
        description: 'Password with default length'
    },
    {
        input: 'password',
        expected: { useTool: true, toolName: 'password', input: { length: 12 } },
        description: 'Password keyword only'
    },
    {
        input: 'generate password 20',
        expected: { useTool: true, toolName: 'password', input: { length: 20 } },
        description: 'Password with length 20'
    },

    // ===== DATETIME TESTS =====
    {
        input: 'what time is it',
        expected: { useTool: true, toolName: 'datetime', input: {} },
        description: 'Datetime - what time'
    },
    {
        input: 'what is the date',
        expected: { useTool: true, toolName: 'datetime', input: {} },
        description: 'Datetime - what is the date'
    },
    {
        input: 'current time',
        expected: { useTool: true, toolName: 'datetime', input: {} },
        description: 'Datetime - current time'
    },
    {
        input: 'tell me the date',
        expected: { useTool: true, toolName: 'datetime', input: {} },
        description: 'Datetime - tell me the date'
    },

    // ===== UUID TESTS =====
    {
        input: 'generate uuid',
        expected: { useTool: true, toolName: 'uuid', input: {} },
        description: 'UUID generation'
    },

    // ===== WEB SEARCH TESTS =====
    {
        input: 'search for AI tools',
        expected: { useTool: true, toolName: 'web_search', input: { query: 'AI tools' } },
        description: 'Web search with "for" keyword'
    },
    {
        input: 'web search latest news on Tesla',
        expected: { useTool: true, toolName: 'web_search', input: { query: 'latest news on Tesla' } },
        description: 'Web search with "web search" prefix'
    },
    {
        input: 'search React tutorials',
        expected: { useTool: true, toolName: 'web_search', input: { query: 'React tutorials' } },
        description: 'Web search without "for" keyword'
    },
    {
        input: 'web search for best restaurants',
        expected: { useTool: true, toolName: 'web_search', input: { query: 'best restaurants' } },
        description: 'Web search with "web search for"'
    },

    // ===== NO TOOL NEEDED =====
    {
        input: 'Hello, how are you?',
        expected: { useTool: false },
        description: 'No tool - greeting'
    },
    {
        input: 'Tell me a joke',
        expected: { useTool: false },
        description: 'No tool - joke request'
    },
    {
        input: 'What is the meaning of life?',
        expected: { useTool: false },
        description: 'No tool - philosophical question'
    },
    {
        input: 'Can you help me with my homework?',
        expected: { useTool: false },
        description: 'No tool - general help request'
    }
];

// Run all tests
testCases.forEach((testCase, index) => {
    const result = decideTool(testCase.input);
    const isMatch = JSON.stringify(result) === JSON.stringify(testCase.expected);

    if (isMatch) {
        passed++;
        console.log(`✅ Test ${index + 1}: PASSED - ${testCase.description}`);
        console.log(`   Input: "${testCase.input}"`);
        console.log(`   Result: ${JSON.stringify(result)}\n`);
    } else {
        failed++;
        console.log(`❌ Test ${index + 1}: FAILED - ${testCase.description}`);
        console.log(`   Input: "${testCase.input}"`);
        console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
        console.log(`   Got:      ${JSON.stringify(result)}\n`);
    }
});

console.log('='.repeat(60));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} total`);

if (failed === 0) {
    console.log('✅ All tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some tests failed');
    process.exit(1);
}