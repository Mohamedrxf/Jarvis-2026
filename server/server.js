const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables BEFORE importing modules that depend on them
dotenv.config();

// Now import modules that need environment variables
const aiEngine = require('../ai-engine');
const memoryService = require('./services/memoryService');
const toolService = require('./services/toolService');
const fileService = require('./services/fileService');
const agentService = require('./services/agentService');
const AgentDispatcher = require('./services/agents/AgentDispatcher');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // standard Vite ports
  credentials: true
}));
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);

// Conversation routes
const conversationRoutes = require('./routes/conversations');
app.use('/api/conversations', conversationRoutes);

// Memory routes
const memoryRoutes = require('./routes/memories');
app.use('/api/memories', memoryRoutes);

// File routes
const fileRoutes = require('./routes/files');
app.use('/api/files', fileRoutes);

// Tool Decision Layer (Phase 7.2A)
/**
 * Lightweight tool decision function using keyword matching
 * @param {string} message - User message to analyze
 * @returns {Object} Decision object with useTool flag and tool details
 */
function decideTool(message) {
  const lowerMessage = message.toLowerCase().trim();

  // Weather detection: "weather in <city>" or "what's the weather in <city>"
  const weatherMatch = lowerMessage.match(/(?:weather|what'?s?\s+(?:the\s+)?weather)\s+(?:in|for)\s+(.+?)(?:\s+today)?$/i);
  if (weatherMatch) {
    // Extract city from original message to preserve case
    const cityMatch = message.match(/(?:weather|what'?s?\s+(?:the\s+)?weather)\s+(?:in|for)\s+(.+?)(?:\s+today)?$/i);
    return {
      useTool: true,
      toolName: 'weather',
      input: { city: cityMatch[1].trim() }
    };
  }

  // Web search detection: "search" or "web search"
  const webSearchMatch = lowerMessage.match(/(?:web\s+search|search)\s+(?:for\s+)?(.+)/i);
  if (webSearchMatch) {
    // Extract query from original message to preserve case
    const queryMatch = message.match(/(?:web\s+search|search)\s+(?:for\s+)?(.+)/i);
    return {
      useTool: true,
      toolName: 'web_search',
      input: { query: queryMatch[1].trim() }
    };
  }

  // Currency conversion: "convert" or "currency"
  // Support both 3-letter codes (USD, EUR) and full names (dollars, euros)
  const currencyMatch = lowerMessage.match(/(?:convert|currency)\s+(\d+(?:\.\d+)?)\s+(?:(\d+(?:\.\d+)?\s+)?([a-z]+)\s+to\s+([a-z]+))/i);
  if (currencyMatch) {
    const amount = parseFloat(currencyMatch[1]);
    const fromCode = normalizeCurrency(currencyMatch[3]);
    const toCode = normalizeCurrency(currencyMatch[4]);
    return {
      useTool: true,
      toolName: 'currency',
      input: { amount, from: fromCode, to: toCode }
    };
  }

  // Calculator: "calculate" or math expression
  const calcMatch = lowerMessage.match(/calculate\s+(.+?)(?:\s+please)?$/i);
  if (calcMatch) {
    return {
      useTool: true,
      toolName: 'calculator',
      input: { expression: calcMatch[1].trim() }
    };
  }

  // Math expression detection (basic patterns)
  if (lowerMessage.match(/^[\d\s\+\-\*\/\(\)\.]+$/)) {
    return {
      useTool: true,
      toolName: 'calculator',
      input: { expression: message.trim() }
    };
  }

  // UUID generation: "generate uuid"
  if (lowerMessage.match(/^generate\s+uuid$/i)) {
    return {
      useTool: true,
      toolName: 'uuid',
      input: {}
    };
  }

  // Password generation: "password" or "generate password"
  const passwordMatch = lowerMessage.match(/(?:generate\s+password|password)(?:\s+(\d+))?/i);
  if (passwordMatch) {
    const length = passwordMatch[1] ? parseInt(passwordMatch[1]) : 12;
    return {
      useTool: true,
      toolName: 'password',
      input: { length: length }
    };
  }

  // Date/time detection: "time", "date", "current time", etc.
  if (lowerMessage.match(/(?:time|date|what\s+time|what\s+date|current\s+time|current\s+date)/i)) {
    return {
      useTool: true,
      toolName: 'datetime',
      input: {}
    };
  }

  // No tool needed
  return {
    useTool: false
  };
}

/**
 * Normalize currency names to standard 3-letter codes
 * @param {string} currency - Currency name or code
 * @returns {string} 3-letter currency code
 */
function normalizeCurrency(currency) {
  const lower = currency.toLowerCase().trim();
  const currencyMap = {
    'dollar': 'USD',
    'dollars': 'USD',
    'usd': 'USD',
    'euro': 'EUR',
    'euros': 'EUR',
    'eur': 'EUR',
    'rupee': 'INR',
    'rupees': 'INR',
    'inr': 'INR',
    'pound': 'GBP',
    'pounds': 'GBP',
    'gbp': 'GBP',
    'yen': 'JPY',
    'jpy': 'JPY',
    'yuan': 'CNY',
    'cny': 'CNY'
  };
  return currencyMap[lower] || currency.toUpperCase();
}

/**
 * Extract tool input from message based on tool type
 * @param {string} message - User message
 * @param {string} toolName - Tool name
 * @returns {Object} Tool input parameters
 */
function extractToolInput(message, toolName) {
  const lowerMessage = message.toLowerCase().trim();

  switch (toolName) {
    case 'weather': {
      const match = message.match(/(?:weather|what'?s?\s+(?:the\s+)?weather)\s+(?:in|for)\s+(.+?)(?:\s+today)?$/i);
      return match ? { city: match[1].trim() } : {};
    }
    case 'web_search': {
      const match = message.match(/(?:web\s+search|search)\s+(?:for\s+)?(.+)/i);
      return match ? { query: match[1].trim() } : {};
    }
    case 'currency': {
      const match = lowerMessage.match(/(?:convert|currency)\s+(\d+(?:\.\d+)?)\s+(?:(\d+(?:\.\d+)?\s+)?([a-z]+)\s+to\s+([a-z]+))/i);
      if (match) {
        const amount = parseFloat(match[1]);
        const fromCode = normalizeCurrency(match[3]);
        const toCode = normalizeCurrency(match[4]);
        return { amount, from: fromCode, to: toCode };
      }
      return {};
    }
    case 'calculator': {
      const calcMatch = lowerMessage.match(/calculate\s+(.+?)(?:\s+please)?$/i);
      return { expression: calcMatch ? calcMatch[1].trim() : message.trim() };
    }
    case 'uuid':
    case 'datetime':
      return {};
    case 'password': {
      const match = lowerMessage.match(/(?:generate\s+password|password)(?:\s+(\d+))?/i);
      return { length: match && match[1] ? parseInt(match[1]) : 12 };
    }
    default:
      return {};
  }
}

/**
 * Get operation name for memory/file agents based on route and message
 * @param {string} route - Route type (memory, file, ai, tool)
 * @param {string} message - User message
 * @returns {Object} Object with operation and params
 */
function getOperationForRoute(route, message) {
  const lowerMessage = message.toLowerCase().trim();

  if (route === 'memory') {
    if (lowerMessage.match(/(?:remember|save|store|memorize|note)\s+(?:this\s+)?(?:that\s+)?(.+)/i)) {
      const contentMatch = message.match(/(?:remember|save|store|memorize|note)\s+(?:this\s+)?(?:that\s+)?(.+)/i);
      const content = contentMatch ? contentMatch[1].trim() : message;
      return {
        operation: 'createMemory',
        params: {
          category: 'preferences',
          content: content,
          confidence: 1.0,
          source: 'manual'
        }
      };
    }
    if (lowerMessage.match(/(?:what\s+do\s+you\s+remember|recall|search\s+memory|find\s+in\s+memory|do\s+you\s+know)/i)) {
      const queryMatch = message.match(/(?:what\s+do\s+you\s+remember|recall|search\s+memory|find\s+in\s+memory|do\s+you\s+know)\s+(?:about\s+)?(.+)?/i);
      const query = queryMatch && queryMatch[1] ? queryMatch[1].trim() : message;
      return {
        operation: 'searchMemories',
        params: { query }
      };
    }
    if (lowerMessage.match(/(?:show|list|get)\s+(?:my\s+)?memories/i)) {
      return {
        operation: 'getMemories',
        params: {}
      };
    }
    // Default memory operation
    return {
      operation: 'getMemoryContext',
      params: { query: message }
    };
  }

  if (route === 'file') {
    if (lowerMessage.match(/^(?:upload|attach|add)\s+(?:my\s+|a\s+)?file$/i)) {
      return {
        operation: 'uploadFile',
        params: {}
      };
    }
    if (lowerMessage.match(/^(?:search|find|show|list|get)\b\s+(?:my\s+)?files?$/i)) {
      return {
        operation: 'getUserFiles',
        params: {}
      };
    }
    if (lowerMessage.match(/^(?:read|analyze|summarize|extract)\b\s+(?:my\s+)?(?:file|document|pdf|doc)$/i)) {
      return {
        operation: 'getUserFiles',
        params: {}
      };
    }
    // Default file operation
    return {
      operation: 'getUserFiles',
      params: {}
    };
  }

  return { operation: null, params: {} };
}

// Unified Tool Execution Pipeline (Phase 7.2C)
/**
 * Centralized tool execution pipeline
 * @param {string} message - User message to process
 * @returns {Object|null} Standardized tool result or null if no tool needed
 */
function executeToolPipeline(message) {
  // Step 1: Call decideTool (Phase 7.2A - reuse existing logic)
  const toolDecision = decideTool(message);

  // Step 2: If useTool = false, return null (continue AI pipeline)
  if (!toolDecision.useTool) {
    return null;
  }

  // Step 3: Execute tool via ToolService with extracted parameters
  const toolResult = toolService.executeTool(toolDecision.toolName, toolDecision.input);

  // Step 4: Return standardized response object
  return {
    success: toolResult.success,
    tool: toolDecision.toolName,
    input: toolDecision.input,
    output: toolResult.success ? toolResult.result : toolResult.error
  };
}

// Routes
/**
 * @route POST /api/chat
 * @desc Process a conversation and return the assistant response.
 * @access Protected (requires JWT)
 */
app.post('/api/chat', authMiddleware, async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request body. "messages" must be a non-empty array.'
    });
  }

  try {
    // Get the last user message for routing
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage?.content || '';
    const routeDecision = agentService.analyzeRequest(userContent);

    // Phase 10.5A1: Build and validate execution plan
    const plan = agentService.buildExecutionPlan(routeDecision);
    const validation = agentService.validateExecutionPlan(plan);

    if (!validation.valid) {
      throw new Error(validation.error || 'Execution plan validation failed');
    }

    // Phase 10.5A2: Build execution descriptor from validated plan
    const executionOrder = agentService.buildAgentExecutionOrder(plan);
    const sharedContextPlan = agentService.buildSharedContextPlan(executionOrder);
    const executionPipeline = agentService.buildExecutionPipeline(executionOrder, sharedContextPlan);
    const descriptor = agentService.buildExecutionDescriptor(executionPipeline);

    // Phase 9.1C: Agent Dispatcher Integration
    const dispatcher = new AgentDispatcher();
    const operationData = getOperationForRoute(routeDecision.route, userContent);
    const context = {
      message: userContent,
      userId: req.user.id,
      messages: messages,
      // Include route decision info for agents that need it
      target: routeDecision.target,
      input: routeDecision.target ? extractToolInput(userContent, routeDecision.target) : undefined,
      // Add operation field for memory and file agents
      operation: operationData.operation,
      ...operationData.params
    };
    const agent = dispatcher.dispatch(routeDecision);

    if (agent) {
      const agentResult = await agent.handle(context);

      const responseContent =
        agentResult && typeof agentResult === "object" && "content" in agentResult
          ? agentResult.content
          : agentResult;

      return res.json({
        success: true,
        response: responseContent
      });
    }

    // Phase 10.5A3: Execute using descriptor
    if (!descriptor.ready) {
      throw new Error('Execution descriptor not ready');
    }

    const execution = await agentService.executeSequentialPipeline(descriptor, context);

    // Phase 10.5A4: Build response from execution results
    const executionResult = agentService.buildExecutionResult(execution.results);
    const resultValidation = agentService.validateExecutionResult(executionResult);

    if (!resultValidation.valid) {
      throw new Error('Execution result validation failed');
    }

    const executionReport = agentService.buildExecutionReport(executionResult);
    const agentSummary = agentService.buildAgentSummary(executionReport);
    const finalResponse = agentService.buildFinalResponse(agentSummary);
    const responseValidation = agentService.validateFinalResponse(finalResponse);

    if (!responseValidation.valid) {
      throw new Error('Final response validation failed');
    }

    // Phase 8.3B: Response Strategy Integration
    const responseStrategy = agentService.buildResponseStrategy(plan.route);

    // Use responseStrategy to determine flow
    if (!responseStrategy.useAI) {
      // Tool response - no AI needed
      const toolPipelineResult = executeToolPipeline(userContent);

      if (toolPipelineResult) {
        if (toolPipelineResult.success) {
          return res.json({
            success: true,
            response: toolPipelineResult.output,
            toolUsed: toolPipelineResult.tool
          });
        } else {
          return res.json({
            success: true,
            response: `Tool execution failed: ${toolPipelineResult.output}`,
            toolUsed: toolPipelineResult.tool,
            error: toolPipelineResult.output
          });
        }
      }
      // If no tool matched, fall through to AI
    }

    // AI response path (for memory, file, and ai routes)
    const userId = req.user.id;
    let enhancedMessages = messages;

    // Add context based on route type
    if (responseStrategy.type === 'memory') {
      const memoryContext = await memoryService.getMemoryContext(userId);
      if (memoryContext) {
        enhancedMessages = [
          {
            role: 'system',
            content: memoryContext
          },
          ...messages
        ];
      }
    } else if (responseStrategy.type === 'file') {
      const userFiles = await fileService.getUserFiles(userId);
      const fileContext = userFiles.length > 0
        ? `\n\n[System: User has ${userFiles.length} file(s) in their library. You can reference these files in your response.]`
        : '';

      enhancedMessages = [
        {
          role: 'system',
          content: `You are a helpful assistant with access to the user's file system.${fileContext}`
        },
        ...messages
      ];
    } else if (responseStrategy.type === 'ai' || responseStrategy.type === 'unknown') {
      const memoryContext = await memoryService.getMemoryContext(userId);
      if (memoryContext) {
        enhancedMessages = [
          {
            role: 'system',
            content: memoryContext
          },
          ...messages
        ];
      }
    }

    const assistantResponse = await aiEngine.generateResponse(enhancedMessages);

    return res.json({
      success: true,
      response: assistantResponse
    });
  } catch (error) {
    console.error('[Server Error] in /api/chat:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while generating response.'
    });
  }
});

/**
 * @route GET /api/status
 * @desc Get system status diagnostics
 */
app.get('/api/status', (req, res) => {
  return res.json({
    success: true,
    status: {
      server: 'online',
      provider: process.env.LLM_PROVIDER || 'mock',
      port: PORT,
      timestamp: new Date().toISOString()
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[JARVIS Server] Running on http://localhost:${PORT}`);
});
