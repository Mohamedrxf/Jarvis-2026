import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import memoryApi from '../services/memoryApi';

const MemoryContext = createContext(null);

export const MemoryProvider = ({ children }) => {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

    // Fetch all memories
    const fetchMemories = useCallback(async (category = null) => {
        setLoading(true);
        setError(null);
        try {
            const data = await memoryApi.getMemories(category);
            setMemories(data);
        } catch (err) {
            setError(err.message);
            console.error('Failed to fetch memories:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create a new memory
    const createMemory = useCallback(async (category, content, confidence = 1.0, source = 'manual') => {
        setLoading(true);
        setError(null);
        try {
            const newMemory = await memoryApi.createMemory(category, content, confidence, source);
            setMemories(prev => [newMemory, ...prev]);
            return newMemory;
        } catch (err) {
            setError(err.message);
            console.error('Failed to create memory:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Update a memory
    const updateMemory = useCallback(async (memoryId, updates) => {
        setLoading(true);
        setError(null);
        try {
            const updatedMemory = await memoryApi.updateMemory(memoryId, updates);
            setMemories(prev => prev.map(m => m.id === memoryId ? updatedMemory : m));
            return updatedMemory;
        } catch (err) {
            setError(err.message);
            console.error('Failed to update memory:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete a memory
    const deleteMemory = useCallback(async (memoryId) => {
        setLoading(true);
        setError(null);
        try {
            await memoryApi.deleteMemory(memoryId);
            setMemories(prev => prev.filter(m => m.id !== memoryId));
        } catch (err) {
            setError(err.message);
            console.error('Failed to delete memory:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Search memories
    const searchMemories = useCallback(async (query) => {
        setLoading(true);
        setError(null);
        try {
            const results = await memoryApi.searchMemories(query);
            setMemories(results);
            return results;
        } catch (err) {
            setError(err.message);
            console.error('Failed to search memories:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Extract memories from a message
    const extractMemories = useCallback(async (message) => {
        setLoading(true);
        setError(null);
        try {
            const result = await memoryApi.extractMemories(message);
            // Refresh memories after extraction
            await fetchMemories();
            return result;
        } catch (err) {
            setError(err.message);
            console.error('Failed to extract memories:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchMemories]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const statsData = await memoryApi.getStats();
            setStats(statsData);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }, []);

    // Fetch ranked memories
    const fetchRankedMemories = useCallback(async (limit = 10) => {
        setLoading(true);
        setError(null);
        try {
            const rankedMemories = await memoryApi.getRankedMemories(limit);
            setMemories(rankedMemories);
            return rankedMemories;
        } catch (err) {
            setError(err.message);
            console.error('Failed to fetch ranked memories:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch evolution stats
    const fetchEvolutionStats = useCallback(async () => {
        try {
            const evolutionStats = await memoryApi.getEvolutionStats();
            return evolutionStats;
        } catch (err) {
            console.error('Failed to fetch evolution stats:', err);
            throw err;
        }
    }, []);

    // Boost memory importance
    const boostMemory = useCallback(async (memoryId) => {
        setLoading(true);
        setError(null);
        try {
            const boostedMemory = await memoryApi.boostMemory(memoryId);
            setMemories(prev => prev.map(m => m.id === memoryId ? boostedMemory : m));
            return boostedMemory;
        } catch (err) {
            setError(err.message);
            console.error('Failed to boost memory:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Recalculate all memory importance
    const recalculateAllImportance = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await memoryApi.recalculateAllImportance();
            await fetchMemories();
            return result;
        } catch (err) {
            setError(err.message);
            console.error('Failed to recalculate importance:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchMemories]);

    // Load memories on mount
    useEffect(() => {
        fetchMemories();
        fetchStats();
    }, [fetchMemories, fetchStats]);

    const value = {
        memories,
        loading,
        error,
        stats,
        fetchMemories,
        createMemory,
        updateMemory,
        deleteMemory,
        searchMemories,
        extractMemories,
        fetchStats,
        fetchRankedMemories,
        fetchEvolutionStats,
        boostMemory,
        recalculateAllImportance,
        clearError: () => setError(null)
    };

    return (
        <MemoryContext.Provider value={value}>
            {children}
        </MemoryContext.Provider>
    );
};

export const useMemory = () => {
    const context = useContext(MemoryContext);
    if (!context) {
        throw new Error('useMemory must be used within a MemoryProvider');
    }
    return context;
};