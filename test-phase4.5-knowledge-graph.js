/**
 * Phase 4.5A - Knowledge Graph Foundation Test Suite
 * 
 * Tests:
 * - Relationship creation
 * - Relationship deletion
 * - Relationship retrieval
 * - Automatic relationship generation
 * - Database integrity
 * - API endpoints
 */

const db = require('./server/config/db');
const knowledgeGraphService = require('./server/services/knowledgeGraphService');
const memoryService = require('./server/services/memoryService');

// Test utilities
let testUserId = 1;
let testMemory1Id = null;
let testMemory2Id = null;
let testMemory3Id = null;
let testEdgeId = null;

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function assert(condition, testName) {
    if (condition) {
        log(`✓ ${testName}`, 'green');
        return true;
    } else {
        log(`✗ ${testName}`, 'red');
        return false;
    }
}

async function runTests() {
    log('\n========================================', 'blue');
    log('Phase 4.5A - Knowledge Graph Foundation Tests', 'blue');
    log('========================================\n', 'blue');

    let passed = 0;
    let failed = 0;

    // Test 1: Database Schema
    log('1. Database Schema Tests', 'yellow');

    try {
        const tableCheck = await new Promise((resolve, reject) => {
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='knowledge_edges'", (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (assert(tableCheck !== undefined, 'knowledge_edges table exists')) passed++; else failed++;

        const indexCheck = await new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_knowledge_edges%'", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (assert(indexCheck.length >= 3, 'knowledge_edges indexes created (3 indexes)')) passed++; else failed++;
    } catch (error) {
        log(`Database schema test failed: ${error.message}`, 'red');
        failed++;
    }

    // Test 2: Create Test Memories
    log('\n2. Create Test Memories', 'yellow');

    try {
        const memory1 = await memoryService.createMemory(testUserId, 'education', 'JavaScript programming language', 0.9, 'manual');
        testMemory1Id = memory1.id;
        if (assert(testMemory1Id !== null, 'Created test memory 1 (JavaScript)')) passed++; else failed++;

        const memory2 = await memoryService.createMemory(testUserId, 'work', 'React frontend framework', 0.9, 'manual');
        testMemory2Id = memory2.id;
        if (assert(testMemory2Id !== null, 'Created test memory 2 (React)')) passed++; else failed++;

        const memory3 = await memoryService.createMemory(testUserId, 'education', 'Python programming language', 0.9, 'manual');
        testMemory3Id = memory3.id;
        if (assert(testMemory3Id !== null, 'Created test memory 3 (Python)')) passed++; else failed++;
    } catch (error) {
        log(`Failed to create test memories: ${error.message}`, 'red');
        failed++;
    }

    // Test 3: Create Knowledge Edge
    log('\n3. Relationship Creation Tests', 'yellow');

    try {
        const edge = await knowledgeGraphService.createEdge(
            testMemory1Id,
            testMemory2Id,
            'related_to',
            0.85
        );
        testEdgeId = edge.id;

        if (assert(testEdgeId !== null, 'Created knowledge edge')) passed++; else failed++;
        if (assert(edge.relation_type === 'related_to', 'Edge has correct relation_type')) passed++; else failed++;
        if (assert(edge.confidence === 0.85, 'Edge has correct confidence')) passed++; else failed++;
        if (assert(edge.source_memory_id === testMemory1Id, 'Edge has correct source_memory_id')) passed++; else failed++;
        if (assert(edge.target_memory_id === testMemory2Id, 'Edge has correct target_memory_id')) passed++; else failed++;
    } catch (error) {
        log(`Failed to create knowledge edge: ${error.message}`, 'red');
        failed++;
    }

    // Test 4: Create Multiple Relationships
    log('\n4. Multiple Relationship Tests', 'yellow');

    try {
        const edge2 = await knowledgeGraphService.createEdge(
            testMemory1Id,
            testMemory3Id,
            'similar_to',
            0.75
        );

        if (assert(edge2.id !== null, 'Created second knowledge edge')) passed++; else failed++;
        if (assert(edge2.relation_type === 'similar_to', 'Second edge has correct relation_type')) passed++; else failed++;
    } catch (error) {
        log(`Failed to create second edge: ${error.message}`, 'red');
        failed++;
    }

    // Test 5: Get Relationships
    log('\n5. Relationship Retrieval Tests', 'yellow');

    try {
        const relationships = await knowledgeGraphService.getRelationships(testMemory1Id, 'both', null);

        if (assert(relationships.length >= 2, `Retrieved relationships (found ${relationships.length})`)) passed++; else failed++;
        if (assert(relationships[0].related_memory !== undefined, 'Relationships include related_memory data')) passed++; else failed++;
        if (assert(relationships[0].direction !== undefined, 'Relationships include direction')) passed++; else failed++;
    } catch (error) {
        log(`Failed to get relationships: ${error.message}`, 'red');
        failed++;
    }

    // Test 6: Get Related Memories
    log('\n6. Related Memories Retrieval Tests', 'yellow');

    try {
        const relatedMemories = await knowledgeGraphService.getRelatedMemories(testMemory1Id, null);

        if (assert(relatedMemories.length >= 2, `Retrieved related memories (found ${relatedMemories.length})`)) passed++; else failed++;
        if (assert(relatedMemories[0].relationship_type !== undefined, 'Related memories include relationship_type')) passed++; else failed++;
    } catch (error) {
        log(`Failed to get related memories: ${error.message}`, 'red');
        failed++;
    }

    // Test 7: Update Edge
    log('\n7. Relationship Update Tests', 'yellow');

    try {
        const updatedEdge = await knowledgeGraphService.updateEdge(testEdgeId, {
            confidence: 0.95,
            relation_type: 'similar_to'
        });

        if (assert(updatedEdge.confidence === 0.95, 'Updated edge confidence')) passed++; else failed++;
        if (assert(updatedEdge.relation_type === 'similar_to', 'Updated edge relation_type')) passed++; else failed++;
    } catch (error) {
        log(`Failed to update edge: ${error.message}`, 'red');
        failed++;
    }

    // Test 8: Get Graph Stats
    log('\n8. Graph Statistics Tests', 'yellow');

    try {
        const stats = await knowledgeGraphService.getGraphStats(testUserId);

        if (assert(stats.total_edges >= 2, `Graph has edges (${stats.total_edges})`)) passed++; else failed++;
        if (assert(stats.memories_with_relationships >= 1, `Memories with relationships (${stats.memories_with_relationships})`)) passed++; else failed++;
        if (assert(stats.edges_by_type.length > 0, 'Graph has edges_by_type data')) passed++; else failed++;
    } catch (error) {
        log(`Failed to get graph stats: ${error.message}`, 'red');
        failed++;
    }

    // Test 9: Automatic Relationship Building
    log('\n9. Automatic Relationship Building Tests', 'yellow');

    try {
        const autoRelationships = await knowledgeGraphService.buildAutomaticRelationships(
            testUserId,
            testMemory2Id,
            0.70
        );

        if (assert(Array.isArray(autoRelationships), 'Automatic relationships returned as array')) passed++; else failed++;
        log(`  Created ${autoRelationships.length} automatic relationships for memory ${testMemory2Id}`, 'blue');
    } catch (error) {
        log(`Failed to build automatic relationships: ${error.message}`, 'red');
        failed++;
    }

    // Test 10: Delete Edge
    log('\n10. Relationship Deletion Tests', 'yellow');

    try {
        const deleteResult = await knowledgeGraphService.deleteEdge(testEdgeId);

        if (assert(deleteResult === true, 'Deleted knowledge edge successfully')) passed++; else failed++;

        // Verify deletion
        const relationshipsAfterDelete = await knowledgeGraphService.getRelationships(testMemory1Id, 'both', null);
        if (assert(relationshipsAfterDelete.length < 2, 'Edge actually deleted from database')) passed++; else failed++;
    } catch (error) {
        log(`Failed to delete edge: ${error.message}`, 'red');
        failed++;
    }

    // Test 11: Delete Edges for Memory
    log('\n11. Cascade Delete Tests', 'yellow');

    try {
        const cascadeResult = await knowledgeGraphService.deleteEdgesForMemory(testMemory1Id);

        if (assert(cascadeResult === true, 'Deleted all edges for memory')) passed++; else failed++;

        const remainingRelationships = await knowledgeGraphService.getRelationships(testMemory1Id, 'both', null);
        if (assert(remainingRelationships.length === 0, 'No relationships remain after cascade delete')) passed++; else failed++;
    } catch (error) {
        log(`Failed to cascade delete: ${error.message}`, 'red');
        failed++;
    }

    // Test 12: Relation Type Validation
    log('\n12. Relation Type Validation Tests', 'yellow');

    try {
        const validTypes = knowledgeGraphService.getRelationTypes();
        if (assert(validTypes.length === 7, `Has 7 relation types (found ${validTypes.length})`)) passed++; else failed++;

        const isValid = knowledgeGraphService.isValidRelationType('related_to');
        if (assert(isValid === true, 'Validates correct relation type')) passed++; else failed++;

        const isInvalid = knowledgeGraphService.isValidRelationType('invalid_type');
        if (assert(isInvalid === false, 'Rejects invalid relation type')) passed++; else failed++;
    } catch (error) {
        log(`Failed relation type validation: ${error.message}`, 'red');
        failed++;
    }

    // Cleanup
    log('\n13. Cleanup Test Data', 'yellow');

    try {
        if (testMemory1Id) await memoryService.deleteMemory(testMemory1Id, testUserId);
        if (testMemory2Id) await memoryService.deleteMemory(testMemory2Id, testUserId);
        if (testMemory3Id) await memoryService.deleteMemory(testMemory3Id, testUserId);
        log('Test memories deleted', 'green');
    } catch (error) {
        log(`Cleanup failed: ${error.message}`, 'red');
    }

    // Summary
    log('\n========================================', 'blue');
    log('Test Summary', 'blue');
    log('========================================', 'blue');
    log(`Total Tests: ${passed + failed}`, 'yellow');
    log(`Passed: ${passed}`, 'green');
    log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, failed > 0 ? 'yellow' : 'green');
    log('========================================\n', 'blue');

    return failed === 0;
}

// Run tests
runTests()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        log(`Test suite failed: ${error.message}`, 'red');
        process.exit(1);
    });