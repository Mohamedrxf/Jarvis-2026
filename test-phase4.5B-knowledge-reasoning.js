/**
 * Phase 4.5B - Knowledge Reasoning Foundation Tests
 * 
 * Tests for:
 * - Graph traversal (getConnectedMemories)
 * - Context summary generation (buildContextSummary)
 * - Prompt enrichment (getEnrichedPromptContext)
 * - Backward compatibility
 * - No regressions
 */

const db = require('./server/config/db');
const knowledgeGraphService = require('./server/services/knowledgeGraphService');
const knowledgeReasoningService = require('./server/services/knowledgeReasoningService');
const memoryService = require('./server/services/memoryService');
const semanticMemoryService = require('./server/services/semanticMemoryService');

// Test utilities
const TEST_USER_ID = 999;
let testMemoryIds = [];

function logTest(testName, passed, message = '') {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${testName}${message ? ' - ' + message : ''}`);
    return passed;
}

async function cleanup() {
    try {
        // Clean up test memories
        for (const memoryId of testMemoryIds) {
            await new Promise((resolve) => {
                db.run('DELETE FROM memories WHERE id = ?', [memoryId], (err) => {
                    if (err) console.warn(`Cleanup warning for memory ${memoryId}:`, err.message);
                    resolve();
                });
            });
        }
        testMemoryIds = [];

        // Clean up any knowledge edges
        await new Promise((resolve) => {
            db.run('DELETE FROM knowledge_edges WHERE source_memory_id IN (?) OR target_memory_id IN (?)',
                [testMemoryIds.join(','), testMemoryIds.join(',')], (err) => {
                    if (err) console.warn('Cleanup warning for edges:', err.message);
                    resolve();
                });
        });
    } catch (error) {
        console.warn('Cleanup error:', error.message);
    }
}

async function createTestMemory(category, content) {
    try {
        const memory = await memoryService.createMemory(TEST_USER_ID, category, content, 1.0, 'test');
        testMemoryIds.push(memory.id);
        return memory;
    } catch (error) {
        console.error(`Failed to create test memory: ${error.message}`);
        return null;
    }
}

async function createTestRelationship(sourceId, targetId, relationType, confidence = 0.8) {
    try {
        const edge = await knowledgeGraphService.createEdge(sourceId, targetId, relationType, confidence);
        return edge;
    } catch (error) {
        console.warn(`Could not create relationship ${sourceId}->${targetId}: ${error.message}`);
        return null;
    }
}

// Test Suite
async function runTests() {
    console.log('\n========================================');
    console.log('Phase 4.5B - Knowledge Reasoning Tests');
    console.log('========================================\n');

    let passedTests = 0;
    let totalTests = 0;

    // Test 1: KnowledgeReasoningService exists and is instantiated
    totalTests++;
    if (logTest('KnowledgeReasoningService instantiation',
        knowledgeReasoningService !== null &&
        typeof knowledgeReasoningService.getReasoningContext === 'function')) {
        passedTests++;
    }

    // Test 2: Create test memories
    console.log('\n--- Setting up test data ---');
    const memory1 = await createTestMemory('work', 'I am a senior software engineer at TechCorp');
    const memory2 = await createTestMemory('work', 'I specialize in React and Node.js development');
    const memory3 = await createTestMemory('education', 'I have a degree in Computer Science');
    const memory4 = await createTestMemory('preferences', 'I prefer working with TypeScript');
    const memory5 = await createTestMemory('goals', 'I want to become a tech lead');

    if (!memory1 || !memory2 || !memory3 || !memory4 || !memory5) {
        console.error('Failed to create test memories. Aborting tests.');
        return;
    }

    console.log(`Created ${testMemoryIds.length} test memories`);

    // Test 3: Create test relationships
    console.log('\n--- Creating test relationships ---');
    await createTestRelationship(memory1.id, memory2.id, 'related_to', 0.9);
    await createTestRelationship(memory1.id, memory3.id, 'part_of', 0.8);
    await createTestRelationship(memory2.id, memory4.id, 'works_with', 0.7);
    await createTestRelationship(memory5.id, memory1.id, 'goal_of', 0.85);

    console.log('Created test relationships');

    // Test 4: Graph traversal - getConnectedMemories
    console.log('\n--- Testing Graph Traversal ---');
    totalTests++;
    try {
        const connected = await knowledgeGraphService.getConnectedMemories(memory1.id, 2);
        if (logTest('getConnectedMemories returns correct structure',
            connected.hasOwnProperty('connected_memories') &&
            connected.hasOwnProperty('total_count') &&
            connected.hasOwnProperty('max_depth_reached') &&
            connected.hasOwnProperty('traversal_stats'))) {
            passedTests++;
        }

        totalTests++;
        if (logTest('getConnectedMemories finds connected memories',
            connected.total_count > 0,
            `Found ${connected.total_count} connected memories`)) {
            passedTests++;
        }

        totalTests++;
        if (logTest('getConnectedMemories respects max depth',
            connected.max_depth_reached <= 2,
            `Max depth: ${connected.max_depth_reached}`)) {
            passedTests++;
        }

        totalTests++;
        if (logTest('getConnectedMemories includes traversal stats',
            connected.traversal_stats.hasOwnProperty('nodes_visited') &&
            connected.traversal_stats.hasOwnProperty('edges_traversed'))) {
            passedTests++;
        }
    } catch (error) {
        logTest('getConnectedMemories', false, error.message);
    }

    // Test 5: Context summary generation
    console.log('\n--- Testing Context Summary Generation ---');
    totalTests++;
    try {
        const summary = await knowledgeGraphService.buildContextSummary(memory1.id, 2, 10);

        if (logTest('buildContextSummary returns correct structure',
            summary.hasOwnProperty('memory_id') &&
            summary.hasOwnProperty('memory_content') &&
            summary.hasOwnProperty('memory_category') &&
            summary.hasOwnProperty('connected_count') &&
            summary.hasOwnProperty('sections') &&
            summary.hasOwnProperty('text_summary'))) {
            passedTests++;
        }

        totalTests++;
        if (logTest('buildContextSummary includes connected memories',
            summary.connected_count > 0,
            `Connected: ${summary.connected_count}`)) {
            passedTests++;
        }

        totalTests++;
        if (logTest('buildContextSummary generates text summary',
            summary.text_summary.length > 0,
            `Summary length: ${summary.text_summary.length} chars`)) {
            passedTests++;
        }

        totalTests++;
        if (logTest('buildContextSummary groups by relationship type',
            summary.sections.length > 0,
            `Sections: ${summary.sections.length}`)) {
            passedTests++;
        }
    } catch (error) {
        logTest('buildContextSummary', false, error.message);
    }

    // Test 6: KnowledgeReasoningService - getReasoningContext
    console.log('\n--- Testing Knowledge Reasoning ---');
    totalTests++;
    try {
        const context = await knowledgeReasoningService.getReasoningContext(memory1.id, {
            maxDepth: 2,
            maxMemories: 10
        });

        if (logTest('getReasoningContext returns correct structure',
            context.hasOwnProperty('memory_id') &&
            context.hasOwnProperty('memory') &&
            context.hasOwnProperty('connected_memories') &&
            context.hasOwnProperty('semantic_memories') &&
            context.hasOwnProperty('context_summary') &&
            context.hasOwnProperty('relevance_scores'))) {
            passedTests++;
        }

        totalTests++;
        if (logTest('getReasoningContext includes context summary',
            context.context_summary.length > 0,
            `Summary length: ${context.context_summary.length} chars`)) {
            passedTests++;
        }

        totalTests++;
        if (logTest('getReasoningContext includes relevance scores',
            Array.isArray(context.relevance_scores),
            `Scores count: ${context.relevance_scores.length}`)) {
            passedTests++;
        }
    } catch (error) {
        logTest('getReasoningContext', false, error.message);
    }

    // Test 7: Enriched prompt context
    console.log('\n--- Testing Prompt Enrichment ---');
    totalTests++;
    try {
        const enrichedContext = await knowledgeReasoningService.getEnrichedPromptContext(
            TEST_USER_ID,
            'software engineering',
            memory1.id
        );

        if (logTest('getEnrichedPromptContext returns string',
            typeof enrichedContext === 'string' && enrichedContext.length > 0,
            `Context length: ${enrichedContext.length} chars`)) {
            passedTests++;
        }

        totalTests++;
        if (logTest('getEnrichedPromptContext includes reasoning context',
            enrichedContext.includes('[REASONING CONTEXT]'),
            'Contains reasoning context marker')) {
            passedTests++;
        }

        totalTests++;
        if (logTest('getEnrichedPromptContext includes semantic context',
            enrichedContext.includes('[USER MEMORIES]'),
            'Contains semantic context marker')) {
            passedTests++;
        }
    } catch (error) {
        logTest('getEnrichedPromptContext', false, error.message);
    }

    // Test 8: Context preview
    console.log('\n--- Testing Context Preview ---');
    totalTests++;
    try {
        const preview = await knowledgeReasoningService.getContextPreview(memory1.id, 500);

        if (logTest('getContextPreview returns correct structure',
            preview.hasOwnProperty('preview') &&
            preview.hasOwnProperty('full_summary') &&
            preview.hasOwnProperty('connected_count'))) {
            passedTests++;
        }

        totalTests++;
        if (logTest('getContextPreview truncates long previews',
            preview.preview.length <= 500 || preview.preview.endsWith('...'),
            `Preview length: ${preview.preview.length}`)) {
            passedTests++;
        }
    } catch (error) {
        logTest('getContextPreview', false, error.message);
    }

    // Test 9: Connected memories count
    console.log('\n--- Testing Connected Memories Count ---');
    totalTests++;
    try {
        const countInfo = await knowledgeReasoningService.getConnectedMemoriesCount(memory1.id, 2);

        if (logTest('getConnectedMemoriesCount returns correct structure',
            countInfo.hasOwnProperty('count') &&
            countInfo.hasOwnProperty('max_depth') &&
            countInfo.hasOwnProperty('nodes_visited'))) {
            passedTests++;
        }

        totalTests++;
        if (logTest('getConnectedMemoriesCount returns valid count',
            countInfo.count >= 0 && typeof countInfo.count === 'number')) {
            passedTests++;
        }
    } catch (error) {
        logTest('getConnectedMemoriesCount', false, error.message);
    }

    // Test 10: Backward compatibility - existing methods still work
    console.log('\n--- Testing Backward Compatibility ---');
    totalTests++;
    try {
        const memories = await memoryService.getMemories(TEST_USER_ID);
        if (logTest('getMemories still works', Array.isArray(memories))) {
            passedTests++;
        }
    } catch (error) {
        logTest('getMemories backward compatibility', false, error.message);
    }

    totalTests++;
    try {
        const context = await memoryService.getMemoryContext(TEST_USER_ID, 'test');
        if (logTest('getMemoryContext still works', typeof context === 'string')) {
            passedTests++;
        }
    } catch (error) {
        logTest('getMemoryContext backward compatibility', false, error.message);
    }

    totalTests++;
    try {
        const relationships = await knowledgeGraphService.getRelationships(memory1.id, 'both');
        if (logTest('getRelationships still works', Array.isArray(relationships))) {
            passedTests++;
        }
    } catch (error) {
        logTest('getRelationships backward compatibility', false, error.message);
    }

    // Test 11: Edge cases
    console.log('\n--- Testing Edge Cases ---');
    totalTests++;
    try {
        await knowledgeGraphService.getConnectedMemories(99999, 2);
        logTest('getConnectedMemories handles non-existent memory', false, 'Should throw error');
    } catch (error) {
        if (logTest('getConnectedMemories handles non-existent memory', true, 'Correctly throws error')) {
            passedTests++;
        }
    }

    totalTests++;
    try {
        await knowledgeGraphService.buildContextSummary(99999, 2, 10);
        logTest('buildContextSummary handles non-existent memory', false, 'Should throw error');
    } catch (error) {
        if (logTest('buildContextSummary handles non-existent memory', true, 'Correctly throws error')) {
            passedTests++;
        }
    }

    // Test 12: Performance check
    console.log('\n--- Testing Performance ---');
    totalTests++;
    try {
        const startTime = Date.now();
        const connected = await knowledgeGraphService.getConnectedMemories(memory1.id, 2);
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (logTest('Graph traversal performance',
            duration < 1000,
            `Completed in ${duration}ms`)) {
            passedTests++;
        }
    } catch (error) {
        logTest('Graph traversal performance', false, error.message);
    }

    totalTests++;
    try {
        const startTime = Date.now();
        const context = await knowledgeReasoningService.getReasoningContext(memory1.id, {
            maxDepth: 2,
            maxMemories: 10
        });
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (logTest('Reasoning context performance',
            duration < 2000,
            `Completed in ${duration}ms`)) {
            passedTests++;
        }
    } catch (error) {
        logTest('Reasoning context performance', false, error.message);
    }

    // Cleanup
    console.log('\n--- Cleaning up test data ---');
    await cleanup();
    console.log('Cleanup complete\n');

    // Summary
    console.log('========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('========================================\n');

    return {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        successRate: (passedTests / totalTests) * 100
    };
}

// Run tests
runTests()
    .then(results => {
        console.log('Test execution completed.');
        process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });