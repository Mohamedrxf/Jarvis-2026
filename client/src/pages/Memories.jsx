import { useState, useEffect } from 'react';
import { useMemory } from '../context/MemoryContext';
import './Memories.css';

const CATEGORIES = [
    { value: 'identity', label: 'Identity', icon: '👤' },
    { value: 'preferences', label: 'Preferences', icon: '❤️' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'work', label: 'Work', icon: '💼' },
    { value: 'goals', label: 'Goals', icon: '🎯' }
];

function Memories() {
    const { memories, loading, error, stats, createMemory, deleteMemory, searchMemories, fetchMemories } = useMemory();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMemory, setNewMemory] = useState({ category: 'preferences', content: '', confidence: 1.0 });
    const [searchResults, setSearchResults] = useState(null);

    useEffect(() => {
        fetchMemories();
    }, [fetchMemories]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setSearchResults(null);
            fetchMemories(selectedCategory);
            return;
        }

        try {
            const results = await searchMemories(searchQuery);
            setSearchResults(results);
        } catch (err) {
            console.error('Search failed:', err);
        }
    };

    const handleCategoryFilter = (category) => {
        setSelectedCategory(category);
        setSearchResults(null);
        setSearchQuery('');
        fetchMemories(category);
    };

    const handleAddMemory = async (e) => {
        e.preventDefault();
        if (!newMemory.content.trim()) return;

        try {
            await createMemory(newMemory.category, newMemory.content, newMemory.confidence);
            setNewMemory({ category: 'preferences', content: '', confidence: 1.0 });
            setShowAddForm(false);
        } catch (err) {
            console.error('Failed to add memory:', err);
        }
    };

    const handleDeleteMemory = async (memoryId) => {
        if (!window.confirm('Are you sure you want to delete this memory?')) return;

        try {
            await deleteMemory(memoryId);
        } catch (err) {
            console.error('Failed to delete memory:', err);
        }
    };

    const getCategoryInfo = (categoryValue) => {
        return CATEGORIES.find(cat => cat.value === categoryValue) || { label: categoryValue, icon: '📝' };
    };

    const displayMemories = searchResults || memories;

    return (
        <div className="memories-page">
            <div className="memories-header">
                <h1>Memory Bank</h1>
                <p className="memories-subtitle">Your personal AI memory system</p>
            </div>

            {stats && (
                <div className="memories-stats">
                    <div className="stat-card">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Memories</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{Object.keys(stats.byCategory || {}).length}</span>
                        <span className="stat-label">Categories</span>
                    </div>
                    {stats.averageConfidence > 0 && (
                        <div className="stat-card">
                            <span className="stat-value">{(stats.averageConfidence * 100).toFixed(0)}%</span>
                            <span className="stat-label">Avg Confidence</span>
                        </div>
                    )}
                </div>
            )}

            <div className="memories-controls">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Search memories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <button type="submit" className="btn-search">Search</button>
                    {searchQuery && (
                        <button
                            type="button"
                            className="btn-clear"
                            onClick={() => {
                                setSearchQuery('');
                                setSearchResults(null);
                                fetchMemories(selectedCategory);
                            }}
                        >
                            Clear
                        </button>
                    )}
                </form>

                <button
                    className="btn-add"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    {showAddForm ? 'Cancel' : '+ Add Memory'}
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddMemory} className="add-memory-form">
                    <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            value={newMemory.category}
                            onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value })}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.icon} {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="content">Memory Content</label>
                        <textarea
                            id="content"
                            value={newMemory.content}
                            onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                            placeholder="Enter memory content..."
                            rows="3"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confidence">Confidence: {(newMemory.confidence * 100).toFixed(0)}%</label>
                        <input
                            id="confidence"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={newMemory.confidence}
                            onChange={(e) => setNewMemory({ ...newMemory, confidence: parseFloat(e.target.value) })}
                        />
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading || !newMemory.content.trim()}>
                        {loading ? 'Saving...' : 'Save Memory'}
                    </button>
                </form>
            )}

            <div className="category-filters">
                <button
                    className={`filter-btn ${selectedCategory === null ? 'active' : ''}`}
                    onClick={() => handleCategoryFilter(null)}
                >
                    All
                </button>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        className={`filter-btn ${selectedCategory === cat.value ? 'active' : ''}`}
                        onClick={() => handleCategoryFilter(cat.value)}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)} className="error-close">×</button>
                </div>
            )}

            {loading && !showAddForm ? (
                <div className="loading">Loading memories...</div>
            ) : displayMemories.length === 0 ? (
                <div className="empty-state">
                    <p>No memories found.</p>
                    <p className="empty-hint">
                        {searchQuery ? 'Try a different search term.' : 'Add your first memory to get started!'}
                    </p>
                </div>
            ) : (
                <div className="memories-list">
                    {displayMemories.map(memory => {
                        const categoryInfo = getCategoryInfo(memory.category);
                        return (
                            <div key={memory.id} className="memory-card">
                                <div className="memory-header">
                                    <span className="memory-category">
                                        {categoryInfo.icon} {categoryInfo.label}
                                    </span>
                                    <span className="memory-confidence">
                                        {(memory.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="memory-content">
                                    {memory.content}
                                </div>
                                <div className="memory-footer">
                                    <span className="memory-source">
                                        {memory.source === 'extracted' ? '🤖 Extracted' : '✋ Manual'}
                                    </span>
                                    <span className="memory-date">
                                        {new Date(memory.updated_at).toLocaleDateString()}
                                    </span>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDeleteMemory(memory.id)}
                                        title="Delete memory"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Memories;