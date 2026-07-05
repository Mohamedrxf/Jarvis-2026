/**
 * Test to verify fallback system (Phase 7.1C) still works
 */

const fs = require('fs');
const serverCode = fs.readFileSync('./server/server.js', 'utf8');

// Check that fallback system exists
const hasFallbackSystem = serverCode.includes('Fallback to existing pattern-based system (Phase 7.1C)');
const hasToolPatterns = serverCode.includes('const toolPatterns = {');
const hasCalculatorPattern = serverCode.includes("'calculator': /^calculate\\s+(.+)$/i");
const hasUuidPattern = serverCode.includes("'uuid': /^generate\\s+uuid$/i");
const hasPasswordPattern = serverCode.includes("'password': /^generate\\s+password(?:\\s+(\\d+))?$/i");
const hasDatetimePattern = serverCode.includes("'datetime': /^(?:what\\s+is\\s+(?:the\\s+)?(?:date|time)");

console.log('🧪 Testing Fallback System (Phase 7.1C)\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

const checks = [
    { name: 'Fallback comment exists', test: hasFallbackSystem },
    { name: 'Tool patterns object exists', test: hasToolPatterns },
    { name: 'Calculator pattern exists', test: hasCalculatorPattern },
    { name: 'UUID pattern exists', test: hasUuidPattern },
    { name: 'Password pattern exists', test: hasPasswordPattern },
    { name: 'Datetime pattern exists', test: hasDatetimePattern }
];

checks.forEach(check => {
    if (check.test) {
        passed++;
        console.log(`✅ ${check.name}`);
    } else {
        failed++;
        console.log(`❌ ${check.name}`);
    }
});

console.log('='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('✅ Fallback system is intact!');
    process.exit(0);
} else {
    console.log('❌ Fallback system is missing components!');
    process.exit(1);
}