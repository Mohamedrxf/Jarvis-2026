import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Send, Terminal, Settings, Mic, MicOff, Cpu, Layers, Bot, User, RefreshCw,
  AlertTriangle, Compass, Database
} from 'lucide-react';
import '../App.css';

function Chat() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [serverConfig, setServerConfig] = useState({ provider: 'mock', port: 5000 });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [llmProvider, setLlmProvider] = useState('mock');
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

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Send message
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const newUserMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newUserMessage]);
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

      setMessages((prev) => [...prev, newAssistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      const systemErrorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Error connecting to JARVIS core: ${error.message}. Please verify the server is running and configured correctly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, systemErrorMessage]);
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

  return (
    <div className="app-container">
      <div className="scanlines"></div>

      {/* Sidebar Panel */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-circle">
            <Terminal size={20} className="neon-text-cyan" />
          </div>
          <div className="logo-text">
            <h1>JARVIS</h1>
            <span>PERSONAL AI ASSISTANT</span>
          </div>
        </div>

        {/* System Diagnostics */}
        <div className="system-status">
          <h3 className="status-title">SYSTEM DIAGNOSTICS</h3>
          <div className="status-list">
            <div className="status-item">
              <span className="status-label">Core Status</span>
              <span className="status-value">
                <span className={`pulse-dot ${!isServerOnline ? 'offline' : ''}`}></span>
                {isServerOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">LLM Provider</span>
              <span className="status-value neon-text-cyan">
                {isServerOnline ? serverConfig.provider.toUpperCase() : 'N/A'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">AI Link Port</span>
              <span className="status-value">{isServerOnline ? serverConfig.port : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Memory & Context Preferences (Phase 4 mock preview) */}
        <div className="preferences-panel">
          <h3 className="status-title">ACTIVE CONTEXT</h3>
          <div className="glass-card pref-card">
            <h3><Database size={14} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--accent-cyan)' }} /> Memory Bank</h3>
            <p>SQLite Local Memory (Inactive in Phase 1). Memory will persist across sessions starting in Phase 4.</p>
          </div>
          <div className="glass-card pref-card">
            <h3><Layers size={14} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--accent-purple)' }} /> Core Directives</h3>
            <p>Be a helpful, highly responsive AI assistant. Speak in a sophisticated, slightly British manner.</p>
          </div>
        </div>

        {/* Session Info */}
        <div className="sidebar-footer">
          <div className="status-item">
            <span className="status-label">Session</span>
            <span className="status-value neon-text-cyan">SECURED</span>
          </div>
          <button
            id="btn_refresh"
            className="action-btn"
            title="Refresh Server Status"
            onClick={checkServerStatus}
          >
            <RefreshCw size={18} />
          </button>
          <button
            id="btn_settings"
            className="settings-btn"
            onClick={() => setShowConfigModal(true)}
          >
            <Settings size={18} style={{ marginRight: '10px' }} />
            AI Core Configuration
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <div className="chat-header">
          <div className="chat-title">
            <Bot size={24} className="neon-text-cyan" style={{ marginRight: '12px' }} />
            <span className="neon-text-cyan" style={{ fontSize: '18px', fontWeight: 600 }}>JARVIS</span>
          </div>
          <div className="chat-subtitle">
            <Compass size={14} style={{ marginRight: '6px' }} />
            {messages.length > 0 ? `${messages.length} messages in thread` : 'New conversation thread'}
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-muted)' }}>
              <AlertTriangle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', fontFamily: 'sans-serif', marginBottom: '8px' }}>No messages yet</p>
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

          {messages.length === 2 && !isLoading && (
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
            {/* Voice control placeholder for Phase 3 */}
            <button
              id="btn_voice_toggle"
              className="action-btn"
              title="Voice Input (Locked until Phase 3)"
              disabled
            >
              <MicOff size={18} style={{ opacity: 0.5 }} />
            </button>

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
