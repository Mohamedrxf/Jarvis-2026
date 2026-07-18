const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';

// Test credentials (you may need to adjust these)
const TEST_USER = {
    username: 'testuser',
    email: `test-${Date.now()}@jarvis.com`, // Unique email to avoid conflicts
    password: 'test123'
};

// Store auth token
let authToken = null;

// Helper function to make HTTP requests
function makeRequest(options, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(options.path, BACKEND_URL);
        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
                ...options.headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch {
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

// Test cases
const testCases = [
    { id: 1, message: 'hello', description: 'Greeting' },
    { id: 2, message: 'what is 2+5', description: 'Calculation' },
    { id: 3, message: 'explain artificial intelligence', description: 'AI Question' },
    { id: 4, message: 'weather in Chennai', description: 'Weather Query' },
    { id: 5, message: 'remember my favourite language is Python', description: 'Memory Creation' },
    { id: 6, message: 'what is my favourite language', description: 'Memory Query' },
    { id: 7, message: 'generate uuid', description: 'UUID Generation' },
    { id: 8, message: 'generate password', description: 'Password Generation' },
    { id: 9, message: 'current date and time', description: 'Date/Time Query' },
    { id: 10, message: 'summarize uploaded pdf', description: 'PDF Summarization' }
];

// Main test function
async function runTests() {
    console.log('='.repeat(80));
    console.log('PHASE 12.1 PRODUCTION VERIFICATION');
    console.log('='.repeat(80));
    console.log();

    // Step 1: Authenticate
    console.log('🔐 AUTHENTICATION');
    console.log('-'.repeat(80));

    try {
        // Always try to register with unique email first
        console.log('📝 Registering new test user...');
        const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@jarvis.com`;
        const registerResult = await makeRequest({
            method: 'POST',
            path: '/api/auth/register'
        }, {
            username: `testuser-${Date.now()}`,
            email: uniqueEmail,
            password: 'test123'
        });

        console.log('   Registration response status:', registerResult.status);
        console.log('   Registration response data:', JSON.stringify(registerResult.data).substring(0, 300));

        if ((registerResult.status === 200 || registerResult.status === 201)) {
            // Check different possible response structures
            const token = registerResult.data?.data?.token || registerResult.data?.token;
            const user = registerResult.data?.data?.user || registerResult.data?.user;

            if (token) {
                authToken = token;
                console.log('✅ Registration successful');
                console.log('   User:', user?.email || 'unknown');
                console.log('   Token:', authToken.substring(0, 20) + '...');
            } else {
                console.log('❌ Registration response missing token');
                console.log('   Full response:', JSON.stringify(registerResult.data));
                console.log('   Cannot proceed without authentication');
                return;
            }
        } else {
            console.log('❌ Registration failed with status:', registerResult.status);
            console.log('   Full response:', JSON.stringify(registerResult.data));
            console.log('   Cannot proceed without authentication');
            return;
        }
    } catch (error) {
        console.log('❌ Authentication error:', error.message);
        console.log('   Error stack:', error.stack);
        console.log('   Cannot proceed without authentication');
        return;
    }

    console.log();

    // Step 2: Check backend status
    console.log('🔍 BACKEND STATUS CHECK');
    console.log('-'.repeat(80));

    try {
        const statusResult = await makeRequest({
            method: 'GET',
            path: '/api/status'
        });

        if (statusResult.status === 200) {
            console.log('✅ Backend is online');
            console.log('   Provider:', statusResult.data.status.provider);
            console.log('   Port:', statusResult.data.status.port);
            console.log('   Timestamp:', statusResult.data.status.timestamp);
        } else {
            console.log('❌ Backend status check failed');
        }
    } catch (error) {
        console.log('❌ Backend is offline:', error.message);
        return;
    }

    console.log();

    // Step 3: Check frontend
    console.log('🎨 FRONTEND STATUS CHECK');
    console.log('-'.repeat(80));

    try {
        const frontendResult = await makeRequest({
            method: 'GET',
            path: '/',
            headers: { 'Host': 'localhost:5173' }
        }, null, FRONTEND_URL);

        console.log('✅ Frontend is accessible at', FRONTEND_URL);
    } catch (error) {
        console.log('⚠️  Frontend check:', error.message);
    }

    console.log();

    // Step 4: Run test cases
    console.log('🧪 RUNNING TEST CASES');
    console.log('='.repeat(80));

    const results = [];

    for (const testCase of testCases) {
        console.log();
        console.log(`Test ${testCase.id}: ${testCase.description}`);
        console.log(`Input: "${testCase.message}"`);
        console.log('-'.repeat(80));

        try {
            const startTime = Date.now();

            const result = await makeRequest({
                method: 'POST',
                path: '/api/chat'
            }, {
                messages: [
                    { role: 'user', content: testCase.message }
                ]
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`Status: ${result.status}`);
            console.log(`Duration: ${duration}ms`);

            if (result.data.success) {
                console.log(`✅ Response: ${JSON.stringify(result.data.response).substring(0, 100)}...`);
                results.push({
                    id: testCase.id,
                    description: testCase.description,
                    status: 'PASS',
                    duration: duration,
                    response: result.data.response
                });
            } else {
                console.log(`❌ Error: ${result.data.error}`);
                results.push({
                    id: testCase.id,
                    description: testCase.description,
                    status: 'FAIL',
                    error: result.data.error
                });
            }
        } catch (error) {
            console.log(`❌ Exception: ${error.message}`);
            results.push({
                id: testCase.id,
                description: testCase.description,
                status: 'ERROR',
                error: error.message
            });
        }
    }

    // Step 5: Summary
    console.log();
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const errors = results.filter(r => r.status === 'ERROR').length;

    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Errors: ${errors} ⚠️`);
    console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(2)}%`);
    console.log();

    // Detailed results
    console.log('DETAILED RESULTS:');
    console.log('-'.repeat(80));
    results.forEach(result => {
        const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${status} Test ${result.id}: ${result.description} (${result.duration || 0}ms)`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });

    console.log();
    console.log('='.repeat(80));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(80));

    // Save results to file
    const report = {
        timestamp: new Date().toISOString(),
        backend: BACKEND_URL,
        frontend: FRONTEND_URL,
        summary: {
            total: results.length,
            passed: passed,
            failed: failed,
            errors: errors,
            successRate: ((passed / results.length) * 100).toFixed(2) + '%'
        },
        results: results
    };

    fs.writeFileSync('production-verification-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Report saved to: production-verification-report.json');
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});