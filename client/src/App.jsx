import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Terminal, 
  Settings, 
  Mic, 
  MicOff, 
  Cpu, 
  Layers, 
  Bot, 
  User, 
  RefreshCw, 
  AlertTriangle,
  Compass,
  Database
} from 'lucide-react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [serverConfig, setServerConfig] = useState({ provider: 'mock', port: 5000 });
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Local config edits (which can be sent to or set up on backend or just stored in localStorage/session)
  const [llmProvider, setLlmProvider] = useState('mock');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  
  const messagesEndRef = useRef(null);

  // Check server status
  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/status');
      if (response.ok) {
        const data = await response.json();
        setIsServerOnline(true);
        setServerConfig(data.status);
        setLlmProvider(data.status.provider);
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
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: chatHistory })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      const newAssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: data.response?.role || 'assistant',
        content: data.response?.content || 'No response returned.',
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

        {/* Sidebar Footer / Controls */}
        <div className="sidebar-footer">
          {!isServerOnline && (
            <div className="status-item" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
              <span className="status-value" style={{ color: '#ef4444', gap: '8px', fontSize: '12px' }}>
                <AlertTriangle size={14} /> Server offline. Run "npm run dev" in server/
              </span>
            </div>
          )}
          <button 
            id="btn_refresh_status" 
            className="settings-btn" 
            onClick={checkServerStatus}
          >
            <RefreshCw size={14} />
            <span>Check Core Connection</span>
          </button>
          
          <button 
            id="btn_open_settings" 
            className="settings-btn" 
            onClick={() => setShowConfigModal(true)}
          >
            <Settings size={14} />
            <span>AI Core Configuration</span>
          </button>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="chat-section">
        {/* Header */}
        <header className="chat-header">
          <div className="header-title">
            <h2>Assistant Terminal Interface</h2>
          </div>
          <div className="header-status">
            <Cpu size={16} className="neon-text-cyan" />
            <span>System Protocol v1.0.0</span>
          </div>
        </header>

        {/* Chat History */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <h2 className="welcome-title">I am JARVIS</h2>
              <p className="welcome-desc">
                Your modular, personal AI companion. I can process complex requests, adapt to your preferences, and simulate system automations.
              </p>
              <div className="starter-grid">
                <button 
                  id="starter_diagnostics" 
                  className="starter-btn"
                  onClick={() => handleStarterClick("Run system diagnostics")}
                >
                  <div className="btn-title">System Diagnostics</div>
                  <div className="btn-desc">Check active services and core response parameters.</div>
                </button>
                <button 
                  id="starter_hello" 
                  className="starter-btn"
                  onClick={() => handleStarterClick("Hello Jarvis, introduce yourself")}
                >
                  <div className="btn-title">Introduce Yourself</div>
                  <div className="btn-desc">Learn about my capabilities and current system limits.</div>
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                <div className="avatar-container">
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className="message-container">
                  <div className="message-bubble">
                    <p style={{ whiteSpace: 'pre-line' }}>{msg.content}</p>
                  </div>
                  <span className="message-time">{msg.timestamp}</span>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="message-wrapper assistant">
              <div className="avatar-container">
                <Bot size={18} />
              </div>
              <div className="message-container">
                <div className="message-bubble" style={{ padding: '12px 16px' }}>
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
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

export default App;
