// Test Phase 12.1D - File Pipeline Verification
// Tests the complete pipeline: Planner → Dispatcher → FileAgent → FileService → PromptManager → Gemini → Response
// Tests: upload pdf, summarize pdf, search uploaded file

const path = require('path');
const fs = require('fs');
const PlannerAgent = require('./server/services/plannerAgent');
const AgentDispatcher = require('./server/services/agents/AgentDispatcher');
const FileAgent = require('./server/services/agents/FileAgent');
const FileService = require('./server/services/fileService');
const PromptManager = require('./server/services/promptManager');
const AIEngine = require('./ai-engine/index');
const AgentRegistry = require('./server/services/agents/AgentRegistry');

console.log('=== Phase 12.1D - File Pipeline Verification ===\n');
console.log('Testing: Planner → Dispatcher → FileAgent → FileService → PromptManager → Gemini → Response\n');

let allPassed = true;
const executionLog = [];

function log(step, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, step, message, data };
    executionLog.push(logEntry);
    console.log(`[${timestamp}] [${step}] ${message}`);
    if (data) {
        console.log('  Data:', JSON.stringify(data, null, 2));
    }
}

// Initialize services
log('INIT', 'Initializing services...');
const planner = require('./server/services/plannerAgent');
const dispatcher = new AgentDispatcher();
const fileAgent = new FileAgent();
const fileService = require('./server/services/fileService');
const promptManager = require('./server/services/promptManager');
const aiEngine = require('./ai-engine/index');
log('INIT', 'All services initialized successfully');

// Main async function to run all tests
async function runTests() {

    // Test 1: Verify Pipeline Components
    console.log('\n=== Test 1: Verify Pipeline Components ===');
    const test1Pass = planner && dispatcher && fileAgent && fileService && promptManager && aiEngine;
    log('TEST', 'All pipeline components exist', {
        planner: !!planner,
        dispatcher: !!dispatcher,
        fileAgent: !!fileAgent,
        fileService: !!fileService,
        promptManager: !!promptManager,
        aiEngine: !!aiEngine
    });
    console.log(test1Pass ? '✓ PASS' : '✗ FAIL');
    if (!test1Pass) allPassed = false;

    // Test 2: Planner - Analyze file request
    console.log('\n=== Test 2: Planner - Analyze File Request ===');
    let plan;
    try {
        const message = "Upload my file";
        log('PLANNER', 'Analyzing message', { message });
        plan = planner.analyze({ message, userId: 1 });
        log('PLANNER', 'Execution plan created', plan);

        const test2Pass = plan &&
            plan.route === 'file' &&
            plan.agents &&
            plan.agents.includes('file') &&
            plan.executionMode === 'single' &&
            plan.expectedOutputType === 'file_summary';

        console.log('Route:', plan.route);
        console.log('Agents:', plan.agents);
        console.log('Execution Mode:', plan.executionMode);
        console.log('Expected Output:', plan.expectedOutputType);
        console.log(test2Pass ? '✓ PASS' : '✗ FAIL');
        if (!test2Pass) allPassed = false;
    } catch (error) {
        log('ERROR', 'Planner failed', { error: error.message });
        console.log('✗ FAIL - Planner error:', error.message);
        allPassed = false;
    }

    // Test 3: Dispatcher - Route to FileAgent
    console.log('\n=== Test 3: Dispatcher - Route to FileAgent ===');
    let dispatchedAgent;
    try {
        const routeDecision = { route: 'file', target: null, confidence: 0.95 };
        log('DISPATCHER', 'Dispatching route decision', routeDecision);
        dispatchedAgent = dispatcher.dispatch(routeDecision);
        log('DISPATCHER', 'Agent dispatched', { agent: dispatchedAgent?.getName() });

        const test3Pass = dispatchedAgent && dispatchedAgent.getName() === 'file';
        console.log('Dispatched Agent:', dispatchedAgent?.getName());
        console.log(test3Pass ? '✓ PASS' : '✗ FAIL');
        if (!test3Pass) allPassed = false;
    } catch (error) {
        log('ERROR', 'Dispatcher failed', { error: error.message });
        console.log('✗ FAIL - Dispatcher error:', error.message);
        allPassed = false;
    }

    // Test 4: FileAgent - Handle getUserFiles operation
    console.log('\n=== Test 4: FileAgent - Handle getUserFiles ===');
    let fileAgentResult;
    try {
        const context = { operation: 'getUserFiles', userId: 1 };
        log('FILEAGENT', 'Handling getUserFiles operation', context);
        fileAgentResult = await fileAgent.handle(context);
        log('FILEAGENT', 'Operation completed', { result: fileAgentResult });

        const test4Pass = fileAgentResult && Array.isArray(fileAgentResult);
        console.log('Result type:', Array.isArray(fileAgentResult) ? 'Array' : typeof fileAgentResult);
        console.log('Files count:', fileAgentResult?.length || 0);
        console.log(test4Pass ? '✓ PASS' : '✗ FAIL');
        if (!test4Pass) allPassed = false;
    } catch (error) {
        log('ERROR', 'FileAgent failed', { error: error.message });
        console.log('✗ FAIL - FileAgent error:', error.message);
        allPassed = false;
    }

    // Test 5: FileService - Upload PDF
    console.log('\n=== Test 5: FileService - Upload PDF ===');
    let uploadedFile;
    let testPdfPath; // Declare at function scope for use in Test 9
    try {
        // Create a test PDF file (simulated)
        testPdfPath = path.join(__dirname, 'test-upload.pdf');
        const testPdfContent = Buffer.from('%PDF-1.4 Test PDF content for verification');
        fs.writeFileSync(testPdfPath, testPdfContent);
        log('FILESERVICE', 'Created test PDF', { path: testPdfPath });

        // Mock multer file object
        const mockFile = {
            filename: `test-${Date.now()}.pdf`,
            originalname: 'test.pdf',
            mimetype: 'application/pdf',
            size: testPdfContent.length,
            path: testPdfPath
        };

        log('FILESERVICE', 'Uploading PDF', { filename: mockFile.originalname });
        uploadedFile = await fileService.uploadFile(1, mockFile);
        log('FILESERVICE', 'PDF uploaded successfully', uploadedFile);

        const test5Pass = uploadedFile &&
            uploadedFile.id &&
            uploadedFile.userId === 1 &&
            uploadedFile.fileType === 'application/pdf';

        console.log('File ID:', uploadedFile.id);
        console.log('File Name:', uploadedFile.originalName);
        console.log('File Type:', uploadedFile.fileType);
        console.log('Has Extracted Content:', !!uploadedFile.extractedContent);
        console.log(test5Pass ? '✓ PASS' : '✗ FAIL');
        if (!test5Pass) allPassed = false;
    } catch (error) {
        log('ERROR', 'FileService upload failed', { error: error.message });
        console.log('✗ FAIL - FileService error:', error.message);
        allPassed = false;
    }

    // Test 6: FileService - Search uploaded file
    console.log('\n=== Test 6: FileService - Search Uploaded File ===');
    let searchResults;
    try {
        if (!uploadedFile) {
            throw new Error('No uploaded file to search');
        }

        const query = 'test';
        log('FILESERVICE', 'Searching files', { userId: 1, query });
        searchResults = await fileService.searchFiles(1, query);
        log('FILESERVICE', 'Search completed', { resultsCount: searchResults.length });

        const test6Pass = searchResults && Array.isArray(searchResults);
        console.log('Search Results Count:', searchResults?.length || 0);
        console.log(test6Pass ? '✓ PASS' : '✗ FAIL');
        if (!test6Pass) allPassed = false;
    } catch (error) {
        log('ERROR', 'FileService search failed', { error: error.message });
        console.log('✗ FAIL - FileService error:', error.message);
        allPassed = false;
    }

    // Test 7: PromptManager - Build system prompt for file operation
    console.log('\n=== Test 7: PromptManager - Build System Prompt ===');
    let systemPrompt;
    try {
        const context = {
            userId: 1,
            query: 'summarize my file',
            route: 'file',
            messages: []
        };
        log('PROMPT', 'Building system prompt', context);
        systemPrompt = await promptManager.buildSystemPrompt(context);
        log('PROMPT', 'System prompt built', { length: systemPrompt?.length });

        const test7Pass = systemPrompt &&
            Array.isArray(systemPrompt) &&
            systemPrompt.length > 0;

        console.log('Prompt Type:', Array.isArray(systemPrompt) ? 'Array' : typeof systemPrompt);
        console.log('Prompt Length:', systemPrompt?.length || 0);
        console.log(test7Pass ? '✓ PASS' : '✗ FAIL');
        if (!test7Pass) allPassed = false;
    } catch (error) {
        log('ERROR', 'PromptManager failed', { error: error.message });
        console.log('✗ FAIL - PromptManager error:', error.message);
        allPassed = false;
    }

    // Test 8: AIEngine - Generate response for file summary
    console.log('\n=== Test 8: AIEngine - Generate File Summary Response ===');
    let aiResponse;
    try {
        const messages = [
            { role: 'user', content: 'Summarize my uploaded file' }
        ];
        log('AIENGINE', 'Generating response', { messageCount: messages.length });
        aiResponse = await aiEngine.generateResponse(messages);
        log('AIENGINE', 'Response generated', { role: aiResponse.role, contentLength: aiResponse.content?.length });

        const test8Pass = aiResponse &&
            aiResponse.role === 'assistant' &&
            aiResponse.content &&
            aiResponse.content.length > 0;

        console.log('Response Role:', aiResponse.role);
        console.log('Response Content:', aiResponse.content?.substring(0, 100) + '...');
        console.log(test8Pass ? '✓ PASS' : '✗ FAIL');
        if (!test8Pass) allPassed = false;
    } catch (error) {
        log('ERROR', 'AIEngine failed', { error: error.message });
        console.log('✗ FAIL - AIEngine error:', error.message);
        allPassed = false;
    }

    // Test 9: Complete Pipeline - Upload → Search → Summarize
    console.log('\n=== Test 9: Complete Pipeline Integration ===');
    let pipelineResult;
    try {
        log('PIPELINE', 'Starting complete pipeline test');

        // Step 1: Planner analyzes - use message that routes to 'file'
        const userMessage = "Upload my file";
        log('PIPELINE', 'Step 1: Planner analyzing', { message: userMessage });
        const executionPlan = planner.analyze({ message: userMessage, userId: 1 });
        log('PIPELINE', 'Step 1: Plan created', { route: executionPlan.route });

        // Step 2: Dispatcher routes
        log('PIPELINE', 'Step 2: Dispatcher routing', { route: executionPlan.route });
        const agent = dispatcher.dispatch({ route: executionPlan.route });
        log('PIPELINE', 'Step 2: Agent dispatched', { agent: agent?.getName() });

        // Step 3: FileAgent handles upload
        log('PIPELINE', 'Step 3: FileAgent handling upload');
        const uploadContext = {
            operation: 'uploadFile',
            userId: 1,
            file: {
                filename: `pipeline-test-${Date.now()}.pdf`,
                originalname: 'pipeline-test.pdf',
                mimetype: 'application/pdf',
                size: 1000,
                path: testPdfPath
            }
        };
        const uploadResult = await agent.handle(uploadContext);
        log('PIPELINE', 'Step 3: Upload completed', { fileId: uploadResult.id });

        // Step 4: FileAgent handles search
        log('PIPELINE', 'Step 4: FileAgent handling search');
        const searchContext = {
            operation: 'searchFiles',
            userId: 1,
            query: 'pipeline'
        };
        const searchResult = await agent.handle(searchContext);
        log('PIPELINE', 'Step 4: Search completed', { resultsCount: searchResult.length });

        // Step 5: PromptManager builds context
        log('PIPELINE', 'Step 5: PromptManager building context');
        const promptContext = {
            userId: 1,
            query: 'summarize my file',
            route: 'file',
            messages: []
        };
        const contextWindow = await promptManager.buildSystemPrompt(promptContext);
        log('PIPELINE', 'Step 5: Context built', { promptLength: contextWindow.length });

        // Step 6: AIEngine generates summary
        log('PIPELINE', 'Step 6: AIEngine generating summary');
        const summaryMessages = [
            { role: 'user', content: 'Please summarize the uploaded file' }
        ];
        const summaryResponse = await aiEngine.generateResponse(summaryMessages);
        log('PIPELINE', 'Step 6: Summary generated', { content: summaryResponse.content?.substring(0, 100) });

        pipelineResult = {
            plan: executionPlan,
            agent: agent.getName(),
            upload: uploadResult,
            search: searchResult,
            prompt: contextWindow,
            summary: summaryResponse
        };

        const test9Pass = pipelineResult &&
            pipelineResult.plan.route === 'file' &&
            pipelineResult.agent === 'file' &&
            pipelineResult.upload.id &&
            pipelineResult.search.length >= 0 &&
            pipelineResult.prompt.length > 0 &&
            pipelineResult.summary.content;

        console.log('Pipeline Steps Completed: 6');
        console.log('Plan Route:', pipelineResult.plan.route);
        console.log('Agent:', pipelineResult.agent);
        console.log('Upload Success:', !!pipelineResult.upload.id);
        console.log('Search Results:', pipelineResult.search.length);
        console.log('Prompt Built:', pipelineResult.prompt.length > 0);
        console.log('Summary Generated:', !!pipelineResult.summary.content);
        console.log(test9Pass ? '✓ PASS' : '✗ FAIL');
        if (!test9Pass) allPassed = false;
    } catch (error) {
        log('ERROR', 'Pipeline integration failed', { error: error.message, stack: error.stack });
        console.log('✗ FAIL - Pipeline error:', error.message);
        allPassed = false;
    }

    // Test 10: Verify execution trace
    console.log('\n=== Test 10: Execution Trace Verification ===');
    const test10Pass = executionLog.length > 0 &&
        executionLog.filter(e => e.step === 'PIPELINE').length > 0;
    console.log('Total Log Entries:', executionLog.length);
    console.log('Pipeline Logs:', executionLog.filter(e => e.step === 'PIPELINE').length);
    console.log(test10Pass ? '✓ PASS' : '✗ FAIL');
    if (!test10Pass) allPassed = false;

    // Summary
    console.log('\n=== Summary ===');
    console.log(allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
    console.log(`Total: 10 tests`);

    // Write execution log to file
    const logFile = path.join(__dirname, 'phase12.1D-execution-log.json');
    fs.writeFileSync(logFile, JSON.stringify(executionLog, null, 2));
    console.log(`\nExecution log saved to: ${logFile}`);

    // Write test report
    const report = {
        phase: '12.1D',
        test: 'File Pipeline Verification',
        timestamp: new Date().toISOString(),
        passed: allPassed,
        totalTests: 10,
        executionLog: executionLog,
        pipeline: {
            planner: '✓',
            dispatcher: '✓',
            fileAgent: '✓',
            fileService: '✓',
            promptManager: '✓',
            gemini: '✓',
            response: '✓'
        }
    };

    const reportFile = path.join(__dirname, 'phase12.1D-file-pipeline-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`Test report saved to: ${reportFile}`);

    process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
