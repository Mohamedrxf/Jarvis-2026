// Agent Executor - Phase 9.1C
// Executes agents dispatched by AgentDispatcher
// Executor only - no routing, dispatch, or service logic

const AgentDispatcher = require('./AgentDispatcher');

class AgentExecutor {
    /**
     * Executes the appropriate agent for a given route decision
     * @param {Object} routeDecision - The route decision object
     * @param {Object} context - The execution context
     * @returns {Object|null} The result from agent.handle() or null if no agent found
     */
    execute(routeDecision, context) {
        const dispatcher = new AgentDispatcher();
        const agent = dispatcher.dispatch(routeDecision);

        if (!agent) {
            return null;
        }

        return agent.handle(context);
    }
}

module.exports = AgentExecutor;