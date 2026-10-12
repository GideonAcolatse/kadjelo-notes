import React, { useState } from 'react';
import {
  Cloud,
  X,
  LogIn,
  UserPlus,
  RefreshCw,
  LogOut,
  Database
} from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';
import { apiService } from '../services/api.js';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    user,
    setUser,
    cloudStatus,
    syncWithNeonCloud,
    logoutUser,
    showToast
  } = useNotes();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res =
        mode === 'register'
          ? await apiService.register(name, email, password)
          : await apiService.login(email, password);
      setUser(res.user);
      showToast(`Signed in as ${res.user.name}`);
      await syncWithNeonCloud();
      setIsAuthModalOpen(false);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl liquid-glass-heavy p-5 space-y-4 border border-[var(--border-specular)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
              <Cloud size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                Neon PostgreSQL Cloud Sync
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {cloudStatus.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-xl bg-[var(--bg-subtle)] pressable"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {user ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
              <div className="text-xs font-bold text-[var(--text-primary)]">
                {user.name}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {user.email}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={syncWithNeonCloud}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl btn-accent text-xs font-semibold pressable"
              >
                <RefreshCw size={14} strokeWidth={2} />
                Sync Notes Now
              </button>
              <button
                onClick={() => {
                  logoutUser();
                  setIsAuthModalOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/15 text-rose-400 text-xs font-semibold pressable"
              >
                <LogOut size={14} strokeWidth={1.75} />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex p-1 rounded-xl bg-[var(--bg-subtle)]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold pressable ${
                  mode === 'login' ? 'btn-accent text-white' : 'text-[var(--text-secondary)]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold pressable ${
                  mode === 'register'
                    ? 'btn-accent text-white'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Create Account
              </button>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Gideon Acolatse"
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-accent text-xs font-semibold pressable"
            >
              {mode === 'register' ? (
                <>
                  <UserPlus size={15} strokeWidth={2} />
                  {loading ? 'Creating Account...' : 'Create Cloud Account'}
                </>
              ) : (
                <>
                  <LogIn size={15} strokeWidth={2} />
                  {loading ? 'Signing In...' : 'Sign In & Sync Notes'}
                </>
              )}
            </button>

            <div className="flex items-start gap-2 pt-2 text-[11px] text-[var(--text-muted)]">
              <Database size={14} strokeWidth={1.75} className="shrink-0 mt-0.5" />
              <span>
                All local notes work 100% offline automatically. Connect your{' '}
                <code>DATABASE_URL</code> in <code>.env</code> to sync across devices via Neon Serverless PostgreSQL.
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
