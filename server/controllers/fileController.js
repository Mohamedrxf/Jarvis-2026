const fileService = require('../services/fileService');
const fileKnowledgeService = require('../services/fileKnowledgeService');

class FileController {
    /**
     * Upload a file
     * @route POST /api/files/upload
     * @access Protected
     */
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            const userId = req.user.id;
            const file = req.file;

            // Upload and process file
            const result = await fileService.uploadFile(userId, file);

            // Optionally link to memory system (non-blocking)
            fileKnowledgeService.linkFileToMemory(userId, result.id, result.extractedContent)
                .then(memory => {
                    console.log(`[FileController] File ${result.id} linked to memory ${memory.id}`);
                })
                .catch(err => {
                    console.warn('[FileController] Could not link file to memory:', err.message);
                });

            return res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('[FileController] Error uploading file:', error.message);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to upload file'
            });
        }
    }

    /**
     * Get all files for user
     * @route GET /api/files
     * @access Protected
     */
    async getUserFiles(req, res) {
        try {
            const userId = req.user.id;
            const files = await fileService.getUserFiles(userId);

            return res.json({
                success: true,
                data: files
            });
        } catch (error) {
            console.error('[FileController] Error fetching files:', error.message);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch files'
            });
        }
    }

    /**
     * Get file by ID
     * @route GET /api/files/:id
     * @access Protected
     */
    async getFile(req, res) {
        try {
            const userId = req.user.id;
            const fileId = req.params.id;

            const file = await fileService.getFile(fileId, userId);

            return res.json({
                success: true,
                data: file
            });
        } catch (error) {
            console.error('[FileController] Error fetching file:', error.message);
            return res.status(404).json({
                success: false,
                error: error.message || 'File not found'
            });
        }
    }

    /**
     * Delete file
     * @route DELETE /api/files/:id
     * @access Protected
     */
    async deleteFile(req, res) {
        try {
            const userId = req.user.id;
            const fileId = req.params.id;

            await fileService.deleteFile(fileId, userId);

            return res.json({
                success: true,
                message: 'File deleted successfully'
            });
        } catch (error) {
            console.error('[FileController] Error deleting file:', error.message);
            return res.status(404).json({
                success: false,
                error: error.message || 'Failed to delete file'
            });
        }
    }

    /**
     * Search files
     * @route GET /api/files/search?q=query
     * @access Protected
     */
    async searchFiles(req, res) {
        try {
            const userId = req.user.id;
            const query = req.query.q;

            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query is required'
                });
            }

            const files = await fileService.searchFiles(userId, query);

            return res.json({
                success: true,
                data: files
            });
        } catch (error) {
            console.error('[FileController] Error searching files:', error.message);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to search files'
            });
        }
    }
}

module.exports = new FileController();