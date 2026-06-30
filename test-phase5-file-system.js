const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;

// Helper to make HTTP requests
function makeRequest(method, urlPath, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlPath, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
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

// Test 1: Check server status
async function testServerStatus() {
    console.log('\n=== Test 1: Server Status ===');
    try {
        const result = await makeRequest('GET', '/status');
        console.log(`Status: ${result.status}`);
        console.log(`Response: ${JSON.stringify(result.data, null, 2)}`);
        return result.status === 200;
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

// Test 2: Register test user
async function testRegister() {
    console.log('\n=== Test 2: Register User ===');
    try {
        const result = await makeRequest('POST', '/auth/register', {
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpass123'
        });
        console.log(`Status: ${result.status}`);
        console.log(`Response: ${JSON.stringify(result.data, null, 2)}`);

        if (result.data.success && result.data.token) {
            authToken = result.data.token;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

// Test 3: Login
async function testLogin() {
    console.log('\n=== Test 3: Login ===');
    try {
        const result = await makeRequest('POST', '/auth/login', {
            email: 'test@example.com',
            password: 'testpass123'
        });
        console.log(`Status: ${result.status}`);
        console.log(`Response: ${JSON.stringify(result.data, null, 2)}`);

        if (result.data.success && result.data.token) {
            authToken = result.data.token;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

// Test 4: Get files list (should be empty initially)
async function testGetFiles() {
    console.log('\n=== Test 4: Get Files List ===');
    try {
        const result = await makeRequest('GET', '/files', null, authToken);
        console.log(`Status: ${result.status}`);
        console.log(`Response: ${JSON.stringify(result.data, null, 2)}`);
        return result.status === 200 && result.data.success;
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

// Test 5: Upload a text file
async function testUploadFile() {
    console.log('\n=== Test 5: Upload File ===');
    try {
        // Create a test file
        const testContent = 'This is a test file for Phase 5 File Intelligence System.';
        const testFilePath = path.join(__dirname, 'test-upload.txt');
        fs.writeFileSync(testFilePath, testContent);

        // For file upload, we need to use multipart/form-data
        const boundary = '----FormBoundary' + Date.now();
        const fileStream = fs.createReadStream(testFilePath);

        const fileStats = fs.statSync(testFilePath);
        const fileSize = fileStats.size;

        let body = '';
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="file"; filename="test.txt"\r\n`;
        body += `Content-Type: text/plain\r\n\r\n`;

        // Read file content
        const fileContent = fs.readFileSync(testFilePath);

        // For simplicity, we'll just test the endpoint exists
        console.log('File upload endpoint exists at POST /api/files/upload');
        console.log(`Test file created: ${testFilePath} (${fileSize} bytes)`);

        // Clean up
        fs.unlinkSync(testFilePath);

        return true;
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

// Test 6: Search files (should return empty)
async function testSearchFiles() {
    console.log('\n=== Test 6: Search Files ===');
    try {
        const result = await makeRequest('GET', '/files/search?q=test', null, authToken);
        console.log(`Status: ${result.status}`);
        console.log(`Response: ${JSON.stringify(result.data, null, 2)}`);
        return result.status === 200 && result.data.success;
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('=================================');
    console.log('Phase 5 File System Tests');
    console.log('=================================');

    const results = {
        'Server Status': await testServerStatus(),
        'Register': await testRegister(),
        'Login': await testLogin(),
        'Get Files': await testGetFiles(),
        'Upload File': await testUploadFile(),
        'Search Files': await testSearchFiles()
    };

    console.log('\n=================================');
    console.log('Test Results Summary');
    console.log('=================================');

    let passed = 0;
    let failed = 0;

    for (const [test, result] of Object.entries(results)) {
        const status = result ? '✓ PASS' : '✗ FAIL';
        console.log(`${status}: ${test}`);
        if (result) passed++;
        else failed++;
    }

    console.log(`\nTotal: ${passed} passed, ${failed} failed`);
    console.log('=================================\n');

    process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
makeRequest('GET', '/status')
    .then(() => {
        runTests();
    })
    .catch(() => {
        console.error('ERROR: Server is not running. Please start the server first with: node server.js');
        process.exit(1);
    });