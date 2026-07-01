// Currency Tool Test - Phase 7.1B
// Tests for currency conversion functionality

const toolRegistry = require('./server/services/toolRegistry');

console.log('=== Currency Converter Tool Tests - Phase 7.1B ===\n');

let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
    try {
        testFn();
        console.log(`✓ PASS: ${description}`);
        testsPassed++;
    } catch (error) {
        console.log(`✗ FAIL: ${description}`);
        console.log(`  Error: ${error.message}`);
        testsFailed++;
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
    }
}

function assertApproxEqual(actual, expected, tolerance, message) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`${message}\n  Expected: ~${expected}\n  Actual: ${actual}`);
    }
}

// Test 1: Verify tool registration
test('Tool is registered in registry', () => {
    const tool = toolRegistry.getTool('currency');
    if (!tool) {
        throw new Error('Currency tool not found in registry');
    }
    if (typeof tool !== 'function') {
        throw new Error('Currency tool is not a function');
    }
});

// Test 2: Verify tool appears in list
test('Tool appears in listTools()', () => {
    const tools = toolRegistry.listTools();
    if (!tools.includes('currency')) {
        throw new Error('Currency tool not in tool list');
    }
});

// Test 3: USD to INR conversion
test('USD to INR conversion (100 USD)', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 100,
        from: 'USD',
        to: 'INR'
    });

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.result) {
        throw new Error('No result returned');
    }

    // 100 USD * 83 = 8300 INR
    assertEqual(result.result.from, 'USD', 'From currency mismatch');
    assertEqual(result.result.to, 'INR', 'To currency mismatch');
    assertEqual(result.result.inputAmount, 100, 'Input amount mismatch');
    assertApproxEqual(result.result.convertedAmount, 8300, 0.01, 'Converted amount incorrect');
    assertApproxEqual(result.result.rateUsed, 83, 0.0001, 'Rate used incorrect');
});

// Test 4: INR to USD conversion
test('INR to USD conversion (8300 INR)', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 8300,
        from: 'INR',
        to: 'USD'
    });

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.result) {
        throw new Error('No result returned');
    }

    // 8300 INR / 83 = 100 USD
    assertEqual(result.result.from, 'INR', 'From currency mismatch');
    assertEqual(result.result.to, 'USD', 'To currency mismatch');
    assertEqual(result.result.inputAmount, 8300, 'Input amount mismatch');
    assertApproxEqual(result.result.convertedAmount, 100, 0.01, 'Converted amount incorrect');
    assertApproxEqual(result.result.rateUsed, 1 / 83, 0.0001, 'Rate used incorrect');
});

// Test 5: EUR to INR conversion
test('EUR to INR conversion (50 EUR)', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 50,
        from: 'EUR',
        to: 'INR'
    });

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.result) {
        throw new Error('No result returned');
    }

    // 50 EUR * 90 = 4500 INR
    assertEqual(result.result.from, 'EUR', 'From currency mismatch');
    assertEqual(result.result.to, 'INR', 'To currency mismatch');
    assertEqual(result.result.inputAmount, 50, 'Input amount mismatch');
    assertApproxEqual(result.result.convertedAmount, 4500, 0.01, 'Converted amount incorrect');
    assertApproxEqual(result.result.rateUsed, 90, 0.0001, 'Rate used incorrect');
});

// Test 6: INR to EUR conversion
test('INR to EUR conversion (4500 INR)', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 4500,
        from: 'INR',
        to: 'EUR'
    });

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.result) {
        throw new Error('No result returned');
    }

    // 4500 INR / 90 = 50 EUR
    assertEqual(result.result.from, 'INR', 'From currency mismatch');
    assertEqual(result.result.to, 'EUR', 'To currency mismatch');
    assertEqual(result.result.inputAmount, 4500, 'Input amount mismatch');
    assertApproxEqual(result.result.convertedAmount, 50, 0.01, 'Converted amount incorrect');
    assertApproxEqual(result.result.rateUsed, 1 / 90, 0.0001, 'Rate used incorrect');
});

// Test 7: USD to EUR cross conversion
test('USD to EUR cross conversion (100 USD)', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 100,
        from: 'USD',
        to: 'EUR'
    });

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.result) {
        throw new Error('No result returned');
    }

    // 100 USD -> 8300 INR -> 92.22 EUR (8300/90)
    assertEqual(result.result.from, 'USD', 'From currency mismatch');
    assertEqual(result.result.to, 'EUR', 'To currency mismatch');
    assertEqual(result.result.inputAmount, 100, 'Input amount mismatch');
    assertApproxEqual(result.result.convertedAmount, 92.22, 0.01, 'Converted amount incorrect');
    assertApproxEqual(result.result.rateUsed, 0.9222, 0.0001, 'Rate used incorrect');
});

// Test 8: EUR to USD cross conversion
test('EUR to USD cross conversion (92 EUR)', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 92,
        from: 'EUR',
        to: 'USD'
    });

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.result) {
        throw new Error('No result returned');
    }

    // 92 EUR -> 8280 INR -> 99.76 USD (8280/83)
    assertEqual(result.result.from, 'EUR', 'From currency mismatch');
    assertEqual(result.result.to, 'USD', 'To currency mismatch');
    assertEqual(result.result.inputAmount, 92, 'Input amount mismatch');
    assertApproxEqual(result.result.convertedAmount, 99.76, 0.01, 'Converted amount incorrect');
    assertApproxEqual(result.result.rateUsed, 1.0843, 0.0001, 'Rate used incorrect');
});

// Test 9: Same currency conversion
test('Same currency conversion (USD to USD)', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 100,
        from: 'USD',
        to: 'USD'
    });

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.result) {
        throw new Error('No result returned');
    }

    assertEqual(result.result.convertedAmount, 100, 'Same currency should return same amount');
    assertEqual(result.result.rateUsed, 1.0, 'Rate should be 1.0 for same currency');
});

// Test 10: Missing parameters
test('Missing amount parameter', () => {
    const result = toolRegistry.getTool('currency')({
        from: 'USD',
        to: 'INR'
    });

    if (!result.error) {
        throw new Error('Should return error for missing amount');
    }

    if (!result.error.includes('amount')) {
        throw new Error('Error should mention missing amount parameter');
    }
});

// Test 11: Missing from parameter
test('Missing from parameter', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 100,
        to: 'INR'
    });

    if (!result.error) {
        throw new Error('Should return error for missing from');
    }

    if (!result.error.includes('from')) {
        throw new Error('Error should mention missing from parameter');
    }
});

// Test 12: Missing to parameter
test('Missing to parameter', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 100,
        from: 'USD'
    });

    if (!result.error) {
        throw new Error('Should return error for missing to');
    }

    if (!result.error.includes('to')) {
        throw new Error('Error should mention missing to parameter');
    }
});

// Test 13: Invalid currency
test('Invalid from currency', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 100,
        from: 'GBP',
        to: 'INR'
    });

    if (!result.error) {
        throw new Error('Should return error for invalid currency');
    }

    if (!result.error.includes('GBP')) {
        throw new Error('Error should mention invalid currency');
    }
});

// Test 14: Invalid to currency
test('Invalid to currency', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 100,
        from: 'USD',
        to: 'JPY'
    });

    if (!result.error) {
        throw new Error('Should return error for invalid currency');
    }

    if (!result.error.includes('JPY')) {
        throw new Error('Error should mention invalid currency');
    }
});

// Test 15: Negative amount
test('Negative amount validation', () => {
    const result = toolRegistry.getTool('currency')({
        amount: -100,
        from: 'USD',
        to: 'INR'
    });

    if (!result.error) {
        throw new Error('Should return error for negative amount');
    }

    if (!result.error.includes('non-negative')) {
        throw new Error('Error should mention non-negative requirement');
    }
});

// Test 16: Zero amount
test('Zero amount conversion', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 0,
        from: 'USD',
        to: 'INR'
    });

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.result) {
        throw new Error('No result returned');
    }

    assertEqual(result.result.convertedAmount, 0, 'Zero amount should convert to zero');
});

// Test 17: Case insensitivity
test('Case insensitive currency codes (usd to inr)', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 100,
        from: 'usd',
        to: 'inr'
    });

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.result) {
        throw new Error('No result returned');
    }

    assertEqual(result.result.from, 'USD', 'From should be uppercase');
    assertEqual(result.result.to, 'INR', 'To should be uppercase');
    assertApproxEqual(result.result.convertedAmount, 8300, 0.01, 'Conversion should work with lowercase');
});

// Test 18: Decimal amount
test('Decimal amount conversion (99.99 USD to INR)', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 99.99,
        from: 'USD',
        to: 'INR'
    });

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.result) {
        throw new Error('No result returned');
    }

    // 99.99 * 83 = 8299.17
    assertApproxEqual(result.result.convertedAmount, 8299.17, 0.01, 'Decimal conversion incorrect');
});

// Test 19: Verify rounding to 2 decimals
test('Result rounded to 2 decimals', () => {
    const result = toolRegistry.getTool('currency')({
        amount: 1,
        from: 'USD',
        to: 'EUR'
    });

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.result) {
        throw new Error('No result returned');
    }

    // Check that convertedAmount has at most 2 decimal places
    const decimals = (result.result.convertedAmount.toString().split('.')[1] || '').length;
    if (decimals > 2) {
        throw new Error(`Result has ${decimals} decimals, should be max 2`);
    }
});

// Test 20: Null params
test('Null params handling', () => {
    const result = toolRegistry.getTool('currency')(null);

    if (!result.error) {
        throw new Error('Should return error for null params');
    }

    if (!result.error.includes('Missing required parameters')) {
        throw new Error('Error should mention missing parameters');
    }
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}