/**
 * Phase 7.2A Test - Tool Decision Layer
 * Tests the decideTool() function with various inputs
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

// Test cases
const testCases = [
    // Calculator tests
    { input: 'calculate 2 + 2', expected: { useTool: true, toolName: 'calculator', input: { expression: '2 + 2' } } },
    { input: 'calculate 10 * 5', expected: { useTool: true, toolName: 'calculator', input: { expression: '10 * 5' } } },
    { input: '2 + 2', expected: { useTool: true, toolName: 'calculator', input: { expression: '2 + 2' } } },
    { input: '10 * 5', expected: { useTool: true, toolName: 'calculator', input: { expression: '10 * 5' } } },

    // UUID tests
    { input: 'generate uuid', expected: { useTool: true, toolName: 'uuid', input: {} } },

    // Password tests
    { input: 'generate password', expected: { useTool: true, toolName: 'password', input: { length: 12 } } },
    { input: 'generate password 16', expected: { useTool: true, toolName: 'password', input: { length: 16 } } },
    { input: 'password', expected: { useTool: true, toolName: 'password', input: { length: 12 } } },

    // Datetime tests
    { input: 'what time is it', expected: { useTool: true, toolName: 'datetime', input: {} } },
    { input: 'what is the date', expected: { useTool: true, toolName: 'datetime', input: {} } },
    { input: 'current time', expected: { useTool: true, toolName: 'datetime', input: {} } },
    { input: 'tell me the date', expected: { useTool: true, toolName: 'datetime', input: {} } },

    // Weather tests
    { input: 'weather in London', expected: { useTool: true, toolName: 'weather', input: { city: 'London' } } },
    { input: 'weather in New York', expected: { useTool: true, toolName: 'weather', input: { city: 'New York' } } },

    // Currency tests (7.2B enhanced - now extracts structured input)
    { input: 'convert 100 USD to EUR', expected: { useTool: true, toolName: 'currency', input: { amount: 100, from: 'USD', to: 'EUR' } } },
    { input: 'currency exchange rate', expected: { useTool: false } }, // No amount/from/to pattern

    // Web search tests (7.2B enhanced - removes "for" keyword)
    { input: 'search for React tutorials', expected: { useTool: true, toolName: 'web_search', input: { query: 'React tutorials' } } },
    { input: 'web search latest news', expected: { useTool: true, toolName: 'web_search', input: { query: 'latest news' } } },

    // No tool needed
    { input: 'Hello, how are you?', expected: { useTool: false } },
    { input: 'Tell me a joke', expected: { useTool: false } },
    { input: 'What is the meaning of life?', expected: { useTool: false } }
];

console.log('🧪 Testing Phase 7.2A - Tool Decision Layer\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    const result = decideTool(testCase.input);
    const isMatch = JSON.stringify(result) === JSON.stringify(testCase.expected);

    if (isMatch) {
        passed++;
        console.log(`✅ Test ${index + 1}: PASSED`);
        console.log(`   Input: "${testCase.input}"`);
        console.log(`   Result: ${JSON.stringify(result)}\n`);
    } else {
        failed++;
        console.log(`❌ Test ${index + 1}: FAILED`);
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