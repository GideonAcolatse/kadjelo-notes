import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';

export default function ConfirmDialog() {
  const {
    confirmState,
    setConfirmState
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
    </>
  );
}
