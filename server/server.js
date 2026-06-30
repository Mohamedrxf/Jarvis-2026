const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const aiEngine = require('../ai-engine');
const memoryService = require('./services/memoryService');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');

// Load environment variables
dotenv.config();

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
    // Inject memory context into the messages
    const userId = req.user.id;
    const memoryContext = await memoryService.getMemoryContext(userId);

    let enhancedMessages = messages;
    if (memoryContext) {
      // Add memory context as a system message at the beginning
      enhancedMessages = [
        {
          role: 'system',
          content: memoryContext
        },
        ...messages
      ];
    }

    const assistantResponse = await aiEngine.generateResponse(enhancedMessages);

    // Lazy update: Track memory usage (non-blocking)
    if (memoryContext) {
      const rankedMemories = await memoryService.getRankedMemories(userId, 10);
      const memoryIds = rankedMemories.map(m => m.id);
      if (memoryIds.length > 0) {
        memoryService.batchUpdateMemoryUsage(memoryIds, userId).catch(() => {
          // Non-critical, don't block response
        });
      }
    }

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
