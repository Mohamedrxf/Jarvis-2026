// File Agent - Phase 9.0D
// Handles file operation requests
// Simple delegation to FileService

const BaseAgent = require('./BaseAgent');
const fileService = require('../fileService');

class FileAgent extends BaseAgent {
    getName() {
        return "file";
    }

    canHandle(routeDecision) {
        return routeDecision.route === "file";
    }

    handle(context) {
        // Delegate to FileService based on operation in context
        const { operation, ...params } = context;

        switch (operation) {
            case 'uploadFile':
                return fileService.uploadFile(params.userId, params.file);
            case 'getUserFiles':
                return fileService.getUserFiles(params.userId);
            case 'getFile':
                return fileService.getFile(params.fileId, params.userId);
            case 'deleteFile':
                return fileService.deleteFile(params.fileId, params.userId);
            case 'searchFiles':
                return fileService.searchFiles(params.userId, params.query);
            case 'extractTextContent':
                return fileService.extractTextContent(params.file);
            default:
                throw new Error(`Unknown file operation: ${operation}`);
        }
    }
}

module.exports = FileAgent;