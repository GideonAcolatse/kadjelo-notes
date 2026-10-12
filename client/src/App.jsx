import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Pin,
  FileText,
  FilterX,
  PlusCircle,
  RotateCcw,
  X
} from 'lucide-react';
import { useNotes } from './context/NotesContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import QuickCaptureBar from './components/QuickCaptureBar.jsx';
import NoteCard from './components/NoteCard.jsx';
import NoteEditor from './components/NoteEditor.jsx';
import KanbanBoard from './components/KanbanBoard.jsx';
import KnowledgeGraph from './components/KnowledgeGraph.jsx';
import SketchModal from './components/SketchModal.jsx';
import FlashcardModal from './components/FlashcardModal.jsx';
import ShareCardModal from './components/ShareCardModal.jsx';
import PomodoroWidget from './components/PomodoroWidget.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import LockModal from './components/LockModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import PwaInstallPrompt from './components/PwaInstallPrompt.jsx';

export default function App() {
  const {
    viewMode,
    filteredNotes,
    activeNote,
    activeNav,
    selectedCategory,
    setSelectedCategory,
    selectedTag,
    setSelectedTag,
    selectedColor,
    setSelectedColor,
    searchQuery,
    setSearchQuery,
    createNote,
    isEditorModalOpen,
    setIsEditorModalOpen,
    toast,
    setToast
  } = useNotes();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned);

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedTag(null);
    setSelectedColor('all');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Left Translucent Sidebar & Mobile Bottom Bar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <TopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 px-4 md:px-6 pt-5 max-w-[1600px] w-full mx-auto">
          {/* Speed-First Inline Quick Capture (shown in main views) */}
          {activeNav !== 'trash' && <QuickCaptureBar />}

          {/* Active View Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <h1 className="type-display text-[var(--text-primary)]">
                {activeNav === 'trash'
                  ? 'Trash Bin'
                  : activeNav === 'archive'
                  ? 'Archived Notes'
                  : activeNav === 'pinned'
                  ? 'Pinned Notes'
                  : activeNav === 'locked'
                  ? 'Privacy Vault'
                  : activeNav === 'reminders'
                  ? 'Reminders'
                  : selectedCategory !== 'All'
                  ? `${selectedCategory} Notes`
                  : 'All Notes'}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                {filteredNotes.length}
              </span>
            </div>

            {(selectedCategory !== 'All' ||
              selectedTag ||
              selectedColor !== 'all' ||
              searchQuery) && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-xs font-semibold text-[var(--text-secondary)] pressable"
              >
                <FilterX size={13} strokeWidth={1.75} />
                Reset Filters
              </button>
            )}
          </div>

          {/* Empty State with Dead-End Mitigation */}
          {filteredNotes.length === 0 ? (
            <div className="liquid-card rounded-2xl p-12 text-center max-w-md mx-auto my-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)] flex items-center justify-center mx-auto">
                <FileText size={24} strokeWidth={1.75} />
              </div>
              <h2 className="text-base font-bold">No Matching Notes Found</h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {searchQuery
                  ? `No notes matched "${searchQuery}". You can clear your filters or create a new note with this title immediately.`
                  : 'Your current view is empty. Capture a thought above or spawn a template to get started.'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                {(searchQuery ||
                  selectedCategory !== 'All' ||
                  selectedTag ||
                  selectedColor !== 'all') && (
                  <button
                    onClick={resetAllFilters}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] text-xs font-semibold pressable"
                  >
                    <FilterX size={14} strokeWidth={1.75} />
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={async () => {
                    await createNote({ title: searchQuery || '' });
                    setSearchQuery('');
                    if (viewMode !== 'split') setIsEditorModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-accent text-xs font-semibold pressable"
                >
                  <PlusCircle size={14} strokeWidth={2} />
                  {searchQuery
                    ? `Create "${searchQuery.slice(0, 20)}"`
                    : 'Create First Note'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* VIEW 1: BENTO / MASONRY CARD GRID */}
              {viewMode === 'grid' && (
                <div className="space-y-6">
                  {pinnedNotes.length > 0 && (
                    <section className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        <Pin
                          size={13}
                          strokeWidth={2}
                          className="text-[var(--accent-primary)]"
                        />
                        Pinned ({pinnedNotes.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence>
                          {pinnedNotes.map((note) => (
                            <NoteCard key={note.id} note={note} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </section>
                  )}

                  {unpinnedNotes.length > 0 && (
                    <section className="space-y-2.5">
                      {pinnedNotes.length > 0 && (
                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Other Notes ({unpinnedNotes.length})
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence>
                          {unpinnedNotes.map((note) => (
                            <NoteCard key={note.id} note={note} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* VIEW 2: SPLIT-PANE FOCUS EDITOR (Apple Notes / Bear Layout) */}
              {viewMode === 'split' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  <div className="lg:col-span-4 space-y-2.5 max-h-[78vh] overflow-y-auto pr-1">
                    {filteredNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        isCompact
                        isSelected={activeNote?.id === note.id}
                      />
                    ))}
                  </div>
                  <div className="lg:col-span-8 sticky top-20">
                    <NoteEditor note={activeNote} isModal={false} />
                  </div>
                </div>
              )}

              {/* VIEW 3: KANBAN WORKFLOW BOARD */}
              {viewMode === 'kanban' && <KanbanBoard />}

              {/* VIEW 4: SECOND-BRAIN KNOWLEDGE GRAPH */}
              {viewMode === 'graph' && <KnowledgeGraph />}
            </>
          )}
        </main>
      </div>

      {/* Modal Note Editor (for Grid / Kanban / Graph views) */}
      <AnimatePresence>
        {isEditorModalOpen && viewMode !== 'split' && activeNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs"
            onClick={() => setIsEditorModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
              className="w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <NoteEditor
                note={activeNote}
                isModal
                onClose={() => setIsEditorModalOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Power Modals & Widgets */}
      <SketchModal />
      <FlashcardModal />
      <ShareCardModal />
      <CommandPalette />
      <LockModal />
      <AuthModal />
      <ConfirmDialog />
      <PomodoroWidget />
      <PwaInstallPrompt />

      {/* Floating Liquid Glass Toast with 5-Second Undo Support */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full liquid-glass-heavy border border-[var(--border-specular)] shadow-2xl"
          >
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {toast.message}
            </span>
            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction();
                  setToast(null);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full btn-accent text-[11px] font-bold pressable"
              >
                <RotateCcw size={12} strokeWidth={2.2} />
                Undo
              </button>
            )}
            <button
              onClick={() => setToast(null)}
              className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Dismiss notification"
            >
              <X size={13} strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
