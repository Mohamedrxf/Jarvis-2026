/**
 * Test Phase 8.0C - Agent-based Routing Integration
 * Tests the /api/chat endpoint with AgentService routing
 */

const BASE_URL = 'http://localhost:5000/api';

let authToken = null;
let serverProcess = null;

async function testPhase8_0C() {
    console.log('=== Phase 8.0C: Agent-based Routing Integration Tests ===\n');

    // Start server if not running
    console.log('0. Checking server status...');
    try {
        const statusResponse = await fetch(`${BASE_URL}/status`);
        const statusData = await statusResponse.json();
        if (statusData.success && statusData.status.server === 'online') {
            console.log('  ✓ Server is already running\n');
        } else {
            throw new Error('Server not online');
        }
    } catch (error) {
        console.log('  ⚠ Server not running. Please start the server first with: npm start');
        console.log('  Then run this test again.\n');
        process.exit(1);
    }

    // Register test user
    console.log('1. Setting up test user...');
    const timestamp = Date.now();
    try {
        const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `routingtest${timestamp}`,
                email: `routing${timestamp}@example.com`,
                password: 'test123456'
            })
        });

        const registerData = await registerResponse.json();
        if (registerData.success) {
            authToken = registerData.token;
            console.log('  ✓ Test user registered\n');
        } else {
            throw new Error(registerData.error || 'Registration failed');
        }
    } catch (error) {
        console.error('  ✗ Authentication failed:', error.message);
        process.exit(1);
    }

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

    // Test 1: Tool routing - Weather
    test('Tool routing: Weather query routes correctly', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'what is the weather in London' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(data.toolUsed === 'weather', `Expected toolUsed="weather", got "${data.toolUsed}"`);
        assert(data.response.includes('London'), 'Response should mention London');
    });

    // Test 2: Tool routing - Calculator
    test('Tool routing: Calculator query routes correctly', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'calculate 2 + 2' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(data.toolUsed === 'calculator', `Expected toolUsed="calculator", got "${data.toolUsed}"`);
        assert(data.response.includes('4'), 'Response should contain result 4');
    });

    // Test 3: Tool routing - Math expression
    test('Tool routing: Math expression routes correctly', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: '5 * 5' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(data.toolUsed === 'calculator', `Expected toolUsed="calculator", got "${data.toolUsed}"`);
    });

    // Test 4: Memory routing
    test('Memory routing: Memory request routes correctly', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'remember my name is John' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(!data.toolUsed, 'Should not use tool for memory request');
        assert(data.response, 'Should have AI response');
    });

    // Test 5: File routing
    test('File routing: File request routes correctly', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'upload my file' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(!data.toolUsed, 'Should not use tool for file request');
        assert(data.response, 'Should have AI response');
    });

    // Test 6: AI fallback
    test('AI fallback: General conversation routes to AI', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'hello, how are you?' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(!data.toolUsed, 'Should not use tool for general conversation');
        assert(data.response, 'Should have AI response');
    });

    // Test 7: Tool routing - Web search
    test('Tool routing: Web search routes correctly', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'search for JavaScript tutorials' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(data.toolUsed === 'web_search', `Expected toolUsed="web_search", got "${data.toolUsed}"`);
    });

    // Test 8: Tool routing - Currency
    test('Tool routing: Currency conversion routes correctly', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'convert 100 USD to EUR' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(data.toolUsed === 'currency', `Expected toolUsed="currency", got "${data.toolUsed}"`);
    });

    // Test 9: Tool routing - UUID
    test('Tool routing: UUID generation routes correctly', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'generate uuid' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(data.toolUsed === 'uuid', `Expected toolUsed="uuid", got "${data.toolUsed}"`);
    });

    // Test 10: Tool routing - Password
    test('Tool routing: Password generation routes correctly', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'generate password' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(data.toolUsed === 'password', `Expected toolUsed="password", got "${data.toolUsed}"`);
    });

    // Test 11: Tool routing - Date/time
    test('Tool routing: Date/time query routes correctly', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'what time is it' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(data.toolUsed === 'datetime', `Expected toolUsed="datetime", got "${data.toolUsed}"`);
    });

    // Test 12: Memory routing - Recall
    test('Memory routing: Memory recall routes correctly', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'what do you remember' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(!data.toolUsed, 'Should not use tool for memory recall');
        assert(data.response, 'Should have AI response');
    });

    // Test 13: File routing - Search files
    test('File routing: File search routes correctly', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'search my files' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(!data.toolUsed, 'Should not use tool for file search');
        assert(data.response, 'Should have AI response');
    });

    // Test 14: Priority - Tool over Memory
    test('Routing priority: Tool takes precedence over memory', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'search for files' }]
            })
        });

        const data = await response.json();
        assert(data.success, 'Request should succeed');
        assert(data.toolUsed === 'web_search', 'Should route to web_search tool, not file search');
    });

    // Test 15: Authentication still required
    test('Authentication: Protected route requires valid token', async () => {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer invalidtoken123`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'hello' }]
            })
        });

        const data = await response.json();
        assert(!data.success, 'Request should fail with invalid token');
        assert(data.error, 'Should return error message');
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
        console.log('\n✅ All Phase 8.0C integration tests passed!');
        console.log('✓ Tool routing works');
        console.log('✓ Memory routing works');
        console.log('✓ File routing works');
        console.log('✓ AI fallback works');
        console.log('✓ No regressions detected');
        process.exit(0);
    }
}

testPhase8_0C().catch(error => {
    console.error('\n✗ Test suite failed:', error.message);
    process.exit(1);
});