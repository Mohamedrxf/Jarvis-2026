// Tool Agent - Phase 9.0B
// Handles tool execution requests
// Simple delegation to ToolService

const BaseAgent = require('./BaseAgent');
const toolService = require('../toolService');

class ToolAgent extends BaseAgent {
    getName() {
        return "tool";
    }

    canHandle(routeDecision) {
        return routeDecision.route === "tool";
    }

    handle(context) {
        return toolService.executeTool(
            context.target,
            context.input
        );
    }
}

module.exports = ToolAgent;