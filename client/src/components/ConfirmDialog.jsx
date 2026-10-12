import React from 'react';
import {
  AlertTriangle,
  Smartphone,
  Share2,
  PlusSquare,
  X
} from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';

export default function ConfirmDialog() {
  const {
    confirmState,
    setConfirmState,
    isPwaGuideOpen,
    setIsPwaGuideOpen
  } = useNotes();

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  return (
    <>
      {/* Permanent Delete Confirmation Modal */}
      {confirmState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl liquid-glass-heavy p-5 space-y-4 border border-[var(--border-specular)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <AlertTriangle size={20} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {confirmState.title}
                </h3>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {confirmState.message}
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={closeConfirm}
                className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] text-xs font-semibold pressable"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmState.onConfirm) confirmState.onConfirm();
                  closeConfirm();
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold pressable"
              >
                {confirmState.confirmLabel || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install Kadjelo Notes on Phone Guide Modal */}
      {isPwaGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl liquid-glass-heavy p-5 space-y-4 border border-[var(--border-specular)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                  <Smartphone size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    Install Kadjelo Notes on Your Phone
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Standalone Native Full-Screen PWA Experience
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPwaGuideOpen(false)}
                className="p-1.5 rounded-xl bg-[var(--bg-subtle)] pressable"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--text-secondary)]">
              <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5">
                <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Share2 size={14} strokeWidth={2} className="text-[var(--accent-primary)]" />
                  iPhone / iOS Safari
                </div>
                <p>
                  1. Tap the <strong>Share</strong> icon in the bottom Safari toolbar.
                  <br />
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5">
                <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <PlusSquare size={14} strokeWidth={2} className="text-[var(--accent-primary)]" />
                  Android Chrome / Desktop Edge & Chrome
                </div>
                <p>
                  1. Tap the browser menu (three dots) or the address bar install icon.
                  <br />
                  2. Select <strong>Install App</strong> or <strong>Add to Home screen</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPwaGuideOpen(false)}
              className="w-full py-2.5 rounded-xl btn-accent text-xs font-semibold pressable"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
