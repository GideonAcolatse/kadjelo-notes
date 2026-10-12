import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Calendar,
  LayoutGrid,
  Columns,
  Kanban,
  Network,
  Sun,
  Moon,
  FileText,
  X
} from 'lucide-react';
import {
  useNotes,
  THEME_OPTIONS,
  NOTE_TEMPLATES
} from '../context/NotesContext.jsx';

export default function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    notes,
    requestOpenNote,
    createNote,
    setIsEditorModalOpen,
    openDailyScratchpad,
    createFromTemplate,
    setViewMode,
    colorMode,
    setColorMode,
    setThemeId
  } = useNotes();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const q = query.trim().toLowerCase();
  const matchingNotes = notes
    .filter(
      (n) =>
        !n.isTrashed &&
        ((n.title || '').toLowerCase().includes(q) ||
          (!n.isLocked && (n.content || '').toLowerCase().includes(q)) ||
          (n.category || '').toLowerCase().includes(q))
    )
    .slice(0, 6);

  const quickActions = [
    {
      id: 'act_new',
      label: 'Create New Note',
      icon: Plus,
      run: async () => {
        await createNote({});
        setIsEditorModalOpen(true);
      }
    },
    {
      id: 'act_daily',
      label: "Open Today's Daily Scratchpad",
      icon: Calendar,
      run: () => openDailyScratchpad()
    },
    {
      id: 'act_grid',
      label: 'Switch to Bento Grid View',
      icon: LayoutGrid,
      run: () => setViewMode('grid')
    },
    {
      id: 'act_split',
      label: 'Switch to Split-Pane Focus View',
      icon: Columns,
      run: () => setViewMode('split')
    },
    {
      id: 'act_kanban',
      label: 'Switch to Kanban Board View',
      icon: Kanban,
      run: () => setViewMode('kanban')
    },
    {
      id: 'act_graph',
      label: 'Open Second-Brain Knowledge Graph',
      icon: Network,
      run: () => setViewMode('graph')
    },
    {
      id: 'act_mode',
      label: `Toggle ${colorMode === 'dark' ? 'Light' : 'Dark'} Mode`,
      icon: colorMode === 'dark' ? Sun : Moon,
      run: () => setColorMode(colorMode === 'dark' ? 'light' : 'dark')
    }
  ].filter((a) => !q || a.label.toLowerCase().includes(q));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/65 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl liquid-glass-heavy border border-[var(--border-specular)] overflow-hidden shadow-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)]">
          <Search size={18} strokeWidth={1.75} className="text-[var(--accent-primary)]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search notes, categories, templates..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] pressable"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4">
          {/* Matching Notes */}
          {matchingNotes.length > 0 && (
            <div>
              <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Notes ({matchingNotes.length})
              </div>
              <div className="space-y-1">
                {matchingNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => {
                      requestOpenNote(note);
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--accent-soft)] text-left pressable"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <FileText
                        size={15}
                        strokeWidth={1.75}
                        className="text-[var(--accent-primary)] shrink-0"
                      />
                      <span className="text-xs font-semibold truncate">
                        {note.title || 'Untitled Note'}
                      </span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                      {note.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Workspace Actions */}
          {quickActions.length > 0 && (
            <div>
              <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Quick Commands
              </div>
              <div className="space-y-1">
                {quickActions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={() => {
                        act.run();
                        setIsCommandPaletteOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--accent-soft)] text-xs font-semibold text-left pressable"
                    >
                      <Icon size={15} strokeWidth={1.75} className="text-[var(--accent-primary)]" />
                      <span>{act.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Starter Templates & Themes */}
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Spawn Template or Switch Theme
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {NOTE_TEMPLATES.slice(0, 4).map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    createFromTemplate(tpl);
                    setIsCommandPaletteOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-left text-xs font-semibold pressable"
                >
                  Template: {tpl.name}
                </button>
              ))}
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setThemeId(theme.id);
                    setIsCommandPaletteOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-left text-xs font-medium text-[var(--text-secondary)] pressable"
                >
                  Theme: {theme.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
