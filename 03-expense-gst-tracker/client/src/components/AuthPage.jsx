import { useState } from 'react';
import { api } from '../api.js';

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = mode === 'login' ? await api.login(form) : await api.register(form);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <form className="card auth-card" onSubmit={submit}>
        <h1>🧾 Expense & GST Tracker</h1>
        <p className="muted">Track business expenses and the GST you can claim back as input tax credit.</p>

        {mode === 'register' && (
          <label>Business / your name
            <input name="name" value={form.name} onChange={update} required />
          </label>
        )}
        <label>Email
          <input name="email" type="email" value={form.email} onChange={update} required />
        </label>
        <label>Password
          <input name="password" type="password" value={form.password} onChange={update} required
            minLength={mode === 'register' ? 8 : undefined} />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button className="btn primary" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>

        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? "New here? Create an account" : 'Already have an account? Log in'}
        </button>
        {mode === 'login' && <p className="muted small">Demo: demo@example.com / demo12345 (run <code>npm run seed</code> first)</p>}
      </form>
    </main>
  );
}
