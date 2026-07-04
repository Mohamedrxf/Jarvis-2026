// Agent Dispatcher - Phase 9.1B
// Dispatches route decisions to appropriate agents
// Dispatcher only - no routing logic, execution, or service calls

const AgentRegistry = require('./AgentRegistry');

class AgentDispatcher {
    /**
     * Dispatches a route decision to the first matching agent
     * @param {Object} routeDecision - The route decision object
     * @returns {Object|null} The first agent that can handle the route, or null
     */
    dispatch(routeDecision) {
        const agents = AgentRegistry.getAgents();

        for (const agent of agents) {
            if (agent.canHandle(routeDecision)) {
                return agent;
            }
        }

        return null;
    }
}

module.exports = AgentDispatcher;