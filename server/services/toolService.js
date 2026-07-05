// Tool Service - Phase 7.0 Step 2
// Skeleton service for tool execution and management
// No actual tools or AI logic implemented yet

const { getTool, listTools } = require('./toolRegistry');

class ToolService {
    /**
     * Execute a tool by name with the provided input
     * @param {string} name - Tool identifier
     * @param {any} input - Input data for the tool
     * @returns {Promise<Object>} Result object with success/error status
     */
    async executeTool(name, input) {
        try {
            // Fetch tool from registry
            const tool = getTool(name);

            // Check if tool exists
            if (!tool) {
                return {
                    success: false,
                    error: `Tool '${name}' not found in registry`,
                    toolName: name
                };
            }

            // Call tool handler with input
            const result = await tool(input);

            return {
                success: true,
                result: result,
                toolName: name
            };
        } catch (error) {
            return {
                success: false,
                error: `Error executing tool '${name}': ${error.message}`,
                toolName: name
            };
        }
    }

    /**
     * List all available tools in the registry
     * @returns {Object} Object containing list of tool names
     */
    listAvailableTools() {
        const toolNames = listTools();
        return {
            tools: toolNames,
            count: toolNames.length
        };
    }
}

// Export singleton instance
const toolService = new ToolService();

module.exports = toolService;