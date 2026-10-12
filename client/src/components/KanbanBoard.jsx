import React from 'react';
import {
  Circle,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Lock
} from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';

const COLUMNS = [
  {
    id: 'todo',
    title: 'To Do / Backlog',
    icon: Circle,
    accent: 'text-slate-400',
    badgeBg: 'bg-slate-500/15'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: Clock,
    accent: 'text-amber-400',
    badgeBg: 'bg-amber-500/15'
  },
  {
    id: 'done',
    title: 'Completed',
    icon: CheckCircle2,
    accent: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15'
  }
];

export default function KanbanBoard() {
  const {
    filteredNotes,
    updateNote,
    createNote,
    requestOpenNote,
    setIsEditorModalOpen,
    unlockedNoteIds
  } = useNotes();

  const moveStatus = (e, note, direction) => {
    e.stopPropagation();
    const order = ['todo', 'in_progress', 'done'];
    const currentIdx = order.indexOf(note.status || 'todo');
    const nextIdx = Math.max(0, Math.min(order.length - 1, currentIdx + direction));
    updateNote(note.id, { status: order[nextIdx] });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
      {COLUMNS.map((col, colIdx) => {
        const Icon = col.icon;
        const colNotes = filteredNotes.filter(
          (n) => (n.status || 'todo') === col.id
        );

        return (
          <div
            key={col.id}
            className="liquid-glass rounded-2xl p-3.5 flex flex-col min-h-[420px] border border-[var(--border-subtle)]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Icon size={16} strokeWidth={2} className={col.accent} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  {col.title}
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${col.badgeBg} text-[var(--text-primary)]`}
                >
                  {colNotes.length}
                </span>
              </div>

              <button
                onClick={async () => {
                  await createNote({ status: col.id });
                  setIsEditorModalOpen(true);
                }}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] pressable"
                title={`Add note to ${col.title}`}
              >
                <Plus size={15} strokeWidth={2} />
              </button>
            </div>

            {/* Cards Stack */}
            <div className="space-y-2.5 flex-1">
              {colNotes.length === 0 ? (
                <div className="h-36 rounded-xl border border-dashed border-[var(--border-subtle)] flex items-center justify-center text-xs text-[var(--text-muted)]">
                  No notes in {col.title}
                </div>
              ) : (
                colNotes.map((note) => {
                  const locked = note.isLocked && !unlockedNoteIds.has(note.id);
                  const doneCount = (note.checklist || []).filter(
                    (c) => c.completed
                  ).length;
                  const totalCount = note.checklist?.length || 0;

                  return (
                    <div
                      key={note.id}
                      onClick={() => requestOpenNote(note)}
                      className={`liquid-card rounded-xl p-3.5 note-tint-${
                        note.color || 'default'
                      } pressable space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                          {note.category}
                        </span>
                        <div className="flex items-center gap-1">
                          {colIdx > 0 && (
                            <button
                              onClick={(e) => moveStatus(e, note, -1)}
                              className="p-1 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-[var(--text-secondary)] pressable"
                              title="Move left"
                            >
                              <ArrowLeft size={12} strokeWidth={2} />
                            </button>
                          )}
                          {colIdx < COLUMNS.length - 1 && (
                            <button
                              onClick={(e) => moveStatus(e, note, 1)}
                              className="p-1 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-[var(--text-secondary)] pressable"
                              title="Move right"
                            >
                              <ArrowRight size={12} strokeWidth={2} />
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2">
                        {note.title || 'Untitled Note'}
                      </h3>

                      {locked ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 py-1">
                          <Lock size={13} strokeWidth={1.75} />
                          <span>Locked Note</span>
                        </div>
                      ) : (
                        <>
                          {note.content && (
                            <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                              {note.content.replace(/[#*`>-]/g, '').trim()}
                            </p>
                          )}
                          {totalCount > 0 && (
                            <div className="text-[11px] font-medium text-[var(--text-secondary)]">
                              Checklist: {doneCount}/{totalCount} completed
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
