/**
 * EmbeddingProvider Interface
 * Provides a unified interface for generating memory embeddings
 * Supports multiple embedding strategies with fallback
 */

class EmbeddingProvider {
    /**
     * Generate embedding for a text
     * @param {string} text - Text to embed
     * @returns {Promise<Array<number>>} Embedding vector
     */
    async generateEmbedding(text) {
        throw new Error('generateEmbedding() must be implemented by subclass');
    }

    /**
     * Generate embeddings for multiple texts (batch)
     * @param {Array<string>} texts - Texts to embed
     * @returns {Promise<Array<Array<number>>>} Array of embedding vectors
     */
    async generateEmbeddings(texts) {
        return Promise.all(texts.map(text => this.generateEmbedding(text)));
    }

    /**
     * Get embedding dimension
     * @returns {number} Dimension of embedding vectors
     */
    getDimension() {
        throw new Error('getDimension() must be implemented by subclass');
    }

    /**
     * Get provider name
     * @returns {string} Provider name
     */
    getName() {
        throw new Error('getName() must be implemented by subclass');
    }
}

/**
 * TF-IDF-based Embedding Provider (Fallback Strategy)
 * Uses term frequency-inverse document frequency for semantic representation
 * Works without external API dependencies
 */
class TFIDFEmbeddingProvider extends EmbeddingProvider {
    constructor() {
        super();
        this.dimension = 128; // Fixed dimension for TF-IDF vectors
        this.vocabulary = new Map();
        this.idfCache = new Map();
        this.documentCount = 0;
    }

    getName() {
        return 'tfidf-fallback';
    }

    getDimension() {
        return this.dimension;
    }

    /**
     * Tokenize text into words
     * @private
     */
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    /**
     * Update vocabulary and IDF scores with new documents
     * @param {Array<string>} documents - New documents to add to corpus
     */
    updateCorpus(documents) {
        documents.forEach(doc => {
            this.documentCount++;
            const tokens = this.tokenize(doc);
            const uniqueTokens = new Set(tokens);

            uniqueTokens.forEach(token => {
                this.vocabulary.set(token, (this.vocabulary.get(token) || 0) + 1);
            });
        });

        // Recalculate IDF for all terms
        this.vocabulary.forEach((docFreq, term) => {
            this.idfCache.set(term, Math.log(this.documentCount / (1 + docFreq)));
        });
    }

    /**
     * Generate TF-IDF embedding for text
     * @param {string} text - Text to embed
     * @returns {Promise<Array<number>>} TF-IDF vector
     */
    async generateEmbedding(text) {
        const tokens = this.tokenize(text);
        if (tokens.length === 0) {
            return new Array(this.dimension).fill(0);
        }

        // Calculate term frequencies
        const tf = new Map();
        tokens.forEach(token => {
            tf.set(token, (tf.get(token) || 0) + 1);
        });

        // Normalize TF
        const maxTf = Math.max(...tf.values());
        tf.forEach((count, term) => {
            tf.set(term, count / maxTf);
        });

        // Create embedding vector using hash-based approach
        const embedding = new Array(this.dimension).fill(0);

        tf.forEach((tfValue, term) => {
            const idf = this.idfCache.get(term) || Math.log(this.documentCount + 1);
            const tfidf = tfValue * idf;

            // Use multiple hash functions for better distribution
            for (let i = 0; i < 3; i++) {
                const hash = this.hashString(term + i.toString());
                const index = hash % this.dimension;
                embedding[index] += tfidf;
            }
        });

        // Normalize the vector
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
            for (let i = 0; i < this.dimension; i++) {
                embedding[i] /= magnitude;
            }
        }

        return embedding;
    }

    /**
     * Simple hash function for string
     * @private
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
}

/**
 * OpenAI-compatible Embedding Provider
 * Can work with OpenAI, local LLM servers, or any OpenAI-compatible API
 */
class OpenAIEmbeddingProvider extends EmbeddingProvider {
    constructor(config = {}) {
        super();
        this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
        this.apiUrl = config.apiUrl || 'https://api.openai.com/v1';
        this.model = config.model || 'text-embedding-3-small';
        this.dimension = config.dimension || 1536; // Default for text-embedding-3-small
    }

    getName() {
        return 'openai-compatible';
    }

    getDimension() {
        return this.dimension;
    }

    /**
     * Generate embedding using OpenAI-compatible API
     * @param {string} text - Text to embed
     * @returns {Promise<Array<number>>} Embedding vector
     */
    async generateEmbedding(text) {
        if (!this.apiKey) {
            throw new Error('API key not configured for OpenAI embedding provider');
        }

        try {
            const response = await fetch(`${this.apiUrl}/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    input: text
                })
            });

            if (!response.ok) {
                throw new Error(`Embedding API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data[0].embedding;
        } catch (error) {
            console.error('[EmbeddingProvider] Error generating embedding:', error.message);
            throw error;
        }
    }

    /**
     * Generate embeddings for multiple texts
     * @param {Array<string>} texts - Texts to embed
     * @returns {Promise<Array<Array<number>>>} Array of embedding vectors
     */
    async generateEmbeddings(texts) {
        if (!this.apiKey) {
            throw new Error('API key not configured for OpenAI embedding provider');
        }

        try {
            const response = await fetch(`${this.apiUrl}/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    input: texts
                })
            });

            if (!response.ok) {
                throw new Error(`Embedding API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data.map(item => item.embedding);
        } catch (error) {
            console.error('[EmbeddingProvider] Error generating embeddings:', error.message);
            throw error;
        }
    }
}

/**
 * Embedding Provider Factory
 * Creates appropriate provider based on configuration
 */
class EmbeddingProviderFactory {
    static create(config = {}) {
        const providerType = config.type || process.env.EMBEDDING_PROVIDER || 'tfidf';

        switch (providerType) {
            case 'openai':
            case 'openai-compatible':
                return new OpenAIEmbeddingProvider(config);
            case 'tfidf':
            default:
                return new TFIDFEmbeddingProvider();
        }
    }
}

module.exports = {
    EmbeddingProvider,
    TFIDFEmbeddingProvider,
    OpenAIEmbeddingProvider,
    EmbeddingProviderFactory
};