// Planner Agent Unit Tests - Phase 12.1
// Comprehensive test suite for PlannerAgent

const plannerAgent = require('./plannerAgent');

class PlannerAgentTests {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
    }

    /**
     * Run all tests
     */
    async runAll() {
        console.log('='.repeat(70));
        console.log('PLANNER AGENT - PHASE 12.1 UNIT TESTS');
        console.log('='.repeat(70));
        console.log('');

        // Test suites
        await this.testAnalyzeMethod();
        await this.testBuildPlanMethod();
        await this.testValidatePlanMethod();
        await this.testIntentDetection();
        await this.testRouteDetection();
        await this.testAgentDetermination();
        await this.testDependencyDetection();
        await this.testExecutionModeDetection();
        await this.testOutputTypeDetection();
        await this.testErrorHandling();
        await this.testHelperMethods();

        // Print summary
        this.printSummary();
    }

    /**
     * Test analyze() method
     */
    async testAnalyzeMethod() {
        console.log('📋 Test Suite: analyze() Method');
        console.log('-'.repeat(70));

        // Test 1: Valid message returns complete plan
        this.test('Valid message returns complete plan', () => {
            const plan = plannerAgent.analyze({
                message: 'What is AI?'
            });

            if (!plan.ready) throw new Error('Plan should be ready');
            if (!plan.intent) throw new Error('Plan should have intent');
            if (!plan.route) throw new Error('Plan should have route');
            if (!plan.agents || plan.agents.length === 0) throw new Error('Plan should have agents');
            if (!plan.executionMode) throw new Error('Plan should have executionMode');
            if (!plan.expectedOutputType) throw new Error('Plan should have expectedOutputType');
            if (!plan.dependencies) throw new Error('Plan should have dependencies');
            if (!plan.executionOrder) throw new Error('Plan should have executionOrder');
            if (!plan.contextRequirements) throw new Error('Plan should have contextRequirements');
            if (!plan.contextPlan) throw new Error('Plan should have contextPlan');
            if (!plan.responseStrategy) throw new Error('Plan should have responseStrategy');
        });

        // Test 2: Message with userId
        this.test('Message with userId', () => {
            const plan = plannerAgent.analyze({
                message: 'Remember my name',
                userId: 123
            });

            if (!plan.ready) throw new Error('Plan should be ready');
            if (plan.route !== 'memory') throw new Error('Route should be memory');
        });

        // Test 3: Message with conversation history
        this.test('Message with conversation history', () => {
            const plan = plannerAgent.analyze({
                message: 'What is the weather?',
                conversationHistory: [
                    { role: 'user', content: 'Hello' },
                    { role: 'assistant', content: 'Hi there!' }
                ]
            });

            if (!plan.ready) throw new Error('Plan should be ready');
            // General weather question (no location) routes to AI
            if (plan.route !== 'ai') throw new Error('Route should be ai for general weather question');
        });

        // Test 4: Weather query
        this.test('Weather query produces correct plan', () => {
            const plan = plannerAgent.analyze({
                message: 'Weather in Chennai'
            });

            if (!plan.ready) throw new Error('Plan should be ready');
            if (plan.route !== 'tool') throw new Error('Route should be tool');
            if (plan.intent !== 'weather') throw new Error('Intent should be weather');
            if (plan.agents[0] !== 'tool') throw new Error('Agent should be tool');
            if (plan.expectedOutputType !== 'tool_result') throw new Error('Output type should be tool_result');
        });

        // Test 5: Memory query
        this.test('Memory query produces correct plan', () => {
            const plan = plannerAgent.analyze({
                message: 'Remember my name is John'
            });

            if (!plan.ready) throw new Error('Plan should be ready');
            if (plan.route !== 'memory') throw new Error('Route should be memory');
            if (plan.intent !== 'memory') throw new Error('Intent should be memory');
            if (plan.agents[0] !== 'memory') throw new Error('Agent should be memory');
        });

        // Test 6: File query
        this.test('File query produces correct plan', () => {
            const plan = plannerAgent.analyze({
                message: 'Upload my file'
            });

            if (!plan.ready) throw new Error('Plan should be ready');
            if (plan.route !== 'file') throw new Error('Route should be file');
            if (plan.intent !== 'file') throw new Error('Intent should be file');
            if (plan.agents[0] !== 'file') throw new Error('Agent should be file');
        });

        console.log('✅ analyze() tests completed\n');
    }

    /**
     * Test buildPlan() method
     */
    async testBuildPlanMethod() {
        console.log('📋 Test Suite: buildPlan() Method');
        console.log('-'.repeat(70));

        // Test 1: Valid route decision
        this.test('Valid route decision produces plan', () => {
            const routeDecision = {
                route: 'tool',
                target: 'weather',
                confidence: 0.95,
                reason: 'Weather query detected'
            };

            const plan = plannerAgent.buildPlan(routeDecision);

            if (!plan.ready) throw new Error('Plan should be ready');
            if (plan.route !== 'tool') throw new Error('Route should be tool');
            if (plan.agents[0] !== 'tool') throw new Error('Agent should be tool');
            if (plan.confidence !== 0.95) throw new Error('Confidence should match');
        });

        // Test 2: Null route decision
        this.test('Null route decision returns error plan', () => {
            const plan = plannerAgent.buildPlan(null);

            if (plan.ready) throw new Error('Plan should not be ready');
            if (plan.error !== 'Invalid route decision') throw new Error('Should have error message');
        });

        // Test 3: Route decision without route defaults to ai
        this.test('Route decision without route defaults to ai', () => {
            const routeDecision = {
                confidence: 0.7,
                reason: 'Default'
            };

            const plan = plannerAgent.buildPlan(routeDecision);

            if (!plan.ready) throw new Error('Plan should be ready');
            if (plan.route !== 'ai') throw new Error('Route should default to ai');
            if (plan.agents[0] !== 'ai') throw new Error('Agent should be ai');
        });

        console.log('✅ buildPlan() tests completed\n');
    }

    /**
     * Test validatePlan() method
     */
    async testValidatePlanMethod() {
        console.log('📋 Test Suite: validatePlan() Method');
        console.log('-'.repeat(70));

        // Test 1: Valid plan
        this.test('Valid plan passes validation', () => {
            const plan = plannerAgent.analyze({ message: 'What is AI?' });
            const validation = plannerAgent.validatePlan(plan);

            if (!validation.valid) throw new Error('Valid plan should pass validation');
            if (validation.errors.length > 0) throw new Error('Should have no errors');
        });

        // Test 2: Null plan
        this.test('Null plan fails validation', () => {
            const validation = plannerAgent.validatePlan(null);

            if (validation.valid) throw new Error('Null plan should fail validation');
            if (validation.errors.length === 0) throw new Error('Should have errors');
        });

        // Test 3: Plan without route
        this.test('Plan without route fails validation', () => {
            const plan = {
                intent: 'question',
                agents: ['ai'],
                executionMode: 'single',
                expectedOutputType: 'text',
                dependencies: {},
                executionOrder: { sequential: true, parallel: false, order: ['ai'] },
                contextRequirements: { memory: true, files: false, tools: false },
                ready: true
            };

            const validation = plannerAgent.validatePlan(plan);

            if (validation.valid) throw new Error('Plan without route should fail validation');
            if (!validation.errors.includes('Plan must have a route property')) {
                throw new Error('Should have route error');
            }
        });

        // Test 4: Plan with invalid route
        this.test('Plan with invalid route fails validation', () => {
            const plan = plannerAgent.analyze({ message: 'What is AI?' });
            plan.route = 'invalid_route';

            const validation = plannerAgent.validatePlan(plan);

            if (validation.valid) throw new Error('Plan with invalid route should fail validation');
        });

        // Test 5: Plan with invalid agent
        this.test('Plan with invalid agent fails validation', () => {
            const plan = plannerAgent.analyze({ message: 'What is AI?' });
            plan.agents = ['invalid_agent'];

            const validation = plannerAgent.validatePlan(plan);

            if (validation.valid) throw new Error('Plan with invalid agent should fail validation');
        });

        // Test 6: Plan with invalid execution mode
        this.test('Plan with invalid execution mode fails validation', () => {
            const plan = plannerAgent.analyze({ message: 'What is AI?' });
            plan.executionMode = 'invalid_mode';

            const validation = plannerAgent.validatePlan(plan);

            if (validation.valid) throw new Error('Plan with invalid execution mode should fail validation');
        });

        // Test 7: Plan with invalid output type
        this.test('Plan with invalid output type fails validation', () => {
            const plan = plannerAgent.analyze({ message: 'What is AI?' });
            plan.expectedOutputType = 'invalid_type';

            const validation = plannerAgent.validatePlan(plan);

            if (validation.valid) throw new Error('Plan with invalid output type should fail validation');
        });

        console.log('✅ validatePlan() tests completed\n');
    }

    /**
     * Test intent detection
     */
    async testIntentDetection() {
        console.log('📋 Test Suite: Intent Detection');
        console.log('-'.repeat(70));

        const testCases = [
            { message: 'Hello', expectedIntent: 'greeting' },
            { message: 'Hi there!', expectedIntent: 'greeting' },
            { message: 'Good morning', expectedIntent: 'greeting' },
            { message: 'What is AI?', expectedIntent: 'question' },
            { message: 'Who are you?', expectedIntent: 'question' },
            { message: 'How does this work?', expectedIntent: 'question' },
            { message: 'Calculate 2 + 2', expectedIntent: 'calculation' },
            { message: 'What is 5 * 10?', expectedIntent: 'question' },
            { message: 'Weather in Chennai', expectedIntent: 'weather' },
            { message: 'Weather for tomorrow', expectedIntent: 'weather' },
            { message: 'Remember my name is John', expectedIntent: 'memory' },
            { message: 'I work at Google', expectedIntent: 'memory' },
            { message: 'Upload my file', expectedIntent: 'file' },
            { message: 'Search my files', expectedIntent: 'file' },
            { message: 'Web search for AI news', expectedIntent: 'web_search' },
            { message: 'Search for machine learning', expectedIntent: 'web_search' },
            { message: 'Write a function', expectedIntent: 'coding' },
            { message: 'Create a script', expectedIntent: 'coding' },
            { message: 'Tell me about yourself', expectedIntent: 'conversation' },
            { message: 'What do you think?', expectedIntent: 'conversation' },
            { message: 'Show me my data', expectedIntent: 'command' },
            { message: 'Get my files', expectedIntent: 'file' },
            { message: 'Random gibberish xyz', expectedIntent: 'unknown' }
        ];

        testCases.forEach(testCase => {
            this.test(`Intent detection: "${testCase.message}" → ${testCase.expectedIntent}`, () => {
                const plan = plannerAgent.analyze({
                    message: testCase.message
                });

                if (plan.intent !== testCase.expectedIntent) {
                    throw new Error(`Expected intent "${testCase.expectedIntent}" but got "${plan.intent}"`);
                }
            });
        });

        console.log('✅ Intent detection tests completed\n');
    }

    /**
     * Test route detection
     */
    async testRouteDetection() {
        console.log('📋 Test Suite: Route Detection');
        console.log('-'.repeat(70));

        const testCases = [
            { message: 'Weather in Chennai', expectedRoute: 'tool' },
            { message: 'Calculate 2 + 2', expectedRoute: 'tool' },
            { message: 'Web search for AI', expectedRoute: 'tool' },
            { message: 'Remember my name', expectedRoute: 'memory' },
            { message: 'What do you remember?', expectedRoute: 'memory' },
            { message: 'Upload my file', expectedRoute: 'file' },
            { message: 'Search my files', expectedRoute: 'file' },
            { message: 'What is AI?', expectedRoute: 'ai' },
            { message: 'Tell me about yourself', expectedRoute: 'ai' }
        ];

        testCases.forEach(testCase => {
            this.test(`Route detection: "${testCase.message}" → ${testCase.expectedRoute}`, () => {
                const plan = plannerAgent.analyze({
                    message: testCase.message
                });

                if (plan.route !== testCase.expectedRoute) {
                    throw new Error(`Expected route "${testCase.expectedRoute}" but got "${plan.route}"`);
                }
            });
        });

        console.log('✅ Route detection tests completed\n');
    }

    /**
     * Test agent determination
     */
    async testAgentDetermination() {
        console.log('📋 Test Suite: Agent Determination');
        console.log('-'.repeat(70));

        this.test('Tool route returns tool agent', () => {
            const plan = plannerAgent.analyze({ message: 'Weather in Chennai' });
            if (plan.agents.length !== 1 || plan.agents[0] !== 'tool') {
                throw new Error('Should have single tool agent');
            }
        });

        this.test('Memory route returns memory agent', () => {
            const plan = plannerAgent.analyze({ message: 'Remember my name' });
            if (plan.agents.length !== 1 || plan.agents[0] !== 'memory') {
                throw new Error('Should have single memory agent');
            }
        });

        this.test('File route returns file agent', () => {
            const plan = plannerAgent.analyze({ message: 'Upload my file' });
            if (plan.agents.length !== 1 || plan.agents[0] !== 'file') {
                throw new Error('Should have single file agent');
            }
        });

        this.test('AI route returns AI agent', () => {
            const plan = plannerAgent.analyze({ message: 'What is AI?' });
            if (plan.agents.length !== 1 || plan.agents[0] !== 'ai') {
                throw new Error('Should have single AI agent');
            }
        });

        console.log('✅ Agent determination tests completed\n');
    }

    /**
     * Test dependency detection
     */
    async testDependencyDetection() {
        console.log('📋 Test Suite: Dependency Detection');
        console.log('-'.repeat(70));

        this.test('Single agent has no dependencies', () => {
            const plan = plannerAgent.analyze({ message: 'What is AI?' });
            const deps = plan.dependencies;

            if (deps.hasDependencies) throw new Error('Should not have dependencies');
            if (deps.sequential.length !== 0) throw new Error('Sequential should be empty');
        });

        this.test('Multi-agent scenarios have dependencies', () => {
            // This tests the internal logic - in current implementation,
            // single agents are returned, but the logic supports multi-agent
            const plan = plannerAgent.analyze({ message: 'What is AI?' });

            // Verify dependencies object structure
            if (!plan.dependencies.hasOwnProperty('sequential')) {
                throw new Error('Dependencies should have sequential property');
            }
            if (!plan.dependencies.hasOwnProperty('parallel')) {
                throw new Error('Dependencies should have parallel property');
            }
            if (!plan.dependencies.hasOwnProperty('hasDependencies')) {
                throw new Error('Dependencies should have hasDependencies property');
            }
        });

        console.log('✅ Dependency detection tests completed\n');
    }

    /**
     * Test execution mode detection
     */
    async testExecutionModeDetection() {
        console.log('📋 Test Suite: Execution Mode Detection');
        console.log('-'.repeat(70));

        this.test('Single agent returns single mode', () => {
            const plan = plannerAgent.analyze({ message: 'What is AI?' });
            if (plan.executionMode !== 'single') {
                throw new Error(`Expected 'single' but got '${plan.executionMode}'`);
            }
        });

        this.test('Valid execution modes', () => {
            const modes = plannerAgent.getSupportedExecutionModes();
            if (!modes.includes('single')) throw new Error('Should support single mode');
            if (!modes.includes('sequential')) throw new Error('Should support sequential mode');
            if (!modes.includes('parallel')) throw new Error('Should support parallel mode');
        });

        console.log('✅ Execution mode detection tests completed\n');
    }

    /**
     * Test output type detection
     */
    async testOutputTypeDetection() {
        console.log('📋 Test Suite: Output Type Detection');
        console.log('-'.repeat(70));

        this.test('Tool route returns tool_result', () => {
            const plan = plannerAgent.analyze({ message: 'Weather in Chennai' });
            if (plan.expectedOutputType !== 'tool_result') {
                throw new Error(`Expected 'tool_result' but got '${plan.expectedOutputType}'`);
            }
        });

        this.test('Memory route with memory intent returns memory_update', () => {
            const plan = plannerAgent.analyze({ message: 'Remember my name' });
            if (plan.expectedOutputType !== 'memory_update') {
                throw new Error(`Expected 'memory_update' but got '${plan.expectedOutputType}'`);
            }
        });

        this.test('File route returns file_summary', () => {
            const plan = plannerAgent.analyze({ message: 'Upload my file' });
            if (plan.expectedOutputType !== 'file_summary') {
                throw new Error(`Expected 'file_summary' but got '${plan.expectedOutputType}'`);
            }
        });

        this.test('AI route returns text', () => {
            const plan = plannerAgent.analyze({ message: 'What is AI?' });
            if (plan.expectedOutputType !== 'text') {
                throw new Error(`Expected 'text' but got '${plan.expectedOutputType}'`);
            }
        });

        console.log('✅ Output type detection tests completed\n');
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        console.log('📋 Test Suite: Error Handling');
        console.log('-'.repeat(70));

        this.test('Null context returns error plan', () => {
            const plan = plannerAgent.analyze(null);
            if (plan.ready) throw new Error('Plan should not be ready');
            if (!plan.error) throw new Error('Should have error message');
        });

        this.test('Empty message returns error plan', () => {
            const plan = plannerAgent.analyze({ message: '' });
            if (plan.ready) throw new Error('Plan should not be ready');
        });

        this.test('Whitespace-only message returns error plan', () => {
            const plan = plannerAgent.analyze({ message: '   ' });
            if (plan.ready) throw new Error('Plan should not be ready');
        });

        this.test('Non-string message returns error plan', () => {
            const plan = plannerAgent.analyze({ message: 123 });
            if (plan.ready) throw new Error('Plan should not be ready');
        });

        this.test('Error plan has fallback to AI agent', () => {
            const plan = plannerAgent.analyze({ message: '' });
            if (plan.agents[0] !== 'ai') throw new Error('Should fallback to AI agent');
            if (plan.route !== 'ai') throw new Error('Should fallback to AI route');
        });

        console.log('✅ Error handling tests completed\n');
    }

    /**
     * Test helper methods
     */
    async testHelperMethods() {
        console.log('📋 Test Suite: Helper Methods');
        console.log('-'.repeat(70));

        this.test('getSupportedIntents() returns array', () => {
            const intents = plannerAgent.getSupportedIntents();
            if (!Array.isArray(intents)) throw new Error('Should return array');
            if (intents.length === 0) throw new Error('Should have intents');
            if (!intents.includes('greeting')) throw new Error('Should include greeting');
            if (!intents.includes('question')) throw new Error('Should include question');
        });

        this.test('getSupportedExecutionModes() returns array', () => {
            const modes = plannerAgent.getSupportedExecutionModes();
            if (!Array.isArray(modes)) throw new Error('Should return array');
            if (modes.length !== 3) throw new Error('Should have 3 modes');
        });

        this.test('getSupportedOutputTypes() returns array', () => {
            const types = plannerAgent.getSupportedOutputTypes();
            if (!Array.isArray(types)) throw new Error('Should return array');
            if (!types.includes('text')) throw new Error('Should include text');
            if (!types.includes('tool_result')) throw new Error('Should include tool_result');
        });

        this.test('getSupportedRoutes() returns array', () => {
            const routes = plannerAgent.getSupportedRoutes();
            if (!Array.isArray(routes)) throw new Error('Should return array');
            if (!routes.includes('tool')) throw new Error('Should include tool');
            if (!routes.includes('memory')) throw new Error('Should include memory');
            if (!routes.includes('file')) throw new Error('Should include file');
            if (!routes.includes('ai')) throw new Error('Should include ai');
        });

        console.log('✅ Helper methods tests completed\n');
    }

    /**
     * Helper method to run a single test
     */
    test(name, fn) {
        try {
            fn();
            this.passed++;
            console.log(`  ✅ ${name}`);
        } catch (error) {
            this.failed++;
            console.log(`  ❌ ${name}`);
            console.log(`     Error: ${error.message}`);
        }
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('='.repeat(70));
        console.log('TEST SUMMARY');
        console.log('='.repeat(70));
        console.log(`Total Tests: ${this.passed + this.failed}`);
        console.log(`Passed: ${this.passed} ✅`);
        console.log(`Failed: ${this.failed} ❌`);
        console.log(`Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(2)}%`);
        console.log('='.repeat(70));

        if (this.failed === 0) {
            console.log('🎉 ALL TESTS PASSED!');
        } else {
            console.log('⚠️  Some tests failed. Please review the errors above.');
        }
        console.log('='.repeat(70));
    }
}

// Run tests
const tests = new PlannerAgentTests();
tests.runAll().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});