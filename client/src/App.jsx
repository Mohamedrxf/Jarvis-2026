import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Memories from './pages/Memories';
import { ConversationProvider } from './context/ConversationContext';
import { MemoryProvider } from './context/MemoryContext';

function App() {
  return (
    <BrowserRouter>
      <MemoryProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ConversationProvider>
                  <Chat />
                </ConversationProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/memories"
            element={
              <ProtectedRoute>
                <Memories />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/chat" replace />} />
        </Routes>
      </MemoryProvider>
    </BrowserRouter>
  );
}

export default App;
