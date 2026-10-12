import React, { useState, useEffect } from 'react';
import {
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';
import { aiService } from '../services/aiService.js';

export default function FlashcardModal() {
  const { studyDeckNote, setStudyDeckNote, showToast } = useNotes();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!studyDeckNote) return;
    const generated = aiService.generateFlashcards(
      studyDeckNote.title,
      studyDeckNote.content,
      studyDeckNote.checklist || []
    );
    setCards(generated);
    setCurrentIndex(0);
    setFlipped(false);
  }, [studyDeckNote]);

  if (!studyDeckNote) return null;

  const currentCard = cards[currentIndex];
  const masteredCount = cards.filter((c) => c.mastered).length;

  const toggleMastered = () => {
    if (!currentCard) return;
    setCards((prev) =>
      prev.map((c, idx) =>
        idx === currentIndex ? { ...c, mastered: !c.mastered } : c
      )
    );
    showToast(
      !currentCard.mastered ? 'Marked card as Mastered' : 'Marked for review'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl liquid-glass-heavy p-5 space-y-4 border border-[var(--border-specular)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
              <Layers size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold">3D Study Flashcard Deck</h3>
              <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-[260px]">
                {studyDeckNote.title || 'Study Note'} ({masteredCount}/{cards.length}{' '}
                Mastered)
              </p>
            </div>
          </div>
          <button
            onClick={() => setStudyDeckNote(null)}
            className="p-1.5 rounded-xl bg-[var(--bg-subtle)] pressable"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <HelpCircle
              size={28}
              strokeWidth={1.5}
              className="mx-auto text-[var(--text-muted)]"
            />
            <p className="text-xs text-[var(--text-secondary)]">
              Add lines with <code className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)]">Term :: Definition</code> or bullet points in your note to auto-generate flashcards.
            </p>
          </div>
        ) : (
          <>
            {/* Interactive Flip Card */}
            <div
              onClick={() => setFlipped((f) => !f)}
              className="relative min-h-[230px] rounded-2xl p-6 liquid-card border border-[var(--border-specular)] flex flex-col items-center justify-center text-center cursor-pointer select-none pressable"
            >
              <span className="type-micro uppercase px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] mb-3">
                {flipped ? 'Answer / Explanation' : `Question ${currentIndex + 1} of ${cards.length}`}
              </span>

              <p className="text-base font-semibold text-[var(--text-primary)] leading-relaxed">
                {flipped ? currentCard.answer : currentCard.question}
              </p>

              <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-5">
                <RotateCw size={12} strokeWidth={2} />
                Tap card to flip
              </span>
            </div>

            {/* Deck Controls */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => {
                  setCurrentIndex((i) => Math.max(0, i - 1));
                  setFlipped(false);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[var(--bg-subtle)] disabled:opacity-40 text-xs font-semibold pressable"
              >
                <ChevronLeft size={15} strokeWidth={2} />
                Prev
              </button>

              <button
                type="button"
                onClick={toggleMastered}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold pressable ${
                  currentCard?.mastered
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                <CheckCircle2 size={14} strokeWidth={2} />
                {currentCard?.mastered ? 'Mastered' : 'Mark as Mastered'}
              </button>

              <button
                type="button"
                disabled={currentIndex >= cards.length - 1}
                onClick={() => {
                  setCurrentIndex((i) => Math.min(cards.length - 1, i + 1));
                  setFlipped(false);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[var(--bg-subtle)] disabled:opacity-40 text-xs font-semibold pressable"
              >
                Next
                <ChevronRight size={15} strokeWidth={2} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
