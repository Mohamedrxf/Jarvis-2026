/**
 * Test script for Phase 4.1 Memory System
 * Run this while the server is running on port 5000
 */

const BASE_URL = 'http://localhost:5000/api';

// Test credentials (you'll need to register/login first)
let testToken = null;
let testUserId = null;

async function testMemorySystem() {
    console.log('=== Phase 4.1 Memory System Tests ===\n');

    // Step 1: Register a test user
    console.log('1. Testing User Registration...');
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;

    try {
        const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `testuser${timestamp}`,
                email: testEmail,
                password: 'test123456'
            })
        });

        const registerData = await registerResponse.json();
        if (registerData.success) {
            testToken = registerData.token;
            testUserId = registerData.user.id;
            console.log('✓ User registered successfully');
            console.log(`  User ID: ${testUserId}\n`);
        } else {
            console.log('  Registration info:', registerData.error);
            console.log('  Attempting login with new credentials...\n');
            // Try with the new email anyway
            await loginUser(testEmail);
        }
    } catch (error) {
        console.error('✗ Registration failed:', error.message);
        await loginUser(testEmail);
    }

    // Step 2: Test Memory CRUD
    console.log('2. Testing Memory CRUD Operations...');

    // Create memory
    console.log('  a) Creating memory...');
    try {
        const createResponse = await fetch(`${BASE_URL}/memories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testToken}`
            },
            body: JSON.stringify({
                category: 'identity',
                content: 'My name is John Doe',
                confidence: 0.95,
                source: 'manual'
            })
        });

        const createData = await createResponse.json();
        if (createData.success) {
            console.log('  ✓ Memory created:', createData.memory.content);
            const memoryId = createData.memory.id;

            // Get all memories
            console.log('  b) Fetching all memories...');
            const getResponse = await fetch(`${BASE_URL}/memories`, {
                headers: { 'Authorization': `Bearer ${testToken}` }
            });
            const getData = await getResponse.json();
            console.log(`  ✓ Found ${getData.memories.length} memories`);

            // Update memory
            console.log('  c) Updating memory...');
            const updateResponse = await fetch(`${BASE_URL}/memories/${memoryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${testToken}`
                },
                body: JSON.stringify({
                    content: 'My name is John Smith',
                    confidence: 0.9
                })
            });
            const updateData = await updateResponse.json();
            console.log('  ✓ Memory updated:', updateData.memory.content);

            // Delete memory
            console.log('  d) Deleting memory...');
            const deleteResponse = await fetch(`${BASE_URL}/memories/${memoryId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${testToken}` }
            });
            const deleteData = await deleteResponse.json();
            console.log('  ✓ Memory deleted:', deleteData.message);
        } else {
            throw new Error(createData.error);
        }
    } catch (error) {
        console.error('  ✗ Memory CRUD failed:', error.message);
    }

    // Step 3: Test Memory Extraction
    console.log('\n3. Testing Memory Extraction...');
    try {
        const extractResponse = await fetch(`${BASE_URL}/memories/extract`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testToken}`
            },
            body: JSON.stringify({
                message: 'My name is Alice and I work at Google. I love programming and my favorite food is pizza.'
            })
        });

        const extractData = await extractResponse.json();
        if (extractData.success) {
            console.log(`  ✓ Extracted ${extractData.saved} memories:`);
            extractData.memories.forEach((m, i) => {
                console.log(`    ${i + 1}. [${m.category}] ${m.content} (${(m.confidence * 100).toFixed(0)}%)`);
            });
        } else {
            throw new Error(extractData.error);
        }
    } catch (error) {
        console.error('  ✗ Extraction failed:', error.message);
    }

    // Step 4: Test Memory Search
    console.log('\n4. Testing Memory Search...');
    try {
        const searchResponse = await fetch(`${BASE_URL}/memories/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testToken}`
            },
            body: JSON.stringify({
                query: 'Google'
            })
        });

        const searchData = await searchResponse.json();
        if (searchData.success) {
            console.log(`  ✓ Found ${searchData.count} memories matching "Google"`);
        } else {
            throw new Error(searchData.error);
        }
    } catch (error) {
        console.error('  ✗ Search failed:', error.message);
    }

    // Step 5: Test Memory Stats
    console.log('\n5. Testing Memory Statistics...');
    try {
        const statsResponse = await fetch(`${BASE_URL}/memories/stats`, {
            headers: { 'Authorization': `Bearer ${testToken}` }
        });

        const statsData = await statsResponse.json();
        if (statsData.success) {
            console.log('  ✓ Memory Statistics:');
            console.log(`    Total: ${statsData.stats.total}`);
            console.log(`    Categories: ${Object.keys(statsData.stats.byCategory).length}`);
            console.log(`    Avg Confidence: ${(statsData.stats.averageConfidence * 100).toFixed(0)}%`);
        } else {
            throw new Error(statsData.error);
        }
    } catch (error) {
        console.error('  ✗ Stats failed:', error.message);
    }

    // Step 6: Test Memory Injection in Chat
    console.log('\n6. Testing Memory Injection in Chat...');
    try {
        // First create a memory
        await fetch(`${BASE_URL}/memories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testToken}`
            },
            body: JSON.stringify({
                category: 'preferences',
                content: 'I love pizza',
                confidence: 0.9,
                source: 'manual'
            })
        });

        // Send a chat message
        const chatResponse = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testToken}`
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'What is my favorite food?' }
                ]
            })
        });

        const chatData = await chatResponse.json();
        if (chatData.success) {
            console.log('  ✓ Chat with memory injection successful');
            console.log(`  Response: ${chatData.response.content.substring(0, 100)}...`);
        } else {
            throw new Error(chatData.error);
        }
    } catch (error) {
        console.error('  ✗ Memory injection failed:', error.message);
    }

    console.log('\n=== All Tests Completed ===');
}

async function loginUser(email) {
    const loginEmail = email || 'test@example.com';
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: loginEmail,
            password: 'test123456'
        })
    });

    const loginData = await loginResponse.json();
    if (loginData.success) {
        testToken = loginData.token;
        testUserId = loginData.user.id;
        console.log('✓ User logged in successfully\n');
    } else {
        throw new Error(loginData.error);
    }
}

// Run tests
testMemorySystem().catch(error => {
    console.error('\n✗ Test suite failed:', error.message);
    process.exit(1);
});