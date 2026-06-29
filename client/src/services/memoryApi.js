const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class MemoryApi {
    constructor() {
        this.baseUrl = `${API_BASE_URL}/memories`;
    }

    getAuthHeader() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    async getMemories(category = null) {
        try {
            const url = category ? `${this.baseUrl}?category=${category}` : this.baseUrl;
            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch memories');
            }

            return data.memories;
        } catch (error) {
            console.error('[MemoryApi] Error fetching memories:', error);
            throw error;
        }
    }

    async createMemory(category, content, confidence = 1.0, source = 'manual') {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: JSON.stringify({ category, content, confidence, source })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to create memory');
            }

            return data.memory;
        } catch (error) {
            console.error('[MemoryApi] Error creating memory:', error);
            throw error;
        }
    }

    async updateMemory(memoryId, updates) {
        try {
            const response = await fetch(`${this.baseUrl}/${memoryId}`, {
                method: 'PUT',
                headers: this.getAuthHeader(),
                body: JSON.stringify(updates)
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to update memory');
            }

            return data.memory;
        } catch (error) {
            console.error('[MemoryApi] Error updating memory:', error);
            throw error;
        }
    }

    async deleteMemory(memoryId) {
        try {
            const response = await fetch(`${this.baseUrl}/${memoryId}`, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to delete memory');
            }

            return true;
        } catch (error) {
            console.error('[MemoryApi] Error deleting memory:', error);
            throw error;
        }
    }

    async searchMemories(query) {
        try {
            const response = await fetch(`${this.baseUrl}/search`, {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: JSON.stringify({ query })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to search memories');
            }

            return data.memories;
        } catch (error) {
            console.error('[MemoryApi] Error searching memories:', error);
            throw error;
        }
    }

    async extractMemories(message) {
        try {
            const response = await fetch(`${this.baseUrl}/extract`, {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to extract memories');
            }

            return data;
        } catch (error) {
            console.error('[MemoryApi] Error extracting memories:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const response = await fetch(`${this.baseUrl}/stats`, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch stats');
            }

            return data.stats;
        } catch (error) {
            console.error('[MemoryApi] Error fetching stats:', error);
            throw error;
        }
    }
}

export default new MemoryApi();