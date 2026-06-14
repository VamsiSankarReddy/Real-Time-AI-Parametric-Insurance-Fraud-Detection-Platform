import { useState } from 'react';
import { login } from '../services/api';

export default function AuthPanel({ onAuth }) {
  const [username, setUsername] = useState('adjuster1');
  const [password, setPassword] = useState('adjuster123');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const result = await login(username, password);
      onAuth(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  }

  return (
    <form className="glass-panel card-animate mb-6 rounded-2xl p-4" onSubmit={handleSubmit}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">Operator Login</h2>
        <p className="font-mono text-xs text-slate-500">worker1 | adjuster1 | admin1</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          className="rounded-xl border border-slate-300 bg-white/80 px-3 py-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          className="rounded-xl border border-slate-300 bg-white/80 px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white">
          Login
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </form>
  );
}
