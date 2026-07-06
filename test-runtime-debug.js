/**
 * Runtime Debug Test - Complete End-to-End Verification
 * Tests the entire request pipeline from API to Gemini response
 */

const API_BASE = 'http://localhost:5000/api';
let authToken = null;

// Test credentials (from auth system)
const TEST_USER = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'test123'
};

async function register() {
    try {
        console.log('\n=== STEP 1: Registration ===');
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Registration failed');
        }
        console.log('✓ Registration successful');
        console.log('  User:', data.user?.email);
        authToken = data.token;
        return true;
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('  User already exists, proceeding to login...');
            return await login();
        }
        console.error('✗ Registration failed:', error.message);
        return false;
    }
}

async function login() {
    try {
        console.log('\n=== STEP 1: Authentication ===');
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Login failed');
        }
        console.log('✓ Login successful');
        console.log('  User:', data.user?.email);
        authToken = data.token;
        return true;
    } catch (error) {
        console.error('✗ Login failed:', error.message);
        return false;
    }
}

async function testEndpoint(name, message) {
    try {
        console.log(`\n=== ${name} ===`);
        console.log(`  Message: "${message}"`);

        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: [{ role: 'user', content: message }] })
        });

        const data = await response.json();

        console.log('  Status:', data.success ? '✓ SUCCESS' : '✗ FAILED');
        console.log('  Response type:', typeof data.response);

        if (data.response && typeof data.response === 'object') {
            console.log('  Response keys:', Object.keys(data.response));
            console.log('  Response content:', data.response.content || data.response);
        } else {
            console.log('  Response:', data.response);
        }

        return data;
    } catch (error) {
        console.error('  ✗ Error:', error.message);
        return null;
    }
}

async function runTests() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║        JARVIS 2026 - Runtime Debug Test Suite            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');

    // Step 1: Register/Login
    const loggedIn = await register();
    if (!loggedIn) {
        console.error('\n✗ Cannot proceed without authentication');
        process.exit(1);
    }

    // Step 2: Test various message types
    const tests = [
        { name: 'GREETING', message: 'hello' },
        { name: 'MATH', message: 'what is 2 + 5' },
        { name: 'AI_EXPLANATION', message: 'explain AI' },
        { name: 'WEATHER', message: 'weather in Chennai' },
        { name: 'MEMORY', message: 'remember that my favorite color is blue' },
        { name: 'FILE', message: 'show my files' }
    ];

    const results = [];
    for (const test of tests) {
        const result = await testEndpoint(test.name, test.message);
        results.push({ ...test, result });
    }

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                      TEST SUMMARY                         ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');

    results.forEach(({ name, result }) => {
        const status = result?.success ? '✓' : '✗';
        const hasContent = result?.response &&
            (typeof result.response === 'string' || result.response.content);
        console.log(`${status} ${name}: ${hasContent ? 'HAS RESPONSE' : 'NO RESPONSE'}`);
    });

    console.log('\n✓ Test suite completed\n');
}

// Run tests
runTests().catch(error => {
    console.error('\n✗ Test suite failed:', error);
    process.exit(1);
});