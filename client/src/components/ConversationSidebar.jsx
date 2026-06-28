import { useState, useEffect } from 'react';
import { useConversations } from '../context/ConversationContext';
import {
    Plus, MessageSquare, Trash2, Edit2, Check, X, Menu, Loader2
} from 'lucide-react';
import './ConversationSidebar.css';

function ConversationSidebar({ isOpen, onClose }) {
    const {
        conversations,
        activeConversationId,
        loadingConversations,
        creatingConversation,
        loadConversations,
        createConversation,
        deleteConversation,
        renameConversation,
        setActiveConversationId
    } = useConversations();

    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [localError, setLocalError] = useState(null);

    // Refresh conversations when sidebar opens
    useEffect(() => {
        if (isOpen) {
            loadConversations();
        }
    }, [isOpen, loadConversations]);

    const handleNewChat = async () => {
        try {
            await createConversation('New Conversation');
            onClose?.();
        } catch (err) {
            setLocalError('Failed to create new conversation');
        }
    };

    const handleSelectConversation = (conversationId) => {
        setActiveConversationId(conversationId);
        onClose?.();
    };

    const handleDeleteClick = async (conversationId, e) => {
        e.stopPropagation();
        const confirmed = window.confirm(
            'Are you sure you want to delete this conversation? This action cannot be undone.'
        );
        if (!confirmed) return;

        setDeletingId(conversationId);
        setLocalError(null);
        try {
            await deleteConversation(conversationId);
        } catch (err) {
            setLocalError('Failed to delete conversation');
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditClick = (conversation, e) => {
        e.stopPropagation();
        setEditingId(conversation.id);
        setEditTitle(conversation.title);
        setLocalError(null);
    };

    const handleEditSave = async (conversationId) => {
        if (!editTitle.trim()) {
            setLocalError('Title cannot be empty');
            return;
        }

        try {
            await renameConversation(conversationId, editTitle.trim());
            setEditingId(null);
            setEditTitle('');
            setLocalError(null);
        } catch (err) {
            setLocalError('Failed to rename conversation');
        }
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditTitle('');
        setLocalError(null);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const sidebarContent = (
        <div className="conversation-sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-title">Conversations</h2>
                <button
                    id="btn_new_chat"
                    className="new-chat-btn"
                    onClick={handleNewChat}
                    disabled={creatingConversation}
                    title="New Chat"
                >
                    {creatingConversation ? (
                        <Loader2 size={18} className="spin" />
                    ) : (
                        <Plus size={18} />
                    )}
                    <span>New Chat</span>
                </button>
            </div>

            {localError && (
                <div className="sidebar-error">
                    {localError}
                    <button onClick={() => setLocalError(null)}>✕</button>
                </div>
            )}

            {loadingConversations ? (
                <div className="sidebar-loading">
                    <Loader2 size={24} className="spin" />
                    <span>Loading conversations...</span>
                </div>
            ) : conversations.length === 0 ? (
                <div className="sidebar-empty">
                    <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p>No conversations yet</p>
                    <p style={{ fontSize: '12px', opacity: 0.7 }}>Start a new chat to begin</p>
                </div>
            ) : (
                <div className="conversation-list">
                    {conversations.map((conversation) => (
                        <div
                            key={conversation.id}
                            className={`conversation-item ${activeConversationId === conversation.id ? 'active' : ''
                                }`}
                            onClick={() => handleSelectConversation(conversation.id)}
                        >
                            {editingId === conversation.id ? (
                                <div className="conversation-edit">
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleEditSave(conversation.id);
                                            if (e.key === 'Escape') handleEditCancel();
                                        }}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="edit-actions">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditSave(conversation.id);
                                            }}
                                            title="Save"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditCancel();
                                            }}
                                            title="Cancel"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="conversation-info">
                                        <MessageSquare size={16} className="conversation-icon" />
                                        <div className="conversation-details">
                                            <span className="conversation-title">{conversation.title}</span>
                                            <span className="conversation-time">
                                                {formatDate(conversation.updated_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="conversation-actions">
                                        <button
                                            onClick={(e) => handleEditClick(conversation, e)}
                                            title="Rename"
                                            className="action-icon-btn"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(conversation.id, e)}
                                            title="Delete"
                                            className="action-icon-btn delete"
                                            disabled={deletingId === conversation.id}
                                        >
                                            {deletingId === conversation.id ? (
                                                <Loader2 size={14} className="spin" />
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

            {/* Sidebar */}
            <div className={`conversation-sidebar-wrapper ${isOpen ? 'open' : ''}`}>
                {sidebarContent}
            </div>
        </>
    );
}

export default ConversationSidebar;