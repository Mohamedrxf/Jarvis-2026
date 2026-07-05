const agentService = require('./server/services/agentService');

console.log('=== Debug Routing ===\n');

const testMessages = [
    'remember my name is John',
    'hello, how are you?',
    'upload my file',
    'show my files'
];

testMessages.forEach(message => {
    const result = agentService.analyzeRequest(message);
    console.log(`Message: "${message}"`);
    console.log(`  Route: ${result.route}`);
    console.log(`  Target: ${result.target}`);
    console.log(`  Confidence: ${result.confidence}`);
    console.log(`  Reason: ${result.reason}`);
    console.log('');
});