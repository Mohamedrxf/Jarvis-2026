const http = require('http');
const BASE_URL = 'http://localhost:5000';

// Test data
const testMessages = [
    "hello",
    "what is 2 + 5",
    "what is AI",
    "weather in Chennai",
    "remember my name is Rafeeq",
    "what is my name"
];

let authToken = null;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (authToken) {
            options.headers['Authorization'] = `Bearer ${authToken}`;
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

// Run tests
async function runTests() {
    console.log('=== JARVIS Runtime Verification ===\n');

    // Test 1: Status endpoint
    console.log('1. Testing GET /api/status...');
    try {
        const status = await makeRequest('GET', '/api/status');
        console.log(`   Status: ${status.status}`);
        console.log(`   Response: ${JSON.stringify(status.data, null, 2)}`);
        if (status.status === 200 && status.data.success) {
            console.log('   ✓ PASS\n');
        } else {
            console.log('   ✗ FAIL\n');
        }
    } catch (error) {
        console.log(`   ✗ ERROR: ${error.message}\n`);
    }

    // Test 2: Register user with unique email
    console.log('2. Testing POST /api/auth/register...');
    let testEmail = null;
    try {
        const timestamp = Date.now();
        testEmail = `rafeeq${timestamp}@test.com`;
        const register = await makeRequest('POST', '/api/auth/register', {
            username: 'Rafeeq',
            email: testEmail,
            password: 'test123'
        });
        console.log(`   Status: ${register.status}`);
        console.log(`   Response: ${JSON.stringify(register.data, null, 2)}`);
        if (register.status === 201 && register.data.success) {
            console.log('   ✓ PASS\n');
        } else {
            console.log('   ✗ FAIL (continuing anyway)\n');
        }
    } catch (error) {
        console.log(`   ✗ ERROR: ${error.message}\n`);
    }

    // Test 3: Login to get token
    console.log('3. Testing POST /api/auth/login...');
    try {
        if (!testEmail) {
            testEmail = `rafeeq${Date.now()}@test.com`;
        }
        const login = await makeRequest('POST', '/api/auth/login', {
            email: testEmail,
            password: 'test123'
        });
        console.log(`   Status: ${login.status}`);
        if (login.status === 200 && login.data.success) {
            authToken = login.data.token;
            console.log(`   Token received: ${authToken.substring(0, 20)}...`);
            console.log('   ✓ PASS\n');
        } else {
            console.log(`   Response: ${JSON.stringify(login.data, null, 2)}`);
            console.log('   ✗ FAIL\n');
        }
    } catch (error) {
        console.log(`   ✗ ERROR: ${error.message}\n`);
    }

    if (!authToken) {
        console.log('Cannot proceed without auth token. Exiting.');
        return;
    }

    // Test 4: Chat endpoint with various messages
    for (let i = 0; i < testMessages.length; i++) {
        const message = testMessages[i];
        console.log(`${i + 4}. Testing POST /api/chat with: "${message}"...`);
        try {
            const chat = await makeRequest('POST', '/api/chat', {
                messages: [{ role: 'user', content: message }]
            });
            console.log(`   Status: ${chat.status}`);
            if (chat.status === 200 && chat.data.success) {
                console.log(`   Response: ${chat.data.response?.substring(0, 100)}...`);
                console.log('   ✓ PASS\n');
            } else {
                console.log(`   Response: ${JSON.stringify(chat.data, null, 2)}`);
                console.log('   ✗ FAIL\n');
            }
        } catch (error) {
            console.log(`   ✗ ERROR: ${error.message}\n`);
        }
    }

    console.log('=== Tests Complete ===');
    console.log('Server is still running. Check the server terminal for logs.');
}

runTests().catch(console.error);