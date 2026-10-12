import React, { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';

export default function PomodoroWidget() {
  const { activeNote, updateNote, showToast } = useNotes();
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' (25m) | 'break' (5m)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          if (mode === 'focus' && activeNote) {
            updateNote(activeNote.id, {
              focusMinutes: (activeNote.focusMinutes || 0) + 25
            });
            showToast(`+25m Focus logged to "${activeNote.title || 'Note'}"`);
          }
          const nextMode = mode === 'focus' ? 'break' : 'focus';
          setMode(nextMode);
          return nextMode === 'focus' ? 25 * 60 : 5 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, mode, activeNote, updateNote, showToast]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const logFiveMinutesNow = () => {
    if (!activeNote) return;
    updateNote(activeNote.id, {
      focusMinutes: (activeNote.focusMinutes || 0) + 5
    });
    showToast(`Logged +5m focus to "${activeNote.title || 'Note'}"`);
  };

  return (
    <div className="fixed bottom-20 md:bottom-5 right-4 z-30">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full liquid-glass-heavy border border-[var(--border-specular)] text-xs font-semibold pressable"
          title="Open Pomodoro Focus Timer"
        >
          <Timer
            size={15}
            strokeWidth={2}
            className={running ? 'text-emerald-400 animate-pulse' : 'text-[var(--accent-primary)]'}
          />
          <span>
            {mins}:{secs}
          </span>
          <ChevronUp size={13} strokeWidth={2} className="text-[var(--text-muted)]" />
        </button>
      ) : (
        <div className="w-64 rounded-2xl liquid-glass-heavy p-3.5 space-y-3 border border-[var(--border-specular)]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold">
              <Timer size={14} strokeWidth={2} className="text-[var(--accent-primary)]" />
              Focus Timer ({mode === 'focus' ? '25m Work' : '5m Break'})
            </span>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 rounded-lg hover:bg-[var(--bg-subtle)] pressable"
            >
              <ChevronDown size={15} strokeWidth={2} />
            </button>
          </div>

          <div className="text-center py-1">
            <div className="text-3xl font-bold tracking-tight font-mono">
              {mins}:{secs}
            </div>
            {activeNote && (
              <div className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                Target: {activeNote.title || 'Untitled Note'} (
                {activeNote.focusMinutes || 0}m logged)
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl btn-accent text-xs font-semibold pressable"
            >
              {running ? (
                <>
                  <Pause size={13} strokeWidth={2} />
                  Pause
                </>
              ) : (
                <>
                  <Play size={13} strokeWidth={2} />
                  Start
                </>
              )}
            </button>

            <button
              onClick={() => {
                setRunning(false);
                setSecondsLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
              }}
              className="p-1.5 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] pressable"
              title="Reset timer"
            >
              <RotateCcw size={14} strokeWidth={1.75} />
            </button>

            <button
              onClick={logFiveMinutesNow}
              className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-subtle)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
              title="Quick log +5 minutes"
            >
              +5m
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
