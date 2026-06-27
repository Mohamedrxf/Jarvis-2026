import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/chat';
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const result = await register(username, email, password);

    if (result.success) {
      // Context auto-logs in after register; redirect handled by useEffect above
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-deep, #0a0f18)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%', maxWidth: '400px', padding: '40px',
        background: 'rgba(15, 20, 30, 0.8)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'sans-serif', color: '#fff', margin: '0 0 8px 0' }}>Jarvis 2026</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, fontFamily: 'monospace' }}>Create your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontFamily: 'sans-serif' }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" required style={{ width: '100%', padding: '12px 14px', background: 'rgba(8, 11, 17, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontFamily: 'sans-serif' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required style={{ width: '100%', padding: '12px 14px', background: 'rgba(8, 11, 17, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontFamily: 'sans-serif' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required style={{ width: '100%', padding: '12px 14px', background: 'rgba(8, 11, 17, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontFamily: 'sans-serif' }}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required style={{ width: '100%', padding: '12px 14px', background: 'rgba(8, 11, 17, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {error && (
            <div style={{ padding: '12px', marginBottom: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', fontFamily: 'sans-serif' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? 'rgba(0, 240, 255, 0.3)' : 'rgba(0, 240, 255, 0.15)', border: '1px solid rgba(0, 240, 255, 0.4)', borderRadius: '8px', color: loading ? '#6b7280' : '#fff', fontSize: '14px', fontWeight: 600, fontFamily: 'sans-serif', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxSizing: 'border-box' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#6b7280', fontFamily: 'sans-serif' }}>
          Already have an account?{' '}
          <span onClick={() => window.location.href = '/login'} style={{ color: '#00f0ff', cursor: 'pointer', textDecoration: 'underline' }}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
