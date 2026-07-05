// Base Agent Interface - Phase 9.0A
// Abstract base class for all agents
// No implementation - interface only

class BaseAgent {
    getName() {
        throw new Error("Not implemented");
    }

    canHandle(message) {
        throw new Error("Not implemented");
    }

    handle(context) {
        throw new Error("Not implemented");
    }
}

module.exports = BaseAgent;