import React, { useState, useEffect } from 'react';
import {
  Lock,
  Fingerprint,
  X,
  ShieldAlert,
  Check
} from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';
import {
  hashPin,
  isBiometricAvailable,
  verifyBiometricPasskey
} from '../services/biometricService.js';

export default function LockModal() {
  const {
    lockModalState,
    setLockModalState,
    lockNoteWithPin,
    showToast
  } = useNotes();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(true);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricSupported);
  }, []);

  useEffect(() => {
    if (lockModalState.open) {
      setPin('');
      setError('');
    }
  }, [lockModalState.open]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const t = setInterval(() => {
      setCooldownSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownSeconds]);

  if (!lockModalState.open || !lockModalState.note) return null;

  const { mode, note, onSuccess } = lockModalState;

  const handleClose = () => {
    setLockModalState({ open: false, mode: 'unlock', note: null, onSuccess: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    if (pin.trim().length < 4) {
      setError('Please enter at least a 4-digit PIN.');
      return;
    }

    if (mode === 'set') {
      await lockNoteWithPin(note.id, pin, enableBiometric);
      handleClose();
      return;
    }

    // Unlock verification
    const enteredHash = await hashPin(pin);
    if (enteredHash === note.lockPinHash) {
      setFailedAttempts(0);
      handleClose();
      if (onSuccess) onSuccess();
      showToast('Note unlocked');
    } else {
      const nextFails = failedAttempts + 1;
      setFailedAttempts(nextFails);
      if (nextFails >= 3) {
        setCooldownSeconds(15);
        setError('3 failed PIN attempts. Wait 15 seconds before trying again.');
      } else {
        setError(`Incorrect PIN (${3 - nextFails} attempts remaining).`);
      }
    }
  };

  const handleBiometricUnlock = async () => {
    if (cooldownSeconds > 0) return;
    try {
      const ok = await verifyBiometricPasskey();
      if (ok) {
        handleClose();
        if (onSuccess) onSuccess();
        showToast('Biometric verification succeeded');
      }
    } catch (err) {
      setError(err.message || 'Biometric authentication cancelled or unavailable.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl liquid-glass-heavy p-5 space-y-4 border border-[var(--border-specular)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
              <Lock size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {mode === 'set' ? 'Lock Note in Privacy Vault' : 'Unlock Private Note'}
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-[200px]">
                {note.title || 'Untitled Note'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-[var(--bg-subtle)] pressable"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              {mode === 'set'
                ? 'Create 4-to-8 Digit Vault PIN'
                : 'Enter Vault PIN'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              disabled={cooldownSeconds > 0}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              placeholder="••••"
              className="w-full px-4 py-2.5 text-center text-lg tracking-[0.35em] font-mono rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          {mode === 'set' && biometricSupported && (
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={enableBiometric}
                onChange={(e) => setEnableBiometric(e.target.checked)}
                className="rounded accent-[var(--accent-primary)]"
              />
              <span>Allow FaceID / TouchID / Fingerprint unlock</span>
            </label>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/15 p-2.5 rounded-xl">
              <ShieldAlert size={14} strokeWidth={2} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={cooldownSeconds > 0}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl btn-accent text-xs font-semibold disabled:opacity-50 pressable"
          >
            <Check size={15} strokeWidth={2} />
            {cooldownSeconds > 0
              ? `Locked (${cooldownSeconds}s)`
              : mode === 'set'
              ? 'Enable Vault Lock'
              : 'Unlock with PIN'}
          </button>

          {mode === 'unlock' && (note.biometricEnabled || biometricSupported) && (
            <button
              type="button"
              onClick={handleBiometricUnlock}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] border border-[var(--border-subtle)] text-xs font-semibold pressable"
            >
              <Fingerprint
                size={16}
                strokeWidth={1.75}
                className="text-[var(--accent-primary)]"
              />
              Unlock with FaceID / Fingerprint
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
