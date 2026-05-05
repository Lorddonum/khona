import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './UserAuthModal.css';

export default function UserAuthModal({ onClose, onSuccess }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.username, form.password);
      } else {
        if (form.password !== form.confirm) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await register(form.username, form.email, form.password);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal glass">
        {/* Close */}
        <button className="auth-modal__close" onClick={onClose} aria-label="Close">×</button>

        {/* Logo */}
        <div className="auth-modal__logo">
          <img src="/khona.png" alt="Khona" />
        </div>

        {/* Tabs */}
        <div className="auth-modal__tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
            id="auth-tab-login"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
            id="auth-tab-register"
          >
            Create Account
          </button>
        </div>

        <form className="auth-modal__form" onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
              id="auth-username"
            />
          </div>

          {/* Email — register only */}
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                id="auth-email"
              />
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={tab === 'register' ? 'At least 6 characters' : 'Enter password'}
              required
              id="auth-password"
            />
          </div>

          {/* Confirm password — register only */}
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-input"
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Repeat password"
                required
                id="auth-confirm"
              />
            </div>
          )}

          {error && <p className="auth-modal__error">{error}</p>}

          <button
            className="btn btn-primary auth-modal__submit"
            type="submit"
            disabled={loading}
            id="auth-submit"
          >
            {loading ? '...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-modal__switch">
          {tab === 'login' ? (
            <>No account? <button onClick={() => { setTab('register'); setError(''); }}>Create one</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setTab('login'); setError(''); }}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
