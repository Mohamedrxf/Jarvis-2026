// Agent Registry - Phase 9.1A
// Central registry for all agent instances
// Registry only - no routing, dispatch, or execution logic

const ToolAgent = require('./ToolAgent');
const MemoryAgent = require('./MemoryAgent');
const FileAgent = require('./FileAgent');
const AIAgent = require('./AIAgent');

// Instantiate each agent exactly once
const toolAgent = new ToolAgent();
const memoryAgent = new MemoryAgent();
const fileAgent = new FileAgent();
const aiAgent = new AIAgent();

// Store all agents in an array
const agents = [
    toolAgent,
    memoryAgent,
    fileAgent,
    aiAgent
];

/**
 * Returns array of all agent instances
 * @returns {Array} Array of all registered agent instances
 */
function getAgents() {
    return agents;
}

/**
 * Returns matching agent by getName() or null if not found
 * @param {string} name - Agent name to search for
 * @returns {Object|null} Matching agent instance or null
 */
function getAgent(name) {
    return agents.find(agent => agent.getName() === name) || null;
}

module.exports = {
    getAgents,
    getAgent
};