import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Pin,
  Lock,
  Unlock,
  Archive,
  Trash2,
  RotateCcw,
  CheckSquare,
  Layers,
  Share2,
  Clock,
  Image as ImageIcon,
  AudioLines,
  Hash,
  Bell,
  Link2
} from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';

export default function NoteCard({ note, isCompact = false, isSelected = false }) {
  const {
    unlockedNoteIds,
    requestOpenNote,
    togglePin,
    toggleArchive,
    moveToTrash,
    restoreFromTrash,
    permanentlyDeleteNote,
    setStudyDeckNote,
    setShareCardNote,
    setLockModalState,
    removeNoteLock
  } = useNotes();

  const [dragOffset, setDragOffset] = useState(0);
  const startXRef = useRef(null);

  const isLockedAndHidden = note.isLocked && !unlockedNoteIds.has(note.id);
  const checklistTotal = note.checklist?.length || 0;
  const checklistDone = (note.checklist || []).filter((c) => c.completed).length;
  const checklistPercent =
    checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  const wikiLinkMatches = Array.from(
    (note.content || '').matchAll(/\[\[([^\]]+)\]\]/g)
  ).map((m) => m[1]);

  const imageAttachments = (note.attachments || []).filter(
    (a) => a.type === 'image' || a.type === 'sketch'
  );
  const audioAttachments = (note.attachments || []).filter((a) => a.type === 'audio');

  // Direct-Manipulation 1:1 Mobile Touch Swipe Gestures (apple-design §2 & §10)
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      startXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e) => {
    if (startXRef.current === null || !e.touches?.[0]) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    if (Math.abs(deltaX) > 12) {
      // Progressive rubber-band resistance past 95px
      const clamped = Math.max(-110, Math.min(110, deltaX * 0.75));
      setDragOffset(clamped);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 70 && !note.isTrashed) {
      togglePin(note.id);
    } else if (dragOffset < -70 && !note.isTrashed) {
      moveToTrash(note.id);
    }
    setDragOffset(0);
    startXRef.current = null;
  };

  const formattedDate = new Date(note.updatedAt || note.createdAt).toLocaleDateString(
    undefined,
    { month: 'short', day: 'numeric' }
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1, x: dragOffset }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => requestOpenNote(note)}
      className={`group relative rounded-2xl p-4 liquid-card note-tint-${
        note.color || 'default'
      } pressable flex flex-col justify-between gap-3 ${
        isSelected ? 'ring-2 ring-[var(--accent-primary)]' : ''
      }`}
    >
      {/* Top Meta Row: Category Badge + Pin/Lock Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="type-micro px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            {note.category || 'Personal'}
          </span>

          {note.focusMinutes > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
              title="Pomodoro Focus Minutes"
            >
              <Clock size={11} strokeWidth={2} className="text-[var(--accent-primary)]" />
              {note.focusMinutes}m
            </span>
          )}

          {note.reminderAt && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
              <Bell size={11} strokeWidth={2} />
            </span>
          )}
        </div>

        {!note.isTrashed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePin(note.id);
            }}
            className={`p-1.5 rounded-lg pressable ${
              note.isPinned
                ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                : 'opacity-70 md:opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
            }`}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin size={14} strokeWidth={2} className={note.isPinned ? 'fill-current' : ''} />
          </button>
        )}
      </div>

      {/* Title */}
      <div>
        <h3 className="type-card-title text-[var(--text-primary)] line-clamp-2">
          {note.title || 'Untitled Note'}
        </h3>
      </div>

      {/* Body or Privacy Vault Shield */}
      {isLockedAndHidden ? (
        <div className="relative my-1 py-6 px-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-specular)] backdrop-blur-md flex flex-col items-center justify-center text-center gap-1.5">
          <div className="p-2.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)]">
            <Lock size={20} strokeWidth={1.75} />
          </div>
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            Locked in Privacy Vault
          </span>
          <span className="text-[11px] text-[var(--text-secondary)]">
            Tap to unlock with PIN or Biometrics
          </span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Optical 1.7s Scan Excerpt */}
          {note.content && (
            <p
              className={`text-xs text-[var(--text-secondary)] leading-relaxed ${
                isCompact ? 'line-clamp-2' : 'line-clamp-4'
              } whitespace-pre-line`}
            >
              {note.content.replace(/[#*`>-]/g, '').trim()}
            </p>
          )}

          {/* First Image/Sketch Thumbnail Preview */}
          {!isCompact && imageAttachments.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] max-h-36 bg-black/20">
              <img
                src={imageAttachments[0].dataUrl}
                alt={imageAttachments[0].name || 'Note attachment'}
                className="w-full h-32 object-cover"
              />
            </div>
          )}

          {/* Interactive Checklist Progress Bar */}
          {checklistTotal > 0 && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1 font-medium">
                  <CheckSquare size={12} strokeWidth={2} className="text-[var(--accent-primary)]" />
                  Checklist
                </span>
                <span className="font-semibold">
                  {checklistDone}/{checklistTotal} ({checklistPercent}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${checklistPercent}%`,
                    background:
                      'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))'
                  }}
                />
              </div>
            </div>
          )}

          {/* Media & Wiki-Link Micro Badges */}
          {(wikiLinkMatches.length > 0 || audioAttachments.length > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {wikiLinkMatches.slice(0, 2).map((linkTitle) => (
                <span
                  key={linkTitle}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[10px] font-semibold text-[var(--text-primary)]"
                >
                  <Link2 size={10} strokeWidth={2} />
                  {linkTitle}
                </span>
              ))}
              {audioAttachments.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
                  <AudioLines size={11} strokeWidth={2} />
                  {audioAttachments.length} Voice {audioAttachments.length === 1 ? 'Memo' : 'Memos'}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer: Tags, Date & Progressive Disclosure Quick Actions */}
      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <span className="text-[11px] text-[var(--text-muted)] shrink-0">
            {formattedDate}
          </span>
          {!isLockedAndHidden &&
            (note.tags || []).slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] truncate"
              >
                <Hash size={9} strokeWidth={2} />
                {tag}
              </span>
            ))}
        </div>

        {/* Contextual Action Bar (Progressive Disclosure) */}
        <div
          className="flex items-center gap-1 opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {note.isTrashed ? (
            <>
              <button
                onClick={() => restoreFromTrash(note.id)}
                className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 pressable"
                title="Restore note"
              >
                <RotateCcw size={14} strokeWidth={1.75} />
              </button>
              <button
                onClick={() => permanentlyDeleteNote(note.id)}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 pressable"
                title="Delete permanently"
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </>
          ) : (
            <>
              {!isLockedAndHidden && (
                <>
                  <button
                    onClick={() => setStudyDeckNote(note)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
                    title="Open 3D Study Flashcards"
                  >
                    <Layers size={14} strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => setShareCardNote(note)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
                    title="Share as Social Image Card"
                  >
                    <Share2 size={14} strokeWidth={1.75} />
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  if (note.isLocked) {
                    if (isLockedAndHidden) {
                      requestOpenNote(note);
                    } else {
                      removeNoteLock(note.id);
                    }
                  } else {
                    setLockModalState({
                      open: true,
                      mode: 'set',
                      note,
                      onSuccess: null
                    });
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
                title={note.isLocked ? 'Manage Privacy Lock' : 'Lock Note with PIN / Biometrics'}
              >
                {note.isLocked ? (
                  <Unlock size={14} strokeWidth={1.75} className="text-amber-400" />
                ) : (
                  <Lock size={14} strokeWidth={1.75} />
                )}
              </button>

              <button
                onClick={() => toggleArchive(note.id)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
                title={note.isArchived ? 'Unarchive' : 'Archive note'}
              >
                <Archive size={14} strokeWidth={1.75} />
              </button>

              <button
                onClick={() => moveToTrash(note.id)}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-[var(--text-secondary)] hover:text-rose-400 pressable"
                title="Move to Trash"
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
}
