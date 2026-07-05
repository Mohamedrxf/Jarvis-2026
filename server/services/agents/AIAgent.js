// AI Agent - Phase 9.0E
// Handles AI response generation requests
// Simple delegation to AI Engine

const BaseAgent = require('./BaseAgent');
const aiEngine = require('../../../ai-engine');

class AIAgent extends BaseAgent {
    getName() {
        return "ai";
    }

    canHandle(routeDecision) {
        return routeDecision.route === "ai";
    }

    handle(context) {
        // Delegate to AI Engine
        // Context should contain messages array for the AI
        return aiEngine.generateResponse(context.messages);
    }
}

module.exports = AIAgent;