const memoryService = require('./memoryService');

class FileKnowledgeService {
    /**
     * Link extracted file content to memory system
     * @param {number} userId - User ID
     * @param {number} fileId - File ID
     * @param {string} extractedContent - Extracted text content
     * @returns {Promise<Object>} Created memory
     */
    async linkFileToMemory(userId, fileId, extractedContent) {
        try {
            // Create a memory from the file content
            // Use 'education' category as default for file content
            const memory = await memoryService.createMemory(
                userId,
                'education',
                `File content (ID: ${fileId}): ${extractedContent.substring(0, 500)}${extractedContent.length > 500 ? '...' : ''}`,
                0.8,
                'file_upload'
            );

            return memory;
        } catch (error) {
            console.error('[FileKnowledgeService] Error linking file to memory:', error.message);
            throw error;
        }
    }

    /**
     * Search over file content using memory search
     * @param {number} userId - User ID
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching results
     */
    async searchFileContent(userId, query) {
        try {
            // Search memories that were created from file uploads
            const memories = await memoryService.searchMemories(userId, query);

            // Filter to only file-related memories
            const fileMemories = memories.filter(m => m.source === 'file_upload');

            return fileMemories;
        } catch (error) {
            console.error('[FileKnowledgeService] Error searching file content:', error.message);
            throw error;
        }
    }

    /**
     * Get file context for AI prompt injection
     * @param {number} userId - User ID
     * @param {string} query - Current query
     * @returns {Promise<string>} Formatted context from files
     */
    async getFileContext(userId, query) {
        try {
            // Search for relevant file content
            const relevantMemories = await this.searchFileContent(userId, query);

            if (relevantMemories.length === 0) {
                return '';
            }

            // Format as context
            const contextParts = relevantMemories.map(memory => {
                return `[File Knowledge]: ${memory.content}`;
            });

            return contextParts.join('\n\n');
        } catch (error) {
            console.error('[FileKnowledgeService] Error getting file context:', error.message);
            return '';
        }
    }

    /**
     * Batch link multiple files to memory
     * @param {number} userId - User ID
     * @param {Array} files - Array of {fileId, content}
     * @returns {Promise<Array>} Created memories
     */
    async batchLinkFilesToMemory(userId, files) {
        try {
            const results = [];

            for (const file of files) {
                try {
                    const memory = await this.linkFileToMemory(userId, file.fileId, file.content);
                    results.push({ success: true, memory });
                } catch (error) {
                    results.push({ success: false, fileId: file.fileId, error: error.message });
                }
            }

            return results;
        } catch (error) {
            console.error('[FileKnowledgeService] Error batch linking files:', error.message);
            throw error;
        }
    }
}

module.exports = new FileKnowledgeService();