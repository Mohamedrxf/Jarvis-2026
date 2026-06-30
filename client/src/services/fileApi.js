const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class FileApi {
    constructor() {
        this.baseUrl = `${API_BASE_URL}/files`;
    }

    getAuthHeader() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Upload a file
     * @param {File} file - File object from input
     * @returns {Promise<Object>} Uploaded file metadata
     */
    async uploadFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(this.baseUrl + '/upload', {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: formData
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to upload file');
            }

            return data.data;
        } catch (error) {
            console.error('[FileApi] Error uploading file:', error);
            throw error;
        }
    }

    /**
     * Get all files for current user
     * @returns {Promise<Array>} List of files
     */
    async getUserFiles() {
        try {
            const response = await fetch(this.baseUrl, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch files');
            }

            return data.data;
        } catch (error) {
            console.error('[FileApi] Error fetching files:', error);
            throw error;
        }
    }

    /**
     * Get file by ID
     * @param {number} fileId - File ID
     * @returns {Promise<Object>} File metadata with content
     */
    async getFile(fileId) {
        try {
            const response = await fetch(`${this.baseUrl}/${fileId}`, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch file');
            }

            return data.data;
        } catch (error) {
            console.error('[FileApi] Error fetching file:', error);
            throw error;
        }
    }

    /**
     * Delete file
     * @param {number} fileId - File ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(fileId) {
        try {
            const response = await fetch(`${this.baseUrl}/${fileId}`, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to delete file');
            }

            return true;
        } catch (error) {
            console.error('[FileApi] Error deleting file:', error);
            throw error;
        }
    }

    /**
     * Search files
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching files
     */
    async searchFiles(query) {
        try {
            const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to search files');
            }

            return data.data;
        } catch (error) {
            console.error('[FileApi] Error searching files:', error);
            throw error;
        }
    }
}

export default new FileApi();