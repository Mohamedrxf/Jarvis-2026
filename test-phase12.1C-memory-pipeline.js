const http = require('http');

// Configuration
const BACKEND_URL = 'http://localhost:5000';

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

// Test cases for MemoryAgent
const testCases = [
    { id: 1, message: 'remember my favourite language is Python', description: 'Memory Creation 1' },
    { id: 2, message: 'what is my favourite language', description: 'Memory Query 1' },
    { id: 3, message: 'remember I study at SRM', description: 'Memory Creation 2' },
    { id: 4, message: 'where do I study', description: 'Memory Query 2' }
];

// Main test function
async function runTests() {
    console.log('='.repeat(80));
    console.log('PHASE 12.1C - MEMORY PIPELINE VERIFICATION');
    console.log('='.repeat(80));
    console.log();

    // Step 1: Authenticate
    console.log('🔐 AUTHENTICATION');
    console.log('-'.repeat(80));

    try {
        const uniqueEmail = `test-memory-${Date.now()}@jarvis.com`;
        const registerResult = await makeRequest({
            method: 'POST',
            path: '/api/auth/register'
        }, {
            username: `testuser-${Date.now()}`,
            email: uniqueEmail,
            password: 'test123'
        });

        console.log('   Registration status:', registerResult.status);

        if (registerResult.status === 200 || registerResult.status === 201) {
            const token = registerResult.data?.data?.token || registerResult.data?.token;

            if (token) {
                authToken = token;
                console.log('✅ Authentication successful');
                console.log('   User:', registerResult.data?.data?.user?.email || registerResult.data?.user?.email || 'unknown');
            } else {
                console.log('❌ Registration response missing token');
                console.log('   Response:', JSON.stringify(registerResult.data));
                return;
            }
        } else {
            console.log('❌ Registration failed');
            console.log('   Response:', JSON.stringify(registerResult.data));
            return;
        }
    } catch (error) {
        console.log('❌ Authentication error:', error.message);
        return;
    }

    console.log();

    // Step 2: Run memory pipeline tests
    console.log('🧪 MEMORY PIPELINE TESTS');
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
                const response = result.data.response;
                console.log(`✅ Response received`);
                console.log(`   Response type: ${typeof response}`);
                console.log(`   Response preview: ${JSON.stringify(response).substring(0, 200)}...`);

                // Check if memory was created/retrieved
                const hasMemoryIndicator = typeof response === 'string' &&
                    (response.includes('MEMORY') ||
                        response.includes('remember') ||
                        response.includes('favourite language') ||
                        response.includes('SRM') ||
                        response.includes('study'));

                if (hasMemoryIndicator) {
                    console.log(`   ✅ Memory operation detected in response`);
                }

                results.push({
                    id: testCase.id,
                    description: testCase.description,
                    status: 'PASS',
                    duration: duration,
                    response: response
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

    // Step 3: Summary
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
        phase: '12.1C',
        title: 'Memory Pipeline Verification',
        backend: BACKEND_URL,
        summary: {
            total: results.length,
            passed: passed,
            failed: failed,
            errors: errors,
            successRate: ((passed / results.length) * 100).toFixed(2) + '%'
        },
        results: results
    };

    const fs = require('fs');
    fs.writeFileSync('phase12.1C-memory-pipeline-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Report saved to: phase12.1C-memory-pipeline-report.json');
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});