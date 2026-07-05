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

    async getRankedMemories(limit = 10) {
        try {
            const url = `${this.baseUrl}/ranked?limit=${limit}`;
            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch ranked memories');
            }

            return data.memories;
        } catch (error) {
            console.error('[MemoryApi] Error fetching ranked memories:', error);
            throw error;
        }
    }

    async getEvolutionStats() {
        try {
            const response = await fetch(`${this.baseUrl}/evolution-stats`, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch evolution stats');
            }

            return data.stats;
        } catch (error) {
            console.error('[MemoryApi] Error fetching evolution stats:', error);
            throw error;
        }
    }

    async boostMemory(memoryId) {
        try {
            const response = await fetch(`${this.baseUrl}/${memoryId}/boost`, {
                method: 'POST',
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to boost memory');
            }

            return data.memory;
        } catch (error) {
            console.error('[MemoryApi] Error boosting memory:', error);
            throw error;
        }
    }

    async recalculateAllImportance() {
        try {
            const response = await fetch(`${this.baseUrl}/recalculate`, {
                method: 'POST',
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to recalculate importance');
            }

            return data;
        } catch (error) {
            console.error('[MemoryApi] Error recalculating importance:', error);
            throw error;
        }
    }

    async semanticSearch(query, limit = 10) {
        try {
            const response = await fetch(`${this.baseUrl}/semantic-search`, {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: JSON.stringify({ query, limit })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to perform semantic search');
            }

            return data.memories;
        } catch (error) {
            console.error('[MemoryApi] Error in semantic search:', error);
            throw error;
        }
    }

    async getClusters() {
        try {
            const response = await fetch(`${this.baseUrl}/clusters`, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch clusters');
            }

            return data.clusters;
        } catch (error) {
            console.error('[MemoryApi] Error fetching clusters:', error);
            throw error;
        }
    }

    async getRelatedMemories(memoryId) {
        try {
            const response = await fetch(`${this.baseUrl}/${memoryId}/related`, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch related memories');
            }

            return data.memories;
        } catch (error) {
            console.error('[MemoryApi] Error fetching related memories:', error);
            throw error;
        }
    }

    async createRelationship(sourceMemoryId, targetMemoryId, relationshipType, strength = 0.5) {
        try {
            const response = await fetch(`${this.baseUrl}/relationships`, {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: JSON.stringify({ sourceMemoryId, targetMemoryId, relationshipType, strength })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to create relationship');
            }

            return data.relationship;
        } catch (error) {
            console.error('[MemoryApi] Error creating relationship:', error);
            throw error;
        }
    }

    async batchUpdateEmbeddings(batchSize = 50) {
        try {
            const response = await fetch(`${this.baseUrl}/batch-update-embeddings`, {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: JSON.stringify({ batchSize })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to batch update embeddings');
            }

            return data;
        } catch (error) {
            console.error('[MemoryApi] Error batch updating embeddings:', error);
            throw error;
        }
    }

    async getSemanticContext(query, limit = 10) {
        try {
            const url = `${this.baseUrl}/semantic-context?query=${encodeURIComponent(query)}&limit=${limit}`;
            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to get semantic context');
            }

            return data.context;
        } catch (error) {
            console.error('[MemoryApi] Error getting semantic context:', error);
            throw error;
        }
    }

    async getMemoryRelationships(memoryId, relationType = null, direction = 'both') {
        try {
            let url = `${this.baseUrl}/${memoryId}/relationships`;
            const params = new URLSearchParams();
            if (relationType) params.append('relationType', relationType);
            if (direction !== 'both') params.append('direction', direction);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch relationships');
            }

            return data.relationships;
        } catch (error) {
            console.error('[MemoryApi] Error fetching relationships:', error);
            throw error;
        }
    }

    async createMemoryRelationship(memoryId, targetMemoryId, relationType, confidence = 0.5) {
        try {
            const response = await fetch(`${this.baseUrl}/${memoryId}/relationships`, {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: JSON.stringify({ targetMemoryId, relationType, confidence })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to create relationship');
            }

            return data.relationship;
        } catch (error) {
            console.error('[MemoryApi] Error creating relationship:', error);
            throw error;
        }
    }

    async deleteMemoryRelationship(relationshipId) {
        try {
            const response = await fetch(`${this.baseUrl}/relationships/${relationshipId}`, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to delete relationship');
            }

            return true;
        } catch (error) {
            console.error('[MemoryApi] Error deleting relationship:', error);
            throw error;
        }
    }

    async getRelationshipTypes() {
        try {
            const response = await fetch(`${this.baseUrl}/relationships/types`, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch relationship types');
            }

            return data.types;
        } catch (error) {
            console.error('[MemoryApi] Error fetching relationship types:', error);
            throw error;
        }
    }

    async getGraphStats() {
        try {
            const response = await fetch(`${this.baseUrl}/graph-stats`, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch graph stats');
            }

            return data.stats;
        } catch (error) {
            console.error('[MemoryApi] Error fetching graph stats:', error);
            throw error;
        }
    }

    async buildMemoryRelationships(memoryId, threshold = null) {
        try {
            const response = await fetch(`${this.baseUrl}/${memoryId}/build-relationships`, {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: JSON.stringify({ threshold })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to build relationships');
            }

            return data;
        } catch (error) {
            console.error('[MemoryApi] Error building relationships:', error);
            throw error;
        }
    }

    async getConnectedMemories(memoryId, maxDepth = 2) {
        try {
            const url = `${this.baseUrl}/${memoryId}/connected?maxDepth=${maxDepth}`;
            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch connected memories');
            }

            return data;
        } catch (error) {
            console.error('[MemoryApi] Error fetching connected memories:', error);
            throw error;
        }
    }

    async getContextSummary(memoryId, maxDepth = 2, maxMemories = 10) {
        try {
            const url = `${this.baseUrl}/${memoryId}/context-summary?maxDepth=${maxDepth}&maxMemories=${maxMemories}`;
            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to get context summary');
            }

            return data.summary;
        } catch (error) {
            console.error('[MemoryApi] Error getting context summary:', error);
            throw error;
        }
    }

    async getReasoningContext(memoryId, maxDepth = 2, maxMemories = 10) {
        try {
            const url = `${this.baseUrl}/${memoryId}/reasoning-context?maxDepth=${maxDepth}&maxMemories=${maxMemories}`;
            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to get reasoning context');
            }

            return data.context;
        } catch (error) {
            console.error('[MemoryApi] Error getting reasoning context:', error);
            throw error;
        }
    }

    async getContextPreview(memoryId) {
        try {
            const response = await fetch(`${this.baseUrl}/${memoryId}/context-preview`, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to get context preview');
            }

            return data.preview;
        } catch (error) {
            console.error('[MemoryApi] Error getting context preview:', error);
            throw error;
        }
    }

    async getEnrichedContext(query = null, memoryId = null) {
        try {
            const params = new URLSearchParams();
            if (query) params.append('query', query);
            if (memoryId) params.append('memoryId', memoryId);

            const url = `${this.baseUrl}/enriched-context?${params.toString()}`;
            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to get enriched context');
            }

            return data.context;
        } catch (error) {
            console.error('[MemoryApi] Error getting enriched context:', error);
            throw error;
        }
    }

    async getIntelligenceReport() {
        try {
            const response = await fetch(`${this.baseUrl}/intelligence-report`, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to get intelligence report');
            }

            return data.report;
        } catch (error) {
            console.error('[MemoryApi] Error getting intelligence report:', error);
            throw error;
        }
    }

    async getConflicts() {
        try {
            const response = await fetch(`${this.baseUrl}/conflicts`, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to get conflicts');
            }

            return data.conflicts;
        } catch (error) {
            console.error('[MemoryApi] Error getting conflicts:', error);
            throw error;
        }
    }

    async getDuplicates() {
        try {
            const response = await fetch(`${this.baseUrl}/duplicates`, {
                headers: this.getAuthHeader()
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to get duplicates');
            }

            return data.duplicates;
        } catch (error) {
            console.error('[MemoryApi] Error getting duplicates:', error);
            throw error;
        }
    }
}

export default new MemoryApi();
