// Test script for calculator tool - Phase 7.0 Step 3
const toolRegistry = require('./server/services/toolRegistry');

console.log('=== Calculator Tool Test - Phase 7.0 Step 3 ===\n');

// Get the calculator tool
const calculator = toolRegistry.getTool('calculator');

if (!calculator) {
    console.error('❌ FAIL: Calculator tool not found in registry');
    process.exit(1);
}

console.log('✅ Calculator tool registered successfully\n');

// Test cases from requirements
const testCases = [
    { input: '2+2', expected: 4, description: 'Basic addition' },
    { input: '10*5', expected: 50, description: 'Basic multiplication' },
    { input: '(10+5)/3', expected: 5, description: 'Parentheses and division' },
    { input: '100/4', expected: 25, description: 'Division' },
    { input: '3-1', expected: 2, description: 'Subtraction' },
    { input: '2+3*4', expected: 14, description: 'Operator precedence' },
    { input: '(2+3)*4', expected: 20, description: 'Parentheses override precedence' },
    { input: '10/0', expected: null, description: 'Division by zero (should error)' },
    { input: '2+', expected: null, description: 'Invalid expression (should error)' },
    { input: 'eval("malicious")', expected: null, description: 'Unsafe expression (should error)' },
    { input: 'import os', expected: null, description: 'Unsafe code (should error)' },
    { input: '10++5', expected: null, description: 'Invalid syntax (should error)' }
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: "${testCase.input}"`);

    const result = calculator({ expression: testCase.input });

    if (testCase.expected === null) {
        // Expecting an error
        if (result.error) {
            console.log(`  ✅ PASS - Error returned: ${result.error}`);
            passed++;
        } else {
            console.log(`  ❌ FAIL - Expected error but got result: ${result.result}`);
            failed++;
        }
    } else {
        // Expecting a successful result
        if (result.error) {
            console.log(`  ❌ FAIL - Unexpected error: ${result.error}`);
            failed++;
        } else if (result.result === testCase.expected) {
            console.log(`  ✅ PASS - Result: ${result.result}`);
            passed++;
        } else {
            console.log(`  ❌ FAIL - Expected ${testCase.expected}, got ${result.result}`);
            failed++;
        }
    }
    console.log();
});

// Summary
console.log('=== Test Summary ===');
console.log(`Total Tests: ${testCases.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
    console.log('\n✅ All tests passed! Calculator tool is working correctly.');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review the implementation.');
    process.exit(1);
}