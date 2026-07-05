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
    const {
        memories,
        loading,
        error,
        stats,
        createMemory,
        deleteMemory,
        searchMemories,
        fetchMemories,
        boostMemory,
        fetchEvolutionStats,
        recalculateAllImportance,
        semanticSearch,
        getRelatedMemories,
        getMemoryRelationships,
        getRelationshipTypes,
        getGraphStats,
        getContextPreview,
        getConnectedMemories
    } = useMemory();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMemory, setNewMemory] = useState({ category: 'preferences', content: '', confidence: 1.0 });
    const [searchResults, setSearchResults] = useState(null);
    const [evolutionStats, setEvolutionStats] = useState(null);
    const [showEvolutionPanel, setShowEvolutionPanel] = useState(false);
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [relatedMemories, setRelatedMemories] = useState([]);
    const [showRelatedPanel, setShowRelatedPanel] = useState(false);
    const [useSemanticSearch, setUseSemanticSearch] = useState(false);
    const [memoryRelationships, setMemoryRelationships] = useState([]);
    const [relationshipTypes, setRelationshipTypes] = useState([]);
    const [graphStats, setGraphStats] = useState(null);
    const [showGraphStats, setShowGraphStats] = useState(false);
    const [selectedMemoryRelationships, setSelectedMemoryRelationships] = useState([]);
    const [showMemoryRelationships, setShowMemoryRelationships] = useState(false);
    const [contextPreview, setContextPreview] = useState(null);
    const [showContextPreview, setShowContextPreview] = useState(false);
    const [connectedCount, setConnectedCount] = useState(0);
    const [intelligenceReport, setIntelligenceReport] = useState(null);
    const [showIntelligenceReport, setShowIntelligenceReport] = useState(false);

    useEffect(() => {
        fetchMemories();
        loadRelationshipTypes();
        loadGraphStats();
    }, [fetchMemories]);

    const loadRelationshipTypes = async () => {
        try {
            const types = await getRelationshipTypes();
            setRelationshipTypes(types);
        } catch (err) {
            console.error('Failed to load relationship types:', err);
        }
    };

    const loadGraphStats = async () => {
        try {
            const stats = await getGraphStats();
            setGraphStats(stats);
        } catch (err) {
            console.error('Failed to load graph stats:', err);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setSearchResults(null);
            fetchMemories(selectedCategory);
            return;
        }

        try {
            let results;
            if (useSemanticSearch) {
                results = await semanticSearch(searchQuery, 20);
            } else {
                results = await searchMemories(searchQuery);
            }
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

    const handleMemoryClick = async (memory) => {
        setSelectedMemory(memory);
        setShowRelatedPanel(true);
        try {
            const [related, preview] = await Promise.all([
                getRelatedMemories(memory.id),
                getContextPreview(memory.id)
            ]);
            setRelatedMemories(related);
            setContextPreview(preview);
        } catch (err) {
            console.error('Failed to fetch memory details:', err);
            setRelatedMemories([]);
            setContextPreview(null);
        }
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

    const handleBoostMemory = async (memoryId) => {
        try {
            await boostMemory(memoryId);
        } catch (err) {
            console.error('Failed to boost memory:', err);
        }
    };

    const handleToggleEvolutionPanel = async () => {
        if (!showEvolutionPanel) {
            try {
                const evoStats = await fetchEvolutionStats();
                setEvolutionStats(evoStats);
            } catch (err) {
                console.error('Failed to fetch evolution stats:', err);
            }
        }
        setShowEvolutionPanel(!showEvolutionPanel);
    };

    const handleRecalculate = async () => {
        if (!window.confirm('Recalculate importance for all memories? This may take a moment.')) return;
        try {
            const result = await recalculateAllImportance();
            alert(result.message);
        } catch (err) {
            console.error('Failed to recalculate:', err);
        }
    };

    const handleToggleIntelligenceReport = async () => {
        if (!showIntelligenceReport && !intelligenceReport) {
            try {
                const report = await getIntelligenceReport();
                setIntelligenceReport(report);
            } catch (err) {
                console.error('Failed to fetch intelligence report:', err);
                alert('Failed to load intelligence report');
                return;
            }
        }
        setShowIntelligenceReport(!showIntelligenceReport);
    };

    return (
        <div className="memories-page">
            <div className="memories-header">
                <h1>Memory Bank</h1>
                <p className="memories-subtitle">Your personal AI memory system</p>
            </div>

            <div className="search-mode-toggle">
                <label>
                    <input
                        type="checkbox"
                        checked={useSemanticSearch}
                        onChange={(e) => setUseSemanticSearch(e.target.checked)}
                    />
                    Use Semantic Search
                </label>
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
                <button
                    className="btn-evolution"
                    onClick={handleToggleEvolutionPanel}
                >
                    {showEvolutionPanel ? 'Hide' : 'Show'} Evolution Stats
                </button>
                <button
                    className="btn-graph-stats"
                    onClick={() => setShowGraphStats(!showGraphStats)}
                >
                    {showGraphStats ? 'Hide' : 'Show'} Graph Stats
                </button>
                <button
                    className="btn-intelligence"
                    onClick={handleToggleIntelligenceReport}
                >
                    {showIntelligenceReport ? 'Hide' : 'Show'} Intelligence Report
                </button>
                <button
                    className="btn-recalculate"
                    onClick={handleRecalculate}
                >
                    Recalculate All
                </button>
            </div>

            {showEvolutionPanel && evolutionStats && (
                <div className="evolution-panel">
                    <h3>Memory Evolution Statistics</h3>
                    <div className="evolution-stats-grid">
                        <div className="evolution-stat">
                            <span className="evolution-label">Avg Importance</span>
                            <span className="evolution-value">{(evolutionStats.averageImportance * 100).toFixed(0)}%</span>
                        </div>
                        <div className="evolution-stat">
                            <span className="evolution-label">Avg Access Count</span>
                            <span className="evolution-value">{evolutionStats.averageAccessCount.toFixed(1)}</span>
                        </div>
                        <div className="evolution-stat">
                            <span className="evolution-label">Recently Accessed</span>
                            <span className="evolution-value">{evolutionStats.recentlyAccessed}</span>
                        </div>
                        <div className="evolution-stat">
                            <span className="evolution-label">Stale Memories</span>
                            <span className="evolution-value">{evolutionStats.staleMemories}</span>
                        </div>
                    </div>
                </div>
            )}

            {showGraphStats && graphStats && (
                <div className="graph-stats-panel">
                    <h3>Knowledge Graph Statistics</h3>
                    <div className="graph-stats-grid">
                        <div className="graph-stat">
                            <span className="graph-stat-label">Total Relationships</span>
                            <span className="graph-stat-value">{graphStats.total_edges || 0}</span>
                        </div>
                        <div className="graph-stat">
                            <span className="graph-stat-label">Memories with Relationships</span>
                            <span className="graph-stat-value">{graphStats.memories_with_relationships || 0}</span>
                        </div>
                        <div className="graph-stat">
                            <span className="graph-stat-label">Average Confidence</span>
                            <span className="graph-stat-value">{((graphStats.average_confidence || 0) * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                    {graphStats.edges_by_type && graphStats.edges_by_type.length > 0 && (
                        <div className="edges-by-type">
                            <h4>Relationships by Type:</h4>
                            <div className="type-badges">
                                {graphStats.edges_by_type.map((type, idx) => (
                                    <span key={idx} className="relation-type-badge">
                                        {type.relation_type}: {type.count}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showIntelligenceReport && intelligenceReport && (
                <div className="intelligence-report-panel">
                    <h3>Memory Intelligence Report</h3>
                    <div className="intelligence-summary">
                        <div className="intelligence-stat">
                            <span className="intelligence-label">Health Score</span>
                            <span className={`intelligence-value ${intelligenceReport.summary.healthScore >= 80 ? 'good' : intelligenceReport.summary.healthScore >= 60 ? 'warning' : 'critical'}`}>
                                {intelligenceReport.summary.healthScore}%
                            </span>
                        </div>
                        <div className="intelligence-stat">
                            <span className="intelligence-label">Conflicts</span>
                            <span className={`intelligence-value ${intelligenceReport.summary.totalConflicts > 0 ? 'warning' : 'good'}`}>
                                {intelligenceReport.summary.totalConflicts}
                            </span>
                        </div>
                        <div className="intelligence-stat">
                            <span className="intelligence-label">Duplicates</span>
                            <span className={`intelligence-value ${intelligenceReport.summary.totalDuplicates > 0 ? 'warning' : 'good'}`}>
                                {intelligenceReport.summary.totalDuplicates}
                            </span>
                        </div>
                        <div className="intelligence-stat">
                            <span className="intelligence-label">Issues</span>
                            <span className={`intelligence-value ${intelligenceReport.summary.totalIssues > 0 ? 'info' : 'good'}`}>
                                {intelligenceReport.summary.totalIssues}
                            </span>
                        </div>
                    </div>

                    {intelligenceReport.conflicts.length > 0 && (
                        <div className="intelligence-section">
                            <h4>Conflicts Detected</h4>
                            <div className="conflicts-list">
                                {intelligenceReport.conflicts.map((conflict, idx) => (
                                    <div key={idx} className={`conflict-item severity-${conflict.severity}`}>
                                        <div className="conflict-header">
                                            <span className="conflict-category">{conflict.category}</span>
                                            <span className="conflict-severity">{conflict.severity}</span>
                                        </div>
                                        <div className="conflict-memories">
                                            <div className="conflict-memory">
                                                <strong>Memory 1:</strong> {conflict.memory1.content}
                                            </div>
                                            <div className="conflict-memory">
                                                <strong>Memory 2:</strong> {conflict.memory2.content}
                                            </div>
                                        </div>
                                        <div className="conflict-resolution">
                                            <strong>Suggestion:</strong> {conflict.suggestedResolution}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {intelligenceReport.duplicates.length > 0 && (
                        <div className="intelligence-section">
                            <h4>Duplicate Clusters</h4>
                            <div className="duplicates-list">
                                {intelligenceReport.duplicates.map((duplicate, idx) => (
                                    <div key={idx} className="duplicate-item">
                                        <div className="duplicate-header">
                                            <span className="duplicate-category">{duplicate.category}</span>
                                            <span className="duplicate-count">{duplicate.duplicates.length + 1} memories</span>
                                        </div>
                                        <div className="duplicate-primary">
                                            <strong>Primary:</strong> {duplicate.primaryMemory.content}
                                        </div>
                                        <div className="duplicate-list">
                                            {duplicate.duplicates.map((dup, dupIdx) => (
                                                <div key={dupIdx} className="duplicate-entry">
                                                    - {dup.content} ({(dup.similarity * 100).toFixed(0)}% similar)
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {intelligenceReport.consistencyIssues.length > 0 && (
                        <div className="intelligence-section">
                            <h4>Consistency Issues</h4>
                            <div className="issues-list">
                                {intelligenceReport.consistencyIssues.map((issue, idx) => (
                                    <div key={idx} className={`issue-item severity-${issue.severity}`}>
                                        <div className="issue-header">
                                            <span className="issue-layer">{issue.layer}</span>
                                            <span className="issue-severity">{issue.severity}</span>
                                        </div>
                                        <div className="issue-message">{issue.message}</div>
                                        <div className="issue-suggestion">{issue.suggestion}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {intelligenceReport.suggestions.length > 0 && (
                        <div className="intelligence-section">
                            <h4>Suggestions</h4>
                            <div className="suggestions-list">
                                {intelligenceReport.suggestions.map((suggestion, idx) => (
                                    <div key={idx} className={`suggestion-item priority-${suggestion.priority}`}>
                                        <div className="suggestion-description">{suggestion.description}</div>
                                        <div className="suggestion-details">{suggestion.details}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {intelligenceReport.conflicts.length === 0 &&
                        intelligenceReport.duplicates.length === 0 &&
                        intelligenceReport.consistencyIssues.length === 0 && (
                            <div className="intelligence-success">
                                ✓ No issues detected. Your memory system is healthy!
                            </div>
                        )}
                </div>
            )}

            {showRelatedPanel && selectedMemory && (
                <div className="related-panel">
                    <div className="related-panel-header">
                        <h3>Related Memories</h3>
                        <button onClick={() => setShowRelatedPanel(false)} className="btn-close">×</button>
                    </div>
                    <div className="related-panel-content">
                        <div className="selected-memory">
                            <h4>Selected Memory:</h4>
                            <p>{selectedMemory.content}</p>
                        </div>
                        {contextPreview && (
                            <div className="context-preview-section">
                                <div className="context-preview-header">
                                    <h4>Context Preview</h4>
                                    <span className="connected-count">
                                        {contextPreview.connected_count} connected
                                    </span>
                                </div>
                                <div className="context-preview-content">
                                    <pre>{contextPreview.preview}</pre>
                                </div>
                            </div>
                        )}
                        {relatedMemories.length > 0 ? (
                            <div className="related-memories-list">
                                <h4>Related:</h4>
                                {relatedMemories.map(related => (
                                    <div key={related.id} className="related-memory-item">
                                        <span className="related-category">{related.category}</span>
                                        <p>{related.content}</p>
                                        <span className="relationship-type">{related.relationship_type}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-related">No related memories found.</p>
                        )}
                    </div>
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
                        const isSemanticMatch = memory.semantic_score !== undefined;
                        return (
                            <div
                                key={memory.id}
                                className={`memory-card ${isSemanticMatch ? 'semantic-match' : ''}`}
                                onClick={() => handleMemoryClick(memory)}
                            >
                                <div className="memory-header">
                                    <span className="memory-category">
                                        {categoryInfo.icon} {categoryInfo.label}
                                    </span>
                                    <span className="memory-confidence">
                                        {(memory.confidence * 100).toFixed(0)}%
                                    </span>
                                    {memory.importance_score !== undefined && (
                                        <span className="memory-importance">
                                            Importance: {(memory.importance_score * 100).toFixed(0)}%
                                        </span>
                                    )}
                                    {isSemanticMatch && (
                                        <span className="semantic-badge" title="Semantic match">
                                            🎯 {(memory.semantic_score * 100).toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                                <div className="memory-content">
                                    {memory.content}
                                </div>
                                {memory.cluster_id && (
                                    <div className="memory-cluster">
                                        Cluster: {memory.cluster_id}
                                    </div>
                                )}
                                {memory.relationships && memory.relationships.length > 0 && (
                                    <div className="memory-relationships">
                                        <div className="relationships-header">
                                            <span>🔗 {memory.relationships.length} relationship{memory.relationships.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="relationships-list">
                                            {memory.relationships.slice(0, 3).map((rel, idx) => (
                                                <span key={idx} className="relationship-badge" title={`${rel.relation_type} (${(rel.confidence * 100).toFixed(0)}%)`}>
                                                    {rel.relation_type} {(rel.confidence * 100).toFixed(0)}%
                                                </span>
                                            ))}
                                            {memory.relationships.length > 3 && (
                                                <span className="relationship-more">+{memory.relationships.length - 3} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="memory-footer">
                                    <span className="memory-source">
                                        {memory.source === 'extracted' ? '🤖 Extracted' : '✋ Manual'}
                                    </span>
                                    {memory.access_count !== undefined && (
                                        <span className="memory-access-count">
                                            Used: {memory.access_count}x
                                        </span>
                                    )}
                                    {memory.last_accessed_at && (
                                        <span className="memory-last-accessed">
                                            Last used: {new Date(memory.last_accessed_at).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span className="memory-date">
                                        Created: {new Date(memory.created_at).toLocaleDateString()}
                                    </span>
                                    <button
                                        className="btn-boost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBoostMemory(memory.id);
                                        }}
                                        title="Boost importance"
                                    >
                                        ⬆️
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteMemory(memory.id);
                                        }}
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