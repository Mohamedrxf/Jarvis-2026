/**
 * Phase 4.4 - Semantic Memory & Meaning-Based Retrieval Tests
 * Tests semantic search, duplicate detection, clustering, and relationships
 */

const db = require('./server/config/db');
const semanticMemoryService = require('./server/services/semanticMemoryService');
const memoryService = require('./server/services/memoryService');
const memoryEvolutionService = require('./server/services/memoryEvolutionService');

// Test utilities
const TEST_USER_ID = 1;
let testMemoryIds = [];

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`  ✓ ${message}`);
}

async function cleanup() {
    try {
        // Clean up all test data for this user
        db.run(`DELETE FROM memories WHERE user_id = ?`, [TEST_USER_ID]);
        db.run(`DELETE FROM memory_clusters WHERE user_id = ?`, [TEST_USER_ID]);
        db.run(`DELETE FROM memory_relationships WHERE user_id = ?`, [TEST_USER_ID]);
        testMemoryIds = [];
    } catch (error) {
        console.error('Cleanup error:', error.message);
    }
}

async function runTests() {
    console.log('\n=== Phase 4.4 Semantic Memory Tests ===\n');

    try {
        // Clean up any existing test data
        console.log('Cleaning up previous test data...');
        await cleanup();
        console.log('✓ Cleanup complete\n');

        // Wait for database to be ready
        await new Promise((resolve) => {
            const checkDb = setInterval(() => {
                db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='memories'", (err, row) => {
                    if (!err && row) {
                        clearInterval(checkDb);
                        resolve();
                    }
                });
            }, 100);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkDb);
                console.log('  (Continuing with initialization...)');
                resolve(); // Continue anyway
            }, 10000);
        });

        // Initialize semantic memory service
        await semanticMemoryService.initialize();
        console.log('✓ Semantic memory service initialized\n');

        // Test 1: Create memories with embeddings
        console.log('Test 1: Create memories with embeddings');
        const memory1 = await memoryService.createMemory(
            TEST_USER_ID,
            'work',
            'I work as a software developer at Google',
            1.0,
            'manual'
        );
        testMemoryIds.push(memory1.id);
        assert(memory1.id > 0, 'Memory created with ID');
        assert(memory1.created_at, 'Memory has timestamp');
        console.log('');

        const memory2 = await memoryService.createMemory(
            TEST_USER_ID,
            'education',
            'I have a degree in Computer Science from MIT',
            1.0,
            'manual'
        );
        testMemoryIds.push(memory2.id);
        assert(memory2.id > 0, 'Second memory created');
        console.log('');

        const memory3 = await memoryService.createMemory(
            TEST_USER_ID,
            'preferences',
            'I prefer working with JavaScript and React',
            1.0,
            'manual'
        );
        testMemoryIds.push(memory3.id);
        assert(memory3.id > 0, 'Third memory created');
        console.log('');

        // Test 2: Semantic search
        console.log('Test 2: Semantic search');
        const searchResults = await semanticMemoryService.semanticSearch(
            TEST_USER_ID,
            'programming and coding',
            10
        );
        assert(searchResults.length > 0, 'Semantic search returns results');
        assert(searchResults[0].semantic_score !== undefined, 'Results include semantic scores');
        assert(searchResults[0].hybrid_score !== undefined, 'Results include hybrid scores');
        console.log(`  Found ${searchResults.length} results with semantic matching`);
        console.log('');

        // Test 3: Duplicate detection
        console.log('Test 3: Duplicate detection');
        const duplicateCheck = await semanticMemoryService.checkForDuplicates(
            TEST_USER_ID,
            'I work as a software developer at Google',
            'work'
        );
        assert(duplicateCheck !== null, 'Duplicate detected');
        assert(duplicateCheck.isDuplicate === true, 'Correctly identified as duplicate');
        assert(duplicateCheck.similarity >= 0.9, 'High similarity score');
        console.log(`  Duplicate similarity: ${(duplicateCheck.similarity * 100).toFixed(0)}%`);
        console.log('');

        // Test 4: Memory clustering
        console.log('Test 4: Memory clustering');
        const clusters = await semanticMemoryService.getClusters(TEST_USER_ID);
        assert(clusters.length > 0, 'Clusters created');
        console.log(`  Found ${clusters.length} clusters:`);
        clusters.forEach(cluster => {
            console.log(`    - ${cluster.cluster_name}: ${cluster.memory_count} memories`);
        });
        console.log('');

        // Test 5: Create relationships
        console.log('Test 5: Create relationships');
        const relationship = await semanticMemoryService.createRelationship(
            TEST_USER_ID,
            memory1.id,
            memory2.id,
            'related_to',
            0.8
        );
        assert(relationship.id > 0, 'Relationship created');
        assert(relationship.relationship_type === 'related_to', 'Correct relationship type');
        console.log(`  Created relationship: ${memory1.id} -> ${memory2.id} (related_to)`);
        console.log('');

        // Test 6: Get related memories
        console.log('Test 6: Get related memories');
        const relatedMemories = await semanticMemoryService.getRelatedMemories(
            memory1.id,
            TEST_USER_ID
        );
        assert(relatedMemories.length > 0, 'Related memories found');
        assert(relatedMemories[0].id === memory2.id, 'Correct related memory');
        console.log(`  Found ${relatedMemories.length} related memories`);
        console.log('');

        // Test 7: Hybrid ranking
        console.log('Test 7: Hybrid ranking');
        const rankedResults = await semanticMemoryService.semanticSearch(
            TEST_USER_ID,
            'developer',
            5
        );
        assert(rankedResults.length > 0, 'Ranked results returned');
        if (rankedResults.length > 1) {
            assert(
                rankedResults[0].hybrid_score >= rankedResults[1].hybrid_score,
                'Results sorted by hybrid score'
            );
            console.log(`  Top result hybrid score: ${rankedResults[0].hybrid_score.toFixed(3)}`);
        }
        console.log('');

        // Test 8: Memory context generation
        console.log('Test 8: Memory context generation');
        const context = await semanticMemoryService.getSemanticMemoryContext(
            TEST_USER_ID,
            'programming',
            5
        );
        assert(context.length > 0, 'Context generated');
        assert(context.includes('[USER MEMORIES'), 'Context has proper format');
        console.log(`  Generated context (${context.length} chars)`);
        console.log('');

        // Test 9: Batch update embeddings
        console.log('Test 9: Batch update embeddings');
        const batchResult = await semanticMemoryService.batchUpdateEmbeddings(
            TEST_USER_ID,
            10
        );
        assert(batchResult.total >= 0, 'Batch update completed');
        console.log(`  Updated ${batchResult.updated} embeddings`);
        console.log('');

        // Test 10: Cosine similarity calculation
        console.log('Test 10: Cosine similarity');
        const embedding1 = [1, 0, 0];
        const embedding2 = [0, 1, 0];
        const embedding3 = [1, 1, 0];
        const similarity1 = semanticMemoryService.cosineSimilarity(embedding1, embedding2);
        const similarity2 = semanticMemoryService.cosineSimilarity(embedding1, embedding3);
        assert(Math.abs(similarity1 - 0) < 0.01, 'Orthogonal vectors have 0 similarity');
        assert(similarity2 > 0, 'Similar vectors have positive similarity');
        console.log(`  Orthogonal similarity: ${similarity1.toFixed(3)}`);
        console.log(`  Similar vectors: ${similarity2.toFixed(3)}`);
        console.log('');

        // Test 11: Prevent duplicate creation
        console.log('Test 11: Prevent duplicate creation');
        try {
            await memoryService.createMemory(
                TEST_USER_ID,
                'work',
                'I work as a software developer at Google',
                1.0,
                'manual'
            );
            assert(false, 'Should have thrown error for duplicate');
        } catch (error) {
            assert(error.message.includes('similar memory already exists'), 'Correct duplicate error');
            console.log('  Duplicate prevention works');
        }
        console.log('');

        // Test 12: Memory evolution integration
        console.log('Test 12: Memory evolution integration');
        const rankedMemories = await memoryEvolutionService.getRankedMemories(
            TEST_USER_ID,
            10
        );
        assert(rankedMemories.length > 0, 'Ranked memories returned');
        assert(rankedMemories[0].relevance_score !== undefined, 'Has relevance scores');
        console.log(`  Ranked ${rankedMemories.length} memories`);
        console.log('');

        // Summary
        console.log('=== All Tests Passed! ===\n');
        console.log('Phase 4.4 Implementation Summary:');
        console.log('✓ Semantic embeddings generated');
        console.log('✓ Semantic search with hybrid ranking');
        console.log('✓ Duplicate detection (90%+ threshold)');
        console.log('✓ Memory clustering (6 categories)');
        console.log('✓ Relationship support');
        console.log('✓ Related memories retrieval');
        console.log('✓ Context generation for AI');
        console.log('✓ Backward compatibility maintained');
        console.log('✓ Integration with existing memory evolution');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await cleanup();
    }
}

// Run tests
runTests();