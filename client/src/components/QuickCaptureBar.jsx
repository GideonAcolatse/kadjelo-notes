import React, { useState } from 'react';
import {
  Zap,
  Plus,
  CheckSquare,
  Sparkles,
  Calendar,
  Maximize2
} from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';
import { aiService } from '../services/aiService.js';

export default function QuickCaptureBar() {
  const {
    createNote,
    selectedCategory,
    openDailyScratchpad,
    setIsEditorModalOpen,
    showToast
  } = useNotes();

  const [text, setText] = useState('');
  const [isChecklistMode, setIsChecklistMode] = useState(false);

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      showToast('Type a quick thought or task before pressing Enter');
      return;
    }

    const { category: autoCategory, tags } = aiService.suggestCategoryAndTags(
      trimmed,
      trimmed
    );

    const payload = {
      title: trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed,
      content: isChecklistMode ? '' : trimmed,
      category: selectedCategory !== 'All' ? selectedCategory : autoCategory,
      tags,
      checklist: isChecklistMode
        ? [
            {
              id: `qc_${Date.now()}`,
              text: trimmed,
              completed: false
            }
          ]
        : []
    };

    await createNote(payload);
    setText('');
    showToast('Quick note captured');
  };

  return (
    <div className="mb-6">
      <form
        onSubmit={handleQuickSubmit}
        className="liquid-card rounded-2xl p-2.5 sm:px-4 sm:py-3 flex flex-wrap items-center gap-2.5 border border-[var(--border-specular)]"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-[210px]">
          <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)] shrink-0">
            <Zap size={16} strokeWidth={2} />
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              isChecklistMode
                ? 'Quick task: type an action item and press Enter...'
                : 'Quick Capture: jot an idea, link, or thought and press Enter...'
            }
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setIsChecklistMode((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold pressable ${
              isChecklistMode
                ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] border border-[var(--accent-primary)]'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
            }`}
            title="Toggle quick task checklist mode"
          >
            <CheckSquare size={14} strokeWidth={1.75} />
            <span className="hidden sm:inline">Task</span>
          </button>

          <button
            type="button"
            onClick={openDailyScratchpad}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
            title="Open Today's Daily Scratchpad"
          >
            <Calendar size={14} strokeWidth={1.75} />
            <span className="hidden sm:inline">Today</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await createNote({
                title: text.trim() || '',
                content: ''
              });
              setText('');
              setIsEditorModalOpen(true);
            }}
            className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
            title="Open Full Multi-Modal Editor"
          >
            <Maximize2 size={14} strokeWidth={1.75} />
          </button>

          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl btn-accent text-xs font-semibold pressable"
          >
            <Plus size={15} strokeWidth={2.2} />
            <span>Capture</span>
          </button>
        </div>
      </form>
    </div>
  );
}
