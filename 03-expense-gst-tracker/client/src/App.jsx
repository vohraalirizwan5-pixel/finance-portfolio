import { useState } from 'react';
import { auth } from './api.js';
import AuthPage from './components/AuthPage.jsx';
import Dashboard from './components/Dashboard.jsx';

const USER_KEY = 'egt_user';

export default function App() {
  const [user, setUser] = useState(() => {
    if (!auth.token) return null;
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  });

  function handleLogin({ token, user }) {
    auth.save(token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setUser(user);
  }

  function handleLogout() {
    auth.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return user
    ? <Dashboard user={user} onLogout={handleLogout} />
    : <AuthPage onLogin={handleLogin} />;
}
