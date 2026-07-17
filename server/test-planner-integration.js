// Planner Agent Integration Test - Phase 12.1
// Tests real runtime requests through the integrated pipeline

const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:5001';
let authToken = null;
let testResults = [];

// Test cases
const testCases = [
    {
        name: 'Greeting',
        message: 'hello',
        expectedIntent: 'greeting',
        expectedRoute: 'ai'
    },
    {
        name: 'Calculation',
        message: 'what is 2+5',
        expectedIntent: 'question',
        expectedRoute: 'tool'
    },
    {
        name: 'AI Question',
        message: 'explain AI',
        expectedIntent: 'question',
        expectedRoute: 'ai'
    },
    {
        name: 'Weather Query',
        message: 'weather in Chennai',
        expectedIntent: 'weather',
        expectedRoute: 'tool'
    },
    {
        name: 'Memory Creation',
        message: 'remember my name is Rafeeq',
        expectedIntent: 'memory',
        expectedRoute: 'memory'
    },
    {
        name: 'Memory Query',
        message: 'what is my name',
        expectedIntent: 'question',
        expectedRoute: 'memory'
    },
    {
        name: 'File Operation',
        message: 'upload a file and summarize it',
        expectedIntent: 'file',
        expectedRoute: 'file'
    }
];

/**
 * Make HTTP request
 */
function makeRequest(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

/**
 * Login to get auth token
 */
async function login() {
    console.log('🔐 Logging in...\n');

    const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const body = {
        email: 'plannertest@example.com',
        password: 'testpassword123'
    };

    try {
        const response = await makeRequest(options, body);
        console.log('Login response:', JSON.stringify(response, null, 2));

        if (response.data.success && response.data.token) {
            authToken = response.data.token;
            console.log('✅ Login successful\n');
            return true;
        } else {
            console.log('⚠️  Login failed, trying to register...\n');
            return await register();
        }
    } catch (error) {
        console.error('Login error:', error.message);
        return await register();
    }
}

/**
 * Register test user
 */
async function register() {
    console.log('📝 Registering test user...\n');

    const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const body = {
        username: 'plannertest',
        email: 'plannertest@example.com',
        password: 'testpassword123'
    };

    try {
        const response = await makeRequest(options, body);
        console.log('Register response:', JSON.stringify(response, null, 2));

        if (response.data.success && response.data.token) {
            authToken = response.data.token;
            console.log('✅ Registration successful\n');
            return true;
        } else {
            console.error('❌ Registration failed');
            return false;
        }
    } catch (error) {
        console.error('Registration error:', error.message);
        return false;
    }
}

/**
 * Send chat message and capture planner output
 */
async function sendChatMessage(message) {
    const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/chat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };

    const body = {
        messages: [
            { role: 'user', content: message }
        ]
    };

    try {
        const response = await makeRequest(options, body);
        return response;
    } catch (error) {
        console.error('Chat request error:', error.message);
        return { status: 500, data: { error: error.message } };
    }
}

/**
 * Run integration test
 */
async function runIntegrationTest() {
    console.log('='.repeat(80));
    console.log('PLANNER AGENT - PHASE 12.1 INTEGRATION TEST');
    console.log('='.repeat(80));
    console.log('');

    // Step 1: Login/Register
    const authenticated = await login();
    if (!authenticated) {
        console.error('❌ Failed to authenticate. Cannot proceed with tests.');
        process.exit(1);
    }

    // Step 2: Check server status
    console.log('🔍 Checking server status...\n');
    const statusResponse = await makeRequest({
        hostname: 'localhost',
        port: 5001,
        path: '/api/status',
        method: 'GET'
    });

    if (statusResponse.status !== 200) {
        console.error('❌ Server is not running. Please start the server first.');
        console.error('Run: node server/server.js');
        process.exit(1);
    }

    console.log('✅ Server is online\n');
    console.log('='.repeat(80));
    console.log('RUNNING TEST CASES');
    console.log('='.repeat(80));
    console.log('');

    // Step 3: Run test cases
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`Test ${i + 1}/${testCases.length}: ${testCase.name}`);
        console.log(`${'─'.repeat(80)}`);
        console.log(`📝 Input: "${testCase.message}"`);
        console.log(`🎯 Expected Intent: ${testCase.expectedIntent}`);
        console.log(`🛤️  Expected Route: ${testCase.expectedRoute}`);
        console.log('');

        const response = await sendChatMessage(testCase.message);

        console.log(`📊 Response Status: ${response.status}`);
        console.log(`✅ Success: ${response.data.success || false}`);

        if (response.data.error) {
            console.log(`❌ Error: ${response.data.error}`);
            testResults.push({
                name: testCase.name,
                passed: false,
                error: response.data.error
            });
        } else {
            const responseText = typeof response.data.response === 'string'
                ? response.data.response.substring(0, 100)
                : JSON.stringify(response.data.response).substring(0, 100);
            console.log(`💬 Response: ${responseText}...`);
            testResults.push({
                name: testCase.name,
                passed: true,
                response: response.data.response
            });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 4: Print summary
    console.log('\n');
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));

    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed).length;

    console.log(`Total Tests: ${testResults.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / testResults.length) * 100).toFixed(2)}%`);
    console.log('='.repeat(80));

    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.name}: ${r.error}`);
        });
    }

    console.log('\n✅ Integration test completed');
    console.log('\n📋 Check server logs for PlannerAgent output:');
    console.log('   - [PlannerAgent] Intent');
    console.log('   - [PlannerAgent] Route');
    console.log('   - [PlannerAgent] Agents');
    console.log('   - [PlannerAgent] Execution Mode');
    console.log('   - [PlannerAgent] Expected Output');
}

// Run test
runIntegrationTest().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});