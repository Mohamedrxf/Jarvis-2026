// Memory Agent - Phase 9.0C
// Handles memory operation requests
// Simple delegation to MemoryService

const BaseAgent = require('./BaseAgent');
const memoryService = require('../memoryService');

class MemoryAgent extends BaseAgent {
    getName() {
        return "memory";
    }

    canHandle(routeDecision) {
        return routeDecision.route === "memory";
    }

    handle(context) {
        // Delegate to MemoryService based on operation in context
        const { operation, ...params } = context;

        switch (operation) {
            case 'createMemory':
                return memoryService.createMemory(params.userId, params.category, params.content, params.confidence, params.source);
            case 'updateMemory':
                return memoryService.updateMemory(params.memoryId, params.userId, params.updates);
            case 'deleteMemory':
                return memoryService.deleteMemory(params.memoryId, params.userId);
            case 'getMemories':
                return memoryService.getMemories(params.userId, params.category);
            case 'searchMemories':
                return memoryService.searchMemories(params.userId, params.query);
            case 'getMemoryContext':
                return memoryService.getMemoryContext(params.userId, params.query);
            case 'getEnrichedPromptContext':
                return memoryService.getEnrichedPromptContext(params.userId, params.query, params.memoryId);
            case 'getRankedMemories':
                return memoryService.getRankedMemories(params.userId, params.limit);
            case 'getMemoryIntelligenceReport':
                return memoryService.getMemoryIntelligenceReport(params.userId);
            case 'detectMemoryConflicts':
                return memoryService.detectMemoryConflicts(params.userId);
            case 'detectDuplicateClusters':
                return memoryService.detectDuplicateClusters(params.userId);
            default:
                throw new Error(`Unknown memory operation: ${operation}`);
        }
    }
}

module.exports = MemoryAgent;