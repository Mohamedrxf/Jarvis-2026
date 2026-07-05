/**
 * Test Web Search Tool - Phase 7.1C Step 1
 * Tests the mock web search tool functionality
 */

const toolRegistry = require('./server/services/toolRegistry');

console.log('=== Web Search Tool Tests ===\n');

// Test 1: Verify tool registration
console.log('Test 1: Verify tool registration');
const tools = toolRegistry.listTools();
const webSearchRegistered = tools.includes('web_search');
console.log(`  web_search tool registered: ${webSearchRegistered ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  Total tools available: ${tools.length}`);
console.log(`  Tools: ${tools.join(', ')}\n`);

// Test 2: Get tool handler
console.log('Test 2: Get tool handler');
const webSearchTool = toolRegistry.getTool('web_search');
console.log(`  Tool handler exists: ${webSearchTool ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 3: Test weather query
console.log('Test 3: Test weather query');
const weatherResult = webSearchTool({ query: 'weather forecast' });
console.log(`  Query: "weather forecast"`);
console.log(`  Success: ${weatherResult.result ? '✓ PASS' : '✗ FAIL'}`);
if (weatherResult.result) {
    console.log(`  Results count: ${weatherResult.result.results.length}`);
    console.log(`  First result title: "${weatherResult.result.results[0].title}"`);
    console.log(`  Query preserved: ${weatherResult.result.query === 'weather forecast' ? '✓' : '✗'}`);
}
console.log('');

// Test 4: Test javascript query
console.log('Test 4: Test javascript query');
const jsResult = webSearchTool({ query: 'javascript tutorial' });
console.log(`  Query: "javascript tutorial"`);
console.log(`  Success: ${jsResult.result ? '✓ PASS' : '✗ FAIL'}`);
if (jsResult.result) {
    console.log(`  Results count: ${jsResult.result.results.length}`);
    console.log(`  First result title: "${jsResult.result.results[0].title}"`);
}
console.log('');

// Test 5: Test AI query
console.log('Test 5: Test AI query');
const aiResult = webSearchTool({ query: 'ai tools' });
console.log(`  Query: "ai tools"`);
console.log(`  Success: ${aiResult.result ? '✓ PASS' : '✗ FAIL'}`);
if (aiResult.result) {
    console.log(`  Results count: ${aiResult.result.results.length}`);
    console.log(`  First result title: "${aiResult.result.results[0].title}"`);
}
console.log('');

// Test 6: Test news query
console.log('Test 6: Test news query');
const newsResult = webSearchTool({ query: 'latest news' });
console.log(`  Query: "latest news"`);
console.log(`  Success: ${newsResult.result ? '✓ PASS' : '✗ FAIL'}`);
if (newsResult.result) {
    console.log(`  Results count: ${newsResult.result.results.length}`);
    console.log(`  First result title: "${newsResult.result.results[0].title}"`);
}
console.log('');

// Test 7: Test default/fallback query
console.log('Test 7: Test default/fallback query');
const defaultResult = webSearchTool({ query: 'random search term' });
console.log(`  Query: "random search term"`);
console.log(`  Success: ${defaultResult.result ? '✓ PASS' : '✗ FAIL'}`);
if (defaultResult.result) {
    console.log(`  Results count: ${defaultResult.result.results.length}`);
    console.log(`  First result title: "${defaultResult.result.results[0].title}"`);
}
console.log('');

// Test 8: Test missing query parameter
console.log('Test 8: Test missing query parameter');
const missingQueryResult = webSearchTool({});
console.log(`  Input: {}`);
console.log(`  Error returned: ${missingQueryResult.error ? '✓ PASS' : '✗ FAIL'}`);
if (missingQueryResult.error) {
    console.log(`  Error message: "${missingQueryResult.error}"`);
}
console.log('');

// Test 9: Test empty query
console.log('Test 9: Test empty query');
const emptyQueryResult = webSearchTool({ query: '   ' });
console.log(`  Input: { query: "   " }`);
console.log(`  Error returned: ${emptyQueryResult.error ? '✓ PASS' : '✗ FAIL'}`);
if (emptyQueryResult.error) {
    console.log(`  Error message: "${emptyQueryResult.error}"`);
}
console.log('');

// Test 10: Test output format
console.log('Test 10: Test output format');
const formatResult = webSearchTool({ query: 'test query' });
const hasCorrectFormat = formatResult.result &&
    formatResult.result.query &&
    Array.isArray(formatResult.result.results) &&
    formatResult.result.results.length > 0 &&
    formatResult.result.results[0].title &&
    formatResult.result.results[0].snippet &&
    formatResult.result.results[0].url;
console.log(`  Has result object: ${formatResult.result ? '✓' : '✗'}`);
console.log(`  Has query field: ${formatResult.result?.query ? '✓' : '✗'}`);
console.log(`  Has results array: ${Array.isArray(formatResult.result?.results) ? '✓' : '✗'}`);
console.log(`  Results have title: ${formatResult.result?.results[0]?.title ? '✓' : '✗'}`);
console.log(`  Results have snippet: ${formatResult.result?.results[0]?.snippet ? '✓' : '✗'}`);
console.log(`  Results have url: ${formatResult.result?.results[0]?.url ? '✓' : '✗'}`);
console.log(`  Overall format: ${hasCorrectFormat ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test 11: Test case insensitivity
console.log('Test 11: Test case insensitivity');
const upperCaseResult = webSearchTool({ query: 'WEATHER' });
const lowerCaseResult = webSearchTool({ query: 'weather' });
const mixedCaseResult = webSearchTool({ query: 'WeAtHeR' });
const allWeather = upperCaseResult.result && lowerCaseResult.result && mixedCaseResult.result;
const sameResults = allWeather &&
    upperCaseResult.result.results.length === lowerCaseResult.result.results.length &&
    lowerCaseResult.result.results.length === mixedCaseResult.result.results.length;
console.log(`  All queries return results: ${allWeather ? '✓' : '✗'}`);
console.log(`  Same number of results: ${sameResults ? '✓' : '✗'}`);
console.log(`  Case insensitive: ${sameResults ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test 12: Test JS abbreviation
console.log('Test 12: Test JS abbreviation');
const jsAbbrResult = webSearchTool({ query: 'js programming' });
console.log(`  Query: "js programming"`);
console.log(`  Returns JS results: ${jsAbbrResult.result && jsAbbrResult.result.results[0].title.includes('JavaScript') ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Summary
console.log('=== Test Summary ===');
const allTests = [
    { name: 'Tool registration', passed: webSearchRegistered },
    { name: 'Tool handler exists', passed: webSearchTool },
    { name: 'Weather query', passed: !!weatherResult.result },
    { name: 'JavaScript query', passed: !!jsResult.result },
    { name: 'AI query', passed: !!aiResult.result },
    { name: 'News query', passed: !!newsResult.result },
    { name: 'Default query', passed: !!defaultResult.result },
    { name: 'Missing query error', passed: !!missingQueryResult.error },
    { name: 'Empty query error', passed: !!emptyQueryResult.error },
    { name: 'Output format', passed: hasCorrectFormat },
    { name: 'Case insensitivity', passed: sameResults },
    { name: 'JS abbreviation', passed: jsAbbrResult.result && jsAbbrResult.result.results[0].title.includes('JavaScript') }
];

const passedTests = allTests.filter(t => t.passed).length;
const totalTests = allTests.length;

console.log(`Tests Passed: ${passedTests}/${totalTests}`);
allTests.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test.name}: ${test.passed ? '✓' : '✗'}`);
});
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
    console.log('\n✓ All tests passed! Web search tool is working correctly.');
    process.exit(0);
} else {
    console.log('\n✗ Some tests failed. Please review the implementation.');
    process.exit(1);
}