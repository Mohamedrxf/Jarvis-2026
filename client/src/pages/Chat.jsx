import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../context/ConversationContext';
import ConversationSidebar from '../components/ConversationSidebar';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import voiceOutputService from '../services/voiceOutputService';
import {
  Send, Terminal, Settings, Mic, MicOff, Cpu, Layers, Bot, User, RefreshCw,
  AlertTriangle, Compass, Database, Menu, Loader2, Brain
} from 'lucide-react';
import VoiceButton from '../components/VoiceButton';
import '../App.css';

function Chat() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    conversations,
    activeConversationId,
    messages,
    loadingConversations,
    loadingMessages,
    creatingConversation,
    error,
    loadConversation,
    createConversation,
    saveMessage,
    setActiveConversationId,
    clearError
  } = useConversations();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [serverConfig, setServerConfig] = useState({ provider: 'mock', port: 5000 });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [llmProvider, setLlmProvider] = useState('mock');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filePanelOpen, setFilePanelOpen] = useState(false);
  const [refreshFiles, setRefreshFiles] = useState(0);
  const messagesEndRef = useRef(null);

  // Auth check: redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-deep, #0a0f18)', color: '#00f0ff', fontFamily: 'monospace', fontSize: '14px'
      }}>
        Initializing JARVIS...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check server status using api instance (axios with JWT interceptor)
  const checkServerStatus = async () => {
    try {
      const response = await api.get('/status');
      if (response.data.success) {
        setIsServerOnline(true);
        setServerConfig(response.data.status);
        setLlmProvider(response.data.status.provider);
      } else {
        setIsServerOnline(false);
      }
    } catch (error) {
      console.warn('Server offline:', error.message);
      setIsServerOnline(false);
    }
  };

  useEffect(() => {
    checkServerStatus();
    // Poll status every 10 seconds
    const interval = setInterval(checkServerStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Track last assistant message and speak it
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && window.speakResponse) {
        // Speak the response
        window.speakResponse(lastMessage.content);
      }
    }
  }, [messages.length]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [inputValue]);

  // Send message
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    if (!isServerOnline) {
      alert('Backend server is offline. Please check server status.');
      return;
    }

    // If no active conversation, create one first
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      try {
        const newConversation = await createConversation('New Conversation');
        currentConversationId = newConversation.id;
        setSidebarOpen(false);
      } catch (err) {
        console.error('Failed to create conversation:', err);
        alert('Failed to create conversation. Please try again.');
        return;
      }
    }

    const newUserMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setInputValue('');
    setIsLoading(true);

    // Prepare message history for backend API (we strip local UI fields like id and timestamp)
    const chatHistory = [...messages, newUserMessage].map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const response = await api.post('/chat', { messages: chatHistory });

      const newAssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: response.data.response?.role || 'assistant',
        content: response.data.response?.content || 'No response returned.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Auto-save both messages to backend
      if (currentConversationId) {
        // Save user message
        await saveMessage(currentConversationId, 'user', text);
        // Save assistant message
        await saveMessage(currentConversationId, 'assistant', newAssistantMessage.content);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      const systemErrorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Error connecting to JARVIS core: ${error.message}. Please verify the server is running and configured correctly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Still show the error message in UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputValue);
    }
  };

  const handleStarterClick = (question) => {
    handleSendMessage(question);
  };

  const handleNewChat = async () => {
    try {
      await createConversation('New Conversation');
      setSidebarOpen(false);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const getActiveConversationTitle = () => {
    if (!activeConversationId) return 'JARVIS';
    const conversation = conversations.find(c => c.id === activeConversationId);
    return conversation?.title || 'JARVIS';
  };

  return (
    <div className="app-container">
      <div className="scanlines"></div>

      {/* Mobile menu button */}
      <button
        id="btn_menu_toggle"
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ display: 'none' }}
      >
        <Menu size={24} />
      </button>

      {/* Conversation Sidebar */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <main className="chat-main">
        <div className="chat-header">
          <div className="chat-title">
            <Bot size={24} className="neon-text-cyan" style={{ marginRight: '12px' }} />
            <span className="neon-text-cyan" style={{ fontSize: '18px', fontWeight: 600 }}>
              {getActiveConversationTitle()}
            </span>
          </div>
          <div className="chat-subtitle">
            <Compass size={14} style={{ marginRight: '6px' }} />
            {messages.length > 0 ? `${messages.length} messages in thread` : 'New conversation thread'}
          </div>
          <button
            className="memory-nav-btn"
            onClick={() => navigate('/memories')}
            title="Memory Bank"
            style={{
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid #2563eb',
              color: '#2563eb',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <Brain size={16} />
            Memory Bank
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="chat-error-banner">
            <AlertTriangle size={16} style={{ marginRight: '8px' }} />
            {error}
            <button onClick={clearError} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Loading messages overlay */}
        {loadingMessages && (
          <div className="messages-loading-overlay">
            <Loader2 size={32} className="spin" style={{ color: '#00f0ff' }} />
            <span>Loading messages...</span>
          </div>
        )}

        <div className="chat-messages">
          {messages.length === 0 && !loadingMessages && (
            <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-muted)' }}>
              <AlertTriangle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', fontFamily: 'sans-serif', marginBottom: '8px' }}>
                {activeConversationId ? 'No messages in this conversation' : 'Select or create a conversation to begin'}
              </p>
              <p style={{ fontSize: '13px', fontFamily: 'monospace' }}>Initialize a command or question below</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? (
                  <User size={20} style={{ color: '#fff' }} />
                ) : (
                  <Bot size={20} style={{ color: '#00f0ff' }} />
                )}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-role">{msg.role === 'user' ? 'You' : 'JARVIS'}</span>
                  <span className="message-time">{msg.timestamp}</span>
                </div>
                <p className="message-text">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Loading / typing indicator */}
          {isLoading && (
            <div className="message assistant-message">
              <div className="message-avatar">
                <Bot size={20} style={{ color: '#00f0ff' }} />
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-role">JARVIS</span>
                </div>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}

          {messages.length === 2 && !isLoading && !loadingMessages && (
            <div className="starter-grid">
              <button className="starter-card" onClick={() => handleStarterClick('Summarize our conversation so far')}>
                <RefreshCw size={16} style={{ marginRight: '8px' }} />
                Summarize last thread
              </button>
              <button className="starter-card" onClick={() => handleStarterClick('Draft a professional follow-up email based on context')}>
                <Terminal size={16} style={{ marginRight: '8px' }} />
                Draft email follow-up
              </button>
              <button className="starter-card" onClick={() => handleStarterClick('Analyze my current project priorities')}>
                <Layers size={16} style={{ marginRight: '8px' }} />
                Analyze priorities
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="chat-input-container">
          <div className="chat-input-bar">
            {/* File panel toggle */}
            <button
              id="btn_file_panel_toggle"
              className="action-btn"
              onClick={() => setFilePanelOpen(!filePanelOpen)}
              title="File Manager"
              style={{
                color: filePanelOpen ? '#00f0ff' : 'var(--text-muted)'
              }}
            >
              <Database size={18} />
            </button>

            {/* Voice control - Phase 6 */}
            <VoiceButton
              onTranscript={(transcript) => {
                // Set the transcript as input value and send it
                setInputValue(transcript);
                handleSendMessage(transcript);
              }}
            />

            <input
              id="input_chat_message"
              type="text"
              className="chat-text-input"
              placeholder={isServerOnline ? "Send command or message..." : "Backend connection required..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading || !isServerOnline}
              autoComplete="off"
            />

            <button
              id="btn_send_message"
              className="action-btn send-btn"
              onClick={() => handleSendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim() || !isServerOnline}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* File Panel */}
        {filePanelOpen && (
          <div className="file-panel">
            <div className="file-panel-header">
              <h3>File Manager</h3>
              <button
                className="close-btn"
                onClick={() => setFilePanelOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="file-panel-content">
              <FileUpload onUploadComplete={() => setRefreshFiles(prev => prev + 1)} />
              <FileList refreshTrigger={refreshFiles} />
            </div>
          </div>
        )}
      </main>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="config-modal-overlay">
          <div className="glass-panel config-modal">
            <div className="modal-header">
              <h3>AI Core Configuration</h3>
              <button
                id="btn_close_settings"
                className="close-btn"
                onClick={() => setShowConfigModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Note: Phase 1 relies on environment variables set in `server/.env`. Use this screen to see the status and configure your key preferences.
            </p>

            <div className="form-group">
              <label>LLM Engine Provider</label>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                {llmProvider.toUpperCase()} (defined in server/.env)
              </div>
            </div>

            <div className="form-group">
              <label>Provider Configuration Instructions</label>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                To modify this, open the <code style={{ color: 'var(--accent-cyan)' }}>server/.env</code> file in your workspace and change the <code style={{ color: 'white' }}>LLM_PROVIDER</code> value to <code style={{ color: 'white' }}>openai</code> or <code style={{ color: 'white' }}>gemini</code>, then fill in the respective key.
              </div>
            </div>

            <button
              id="btn_close_settings_ok"
              className="save-btn"
              onClick={() => setShowConfigModal(false)}
            >
              Close Configurations
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;