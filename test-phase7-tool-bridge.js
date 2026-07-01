/**
 * Phase 7.0 Step 5 - Chat Integration Bridge Test
 * Tests tool detection and execution in chat handler
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
let authToken = null;
let testConversationId = null;

// Test results tracking
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper to make HTTP requests
function makeRequest(method, endpoint, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, SERVER_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Helper to log test results
function logTest(name, passed, details = '') {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${name}`);
    if (details) {
        console.log(`  ${details}`);
    }

    results.tests.push({ name, passed, details });
    if (passed) {
        results.passed++;
    } else {
        results.failed++;
    }
}

// Test 1: Authenticate and get token
async function testAuthentication() {
    try {
        // Try to read test user credentials from .env
        const envPath = path.join(__dirname, 'server', '.env');
        let email = 'test@example.com';
        let password = 'test123';

        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            const emailMatch = envContent.match(/TEST_USER_EMAIL=(.+)/);
            const passwordMatch = envContent.match(/TEST_USER_PASSWORD=(.+)/);
            if (emailMatch) email = emailMatch[1].trim();
            if (passwordMatch) password = passwordMatch[1].trim();
        }

        // Try to register first (in case user doesn't exist)
        const registerResponse = await makeRequest('POST', '/api/auth/register', {
            username: 'testuser',
            email: email,
            password: password
        });

        // Try to login
        const response = await makeRequest('POST', '/api/auth/login', {
            email: email,
            password: password
        });

        if (response.status === 200 && response.data.success && response.data.token) {
            authToken = response.data.token;
            logTest('Authentication', true, `Token received for user: ${response.data.user?.email}`);
            return true;
        } else {
            logTest('Authentication', false, `Status: ${response.status}, Error: ${response.data.error || 'No token'}`);
            return false;
        }
    } catch (error) {
        logTest('Authentication', false, error.message);
        return false;
    }
}

// Test 2: Create a test conversation
async function testCreateConversation() {
    try {
        const response = await makeRequest('POST', '/api/conversations',
            { title: 'Tool Bridge Test' },
            authToken
        );

        if (response.status === 201 && response.data.success) {
            testConversationId = response.data.conversation.id;
            logTest('Create Conversation', true, `Conversation ID: ${testConversationId}`);
            return true;
        } else {
            logTest('Create Conversation', false, `Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        logTest('Create Conversation', false, error.message);
        return false;
    }
}

// Test 3: Calculator tool - should bypass AI
async function testCalculatorTool() {
    try {
        const response = await makeRequest('POST', '/api/chat', {
            messages: [
                { role: 'user', content: 'calculate 2 + 2' }
            ]
        }, authToken);

        const isToolResponse = response.data.toolUsed === 'calculate';
        const isCorrect = response.data.response === 4;

        logTest(
            'Calculator Tool Detection',
            isToolResponse && isCorrect,
            `Tool used: ${response.data.toolUsed}, Result: ${response.data.response}`
        );
        return isToolResponse && isCorrect;
    } catch (error) {
        logTest('Calculator Tool Detection', false, error.message);
        return false;
    }
}

// Test 4: UUID tool - should bypass AI
async function testUUIDTool() {
    try {
        const response = await makeRequest('POST', '/api/chat', {
            messages: [
                { role: 'user', content: 'generate uuid' }
            ]
        }, authToken);

        const isToolResponse = response.data.toolUsed === 'uuid';
        const isValidUUID = response.data.response && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(response.data.response);

        logTest(
            'UUID Tool Detection',
            isToolResponse && isValidUUID,
            `Tool used: ${response.data.toolUsed}, Valid UUID: ${isValidUUID}`
        );
        return isToolResponse && isValidUUID;
    } catch (error) {
        logTest('UUID Tool Detection', false, error.message);
        return false;
    }
}

// Test 5: Password tool - should bypass AI
async function testPasswordTool() {
    try {
        const response = await makeRequest('POST', '/api/chat', {
            messages: [
                { role: 'user', content: 'generate password' }
            ]
        }, authToken);

        const isToolResponse = response.data.toolUsed === 'password';
        const isValidPassword = response.data.response && response.data.response.length === 12;

        logTest(
            'Password Tool Detection',
            isToolResponse && isValidPassword,
            `Tool used: ${response.data.toolUsed}, Length: ${response.data.response?.length || 0}`
        );
        return isToolResponse && isValidPassword;
    } catch (error) {
        logTest('Password Tool Detection', false, error.message);
        return false;
    }
}

// Test 6: Password tool with custom length
async function testPasswordToolWithLength() {
    try {
        const response = await makeRequest('POST', '/api/chat', {
            messages: [
                { role: 'user', content: 'generate password 16' }
            ]
        }, authToken);

        const isToolResponse = response.data.toolUsed === 'password';
        const isValidPassword = response.data.response && response.data.response.length === 16;

        logTest(
            'Password Tool with Custom Length',
            isToolResponse && isValidPassword,
            `Tool used: ${response.data.toolUsed}, Length: ${response.data.response?.length || 0}`
        );
        return isToolResponse && isValidPassword;
    } catch (error) {
        logTest('Password Tool with Custom Length', false, error.message);
        return false;
    }
}

// Test 7: DateTime tool - should bypass AI
async function testDateTimeTool() {
    try {
        const response = await makeRequest('POST', '/api/chat', {
            messages: [
                { role: 'user', content: 'what is the time' }
            ]
        }, authToken);

        const isToolResponse = response.data.toolUsed === 'datetime';
        const hasTimeInfo = response.data.response &&
            response.data.response.time &&
            response.data.response.date;

        logTest(
            'DateTime Tool Detection',
            isToolResponse && hasTimeInfo,
            `Tool used: ${response.data.toolUsed}, Has time info: ${hasTimeInfo}`
        );
        return isToolResponse && hasTimeInfo;
    } catch (error) {
        logTest('DateTime Tool Detection', false, error.message);
        return false;
    }
}

// Test 8: Normal message - should use AI (not a tool)
async function testNormalMessage() {
    try {
        const response = await makeRequest('POST', '/api/chat', {
            messages: [
                { role: 'user', content: 'Hello, how are you?' }
            ]
        }, authToken);

        const isNotToolResponse = !response.data.toolUsed;
        const hasResponse = response.data.response && response.data.response.length > 0;

        logTest(
            'Normal Message (AI Pipeline)',
            isNotToolResponse && hasResponse,
            `Tool used: ${response.data.toolUsed || 'none'}, Has response: ${hasResponse}`
        );
        return isNotToolResponse && hasResponse;
    } catch (error) {
        logTest('Normal Message (AI Pipeline)', false, error.message);
        return false;
    }
}

// Test 9: Calculator with complex expression
async function testComplexCalculator() {
    try {
        const response = await makeRequest('POST', '/api/chat', {
            messages: [
                { role: 'user', content: 'calculate (10 + 5) * 3' }
            ]
        }, authToken);

        const isToolResponse = response.data.toolUsed === 'calculate';
        const isCorrect = response.data.response === 45;

        logTest(
            'Complex Calculator Expression',
            isToolResponse && isCorrect,
            `Tool used: ${response.data.toolUsed}, Result: ${response.data.response}`
        );
        return isToolResponse && isCorrect;
    } catch (error) {
        logTest('Complex Calculator Expression', false, error.message);
        return false;
    }
}

// Test 10: Case insensitivity
async function testCaseInsensitivity() {
    try {
        const response = await makeRequest('POST', '/api/chat', {
            messages: [
                { role: 'user', content: 'CALCULATE 100 / 4' }
            ]
        }, authToken);

        const isToolResponse = response.data.toolUsed === 'calculate';
        const isCorrect = response.data.response === 25;

        logTest(
            'Case Insensitive Tool Detection',
            isToolResponse && isCorrect,
            `Tool used: ${response.data.toolUsed}, Result: ${response.data.response}`
        );
        return isToolResponse && isCorrect;
    } catch (error) {
        logTest('Case Insensitive Tool Detection', false, error.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('='.repeat(60));
    console.log('Phase 7.0 Step 5 - Chat Integration Bridge Tests');
    console.log('='.repeat(60));
    console.log('');

    // Check if server is running
    try {
        await makeRequest('GET', '/api/status');
    } catch (error) {
        console.error('ERROR: Server is not running. Please start the server first.');
        console.error('Run: cd server && npm start');
        process.exit(1);
    }

    console.log('Starting tests...\n');

    // Run all tests
    const authPassed = await testAuthentication();
    if (!authPassed) {
        console.log('\n⚠ Authentication failed. Cannot proceed with tool tests.');
        printSummary();
        return;
    }

    await testCreateConversation();
    await testCalculatorTool();
    await testUUIDTool();
    await testPasswordTool();
    await testPasswordToolWithLength();
    await testDateTimeTool();
    await testNormalMessage();
    await testComplexCalculator();
    await testCaseInsensitivity();

    printSummary();
}

function printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (results.failed > 0) {
        console.log('\nFailed Tests:');
        results.tests
            .filter(t => !t.passed)
            .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
    }

    console.log('');
}

// Run tests
runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});