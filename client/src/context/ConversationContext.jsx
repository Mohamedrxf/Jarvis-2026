import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const ConversationContext = createContext(null);

export function ConversationProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [creatingConversation, setCreatingConversation] = useState(false);
    const [error, setError] = useState(null);

    // Load conversations on auth
    useEffect(() => {
        if (isAuthenticated) {
            loadConversations();
            // Restore last active conversation from localStorage
            const lastConversationId = localStorage.getItem('lastConversationId');
            if (lastConversationId) {
                loadConversation(parseInt(lastConversationId));
            }
        } else {
            // Clear state on logout
            setConversations([]);
            setActiveConversationId(null);
            setMessages([]);
            localStorage.removeItem('lastConversationId');
        }
    }, [isAuthenticated]);

    // Save active conversation to localStorage
    useEffect(() => {
        if (activeConversationId) {
            localStorage.setItem('lastConversationId', activeConversationId.toString());
        }
    }, [activeConversationId]);

    const loadConversations = useCallback(async () => {
        setLoadingConversations(true);
        setError(null);
        try {
            const response = await api.get('/conversations');
            if (response.data.success) {
                setConversations(response.data.conversations);
            }
        } catch (err) {
            console.error('Failed to load conversations:', err);
            setError('Failed to load conversations');
        } finally {
            setLoadingConversations(false);
        }
    }, []);

    const loadConversation = useCallback(async (conversationId) => {
        setLoadingMessages(true);
        setError(null);
        try {
            const response = await api.get(`/conversations/${conversationId}/messages`);
            if (response.data.success) {
                // Transform backend messages to UI format
                const transformedMessages = response.data.messages.map((msg) => ({
                    id: msg.id.toString(),
                    role: msg.role,
                    content: msg.content,
                    timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }));
                setMessages(transformedMessages);
                setActiveConversationId(conversationId);
            }
        } catch (err) {
            console.error('Failed to load messages:', err);
            setError('Failed to load messages');
            // If conversation not found, clear it
            if (err.response?.status === 404) {
                setActiveConversationId(null);
                setMessages([]);
            }
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    const createConversation = useCallback(async (title = 'New Conversation') => {
        setCreatingConversation(true);
        setError(null);
        try {
            const response = await api.post('/conversations', { title });
            if (response.data.success) {
                const newConversation = response.data.conversation;
                setConversations((prev) => [newConversation, ...prev]);
                setActiveConversationId(newConversation.id);
                setMessages([]);
                return newConversation;
            }
        } catch (err) {
            console.error('Failed to create conversation:', err);
            setError('Failed to create conversation');
            throw err;
        } finally {
            setCreatingConversation(false);
        }
    }, []);

    const deleteConversation = useCallback(async (conversationId) => {
        try {
            const response = await api.delete(`/conversations/${conversationId}`);
            if (response.data.success) {
                setConversations((prev) => prev.filter((c) => c.id !== conversationId));
                if (activeConversationId === conversationId) {
                    setActiveConversationId(null);
                    setMessages([]);
                }
                return true;
            }
        } catch (err) {
            console.error('Failed to delete conversation:', err);
            setError('Failed to delete conversation');
            throw err;
        }
        return false;
    }, [activeConversationId]);

    const renameConversation = useCallback(async (conversationId, newTitle) => {
        try {
            const response = await api.put(`/conversations/${conversationId}`, { title: newTitle });
            if (response.data.success) {
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === conversationId
                            ? { ...c, title: response.data.conversation.title, updated_at: response.data.conversation.updated_at }
                            : c
                    )
                );
                return true;
            }
        } catch (err) {
            console.error('Failed to rename conversation:', err);
            setError('Failed to rename conversation');
            throw err;
        }
        return false;
    }, []);

    const saveMessage = useCallback(async (conversationId, role, content) => {
        try {
            const response = await api.post(`/conversations/${conversationId}/messages`, { role, content });
            if (response.data.success) {
                // Update conversation's updated_at in local state
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === conversationId
                            ? { ...c, updated_at: response.data.message.created_at }
                            : c
                    )
                );
                return response.data.message;
            }
        } catch (err) {
            console.error('Failed to save message:', err);
            // Don't throw - we don't want to break the chat flow
            return null;
        }
        return null;
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = {
        conversations,
        activeConversationId,
        messages,
        loadingConversations,
        loadingMessages,
        creatingConversation,
        error,
        loadConversations,
        loadConversation,
        createConversation,
        deleteConversation,
        renameConversation,
        saveMessage,
        setActiveConversationId,
        clearError
    };

    return (
        <ConversationContext.Provider value={value}>
            {children}
        </ConversationContext.Provider>
    );
}

export function useConversations() {
    const context = useContext(ConversationContext);
    if (!context) {
        throw new Error('useConversations must be used within a ConversationProvider');
    }
    return context;
}