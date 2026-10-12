import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  X,
  Pin,
  Lock,
  Unlock,
  CheckSquare,
  Plus,
  Trash2,
  Mic,
  MicOff,
  AudioLines,
  Square,
  PenTool,
  Camera,
  Sparkles,
  History,
  Layers,
  Share2,
  Download,
  FileText,
  Eye,
  Columns,
  AlertCircle,
  Hash,
  Bell,
  Link2,
  RotateCcw,
  KeyRound,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Quote,
  CalendarDays
} from 'lucide-react';
import { useNotes, NOTE_TINTS } from '../context/NotesContext.jsx';
import { aiService, getGeminiApiKey, setGeminiApiKey } from '../services/aiService.js';
import { exportService } from '../services/exportService.js';

export default function NoteEditor({ note, isModal = false, onClose }) {
  const {
    notes,
    allCategories,
    updateNote,
    togglePin,
    moveToTrash,
    setSketchTargetNoteId,
    setStudyDeckNote,
    setShareCardNote,
    setLockModalState,
    removeNoteLock,
    requestOpenNote,
    getBacklinksForNote,
    showToast
  } = useNotes();

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [category, setCategory] = useState(note?.category || 'Personal');
  const [status, setStatus] = useState(note?.status || 'todo');
  const [color, setColor] = useState(note?.color || 'default');
  const [tags, setTags] = useState(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [checklist, setChecklist] = useState(note?.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [reminderAt, setReminderAt] = useState(
    note?.reminderAt ? note.reminderAt.slice(0, 16) : ''
  );

  // Editor Tabs & Drawers
  const [editorTab, setEditorTab] = useState('write'); // 'write' | 'preview' | 'split'
  const [activeDrawer, setActiveDrawer] = useState(null); // 'ai' | 'history' | 'export' | null
  const [validationError, setValidationError] = useState('');
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // Voice Dictation (Web Speech API)
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef(null);

  // Voice Memo Audio Recorder (MediaRecorder API)
  const [isRecordingMemo, setIsRecordingMemo] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // AI Assistant State
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [geminiKey, setGeminiKeyState] = useState(() => getGeminiApiKey());
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const insertMarkdown = (prefix, suffix = '', defaultText = '') => {
    const el = textareaRef.current;
    if (!el) {
      const next = (content || '') + prefix + defaultText + suffix;
      setContent(next);
      commitFieldChange({ content: next });
      return;
    }
    const start = el.selectionStart ?? (content || '').length;
    const end = el.selectionEnd ?? start;
    const current = content || '';
    const sel = current.substring(start, end);
    const replacement = sel ? `${prefix}${sel}${suffix}` : `${prefix}${defaultText}${suffix}`;
    const nextContent = current.substring(0, start) + replacement + current.substring(end);
    setContent(nextContent);
    commitFieldChange({ content: nextContent });
    setTimeout(() => {
      el.focus();
      const cursorTarget = sel
        ? start + replacement.length
        : start + prefix.length + defaultText.length;
      el.setSelectionRange(cursorTarget, cursorTarget);
    }, 10);
  };

  // Sync local editor state when switching active note
  useEffect(() => {
    if (!note) return;
    setTitle(note.title || '');
    setContent(note.content || '');
    setCategory(note.category || 'Personal');
    setStatus(note.status || 'todo');
    setColor(note.color || 'default');
    setTags(note.tags || []);
    setChecklist(note.checklist || []);
    setReminderAt(note.reminderAt ? note.reminderAt.slice(0, 16) : '');
    setValidationError('');
    setAiOutput('');
  }, [note?.id]);

  if (!note) {
    return (
      <div className="liquid-card rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[420px]">
        <FileText size={32} strokeWidth={1.5} className="text-[var(--text-muted)] mb-2" />
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          No Note Selected
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Select a note from the list or click New Note to begin writing.
        </p>
      </div>
    );
  }

  const attachments = note.attachments || [];
  const backlinks = getBacklinksForNote(note);

  // Validate & Save Note (F-01 Acceptance Criteria)
  const handleSave = async (closeAfter = false) => {
    const isEmpty =
      !title.trim() &&
      !content.trim() &&
      checklist.length === 0 &&
      attachments.length === 0;

    if (isEmpty) {
      setValidationError(
        'Cannot save an empty note. Add a title, note content, checklist item, or attachment.'
      );
      setShakeTrigger((prev) => prev + 1);
      return;
    }

    setValidationError('');
    await updateNote(
      note.id,
      {
        title: title.trim() || 'Untitled Note',
        content,
        category,
        status,
        color,
        tags,
        checklist,
        reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null
      },
      { recordHistory: true }
    );
    showToast('Note saved');
    if (closeAfter && onClose) {
      onClose();
    }
  };

  // Auto-sync field edits in background when non-empty
  const commitFieldChange = (fieldUpdates) => {
    updateNote(note.id, fieldUpdates, { recordHistory: false });
  };

  // Checklist Handlers
  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    const nextList = [
      ...checklist,
      {
        id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text: newCheckItem.trim(),
        completed: false
      }
    ];
    setChecklist(nextList);
    setNewCheckItem('');
    commitFieldChange({ checklist: nextList });
  };

  const toggleChecklistItem = (itemId) => {
    const nextList = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(nextList);
    commitFieldChange({ checklist: nextList });
  };

  const deleteChecklistItem = (itemId) => {
    const nextList = checklist.filter((item) => item.id !== itemId);
    setChecklist(nextList);
    commitFieldChange({ checklist: nextList });
  };

  // Tag Handlers
  const handleAddTag = (e) => {
    e.preventDefault();
    const clean = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (!clean || tags.includes(clean)) {
      setTagInput('');
      return;
    }
    const nextTags = [...tags, clean];
    setTags(nextTags);
    setTagInput('');
    commitFieldChange({ tags: nextTags });
  };

  const removeTag = (tagToRemove) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    commitFieldChange({ tags: nextTags });
  };

  // Live Speech-to-Text Dictation (Web Speech API)
  const toggleDictation = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Live Speech Recognition is not supported in this browser.');
      return;
    }

    if (isDictating && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsDictating(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .slice(event.resultIndex)
          .map((r) => r[0].transcript)
          .join(' ');
        setContent((prev) => {
          const updated = `${prev}${prev.endsWith(' ') || !prev ? '' : ' '}${transcript.trim()}`;
          commitFieldChange({ content: updated });
          return updated;
        });
      };

      recognition.onerror = () => {
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsDictating(true);
      showToast('Listening... speak to dictate into your note');
    } catch {
      showToast('Could not start microphone dictation');
    }
  };

  // Voice Memo Recorder (MediaRecorder API)
  const toggleVoiceMemoRecording = async () => {
    if (isRecordingMemo && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecordingMemo(false);
      clearInterval(timerRef.current);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const newAttachment = {
            id: `att_audio_${Date.now()}`,
            type: 'audio',
            name: `Voice Memo (${new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })})`,
            dataUrl: reader.result,
            createdAt: new Date().toISOString()
          };
          const nextAttachments = [...(note.attachments || []), newAttachment];
          commitFieldChange({ attachments: nextAttachments });
          showToast('Voice Memo attached to note');
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingMemo(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      showToast('Microphone permission denied or unavailable.');
    }
  };

  // Camera / Image Upload Handler
  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newAttachment = {
        id: `att_img_${Date.now()}`,
        type: 'image',
        name: file.name || 'Camera Photo',
        dataUrl: reader.result,
        createdAt: new Date().toISOString()
      };
      const nextAttachments = [...(note.attachments || []), newAttachment];
      commitFieldChange({ attachments: nextAttachments });
      showToast('Photo attached to note');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAttachment = (attId) => {
    const nextAttachments = attachments.filter((a) => a.id !== attId);
    commitFieldChange({ attachments: nextAttachments });
  };

  // AI Actions
  const handleAiSummarize = async () => {
    setAiLoading(true);
    const summary = await aiService.summarizeNote(title, content);
    setAiOutput(summary);
    setAiLoading(false);
  };

  const handleAiExtractTasks = () => {
    const extracted = aiService.extractActionItems(content);
    if (extracted.length === 0) {
      setAiOutput('No action items detected. Write bullet points or tasks to extract.');
      return;
    }
    const nextChecklist = [...checklist, ...extracted];
    setChecklist(nextChecklist);
    commitFieldChange({ checklist: nextChecklist });
    setAiOutput(`Added ${extracted.length} action items to your Interactive Checklist.`);
    showToast(`Extracted ${extracted.length} checklist items`);
  };

  const handleAiAutoTag = () => {
    const suggestion = aiService.suggestCategoryAndTags(title, content);
    setCategory(suggestion.category);
    const mergedTags = Array.from(new Set([...tags, ...suggestion.tags]));
    setTags(mergedTags);
    commitFieldChange({ category: suggestion.category, tags: mergedTags });
    setAiOutput(
      `Categorized as "${suggestion.category}" with tags: ${mergedTags
        .map((t) => `#${t}`)
        .join(', ')}`
    );
    showToast('Applied AI category & tags');
  };

  // Render Markdown Preview with Clickable [[Wiki-Links]]
  const renderFormattedPreview = () => {
    if (!content.trim()) {
      return (
        <p className="text-xs italic text-[var(--text-muted)]">
          Nothing written yet. Switch to Write mode to compose your note.
        </p>
      );
    }

    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm text-[var(--text-primary)] leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-bold mt-3 text-[var(--text-primary)]">
                {line.slice(4)}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-base font-bold mt-4 text-[var(--text-primary)]">
                {line.slice(3)}
              </h3>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h2 key={idx} className="text-lg font-bold mt-4 text-[var(--text-primary)]">
                {line.slice(2)}
              </h2>
            );
          }

          // Parse [[Wiki-Links]] inside line
          const parts = line.split(/(\[\[[^\]]+\]\])/g);
          return (
            <p key={idx} className="min-h-[1rem]">
              {parts.map((part, pIdx) => {
                const match = part.match(/^\[\[([^\]]+)\]\]$/);
                if (match) {
                  const targetTitle = match[1];
                  const linkedNote = notes.find(
                    (n) =>
                      !n.isTrashed &&
                      n.title.toLowerCase().trim() === targetTitle.toLowerCase().trim()
                  );
                  return (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        if (linkedNote) {
                          requestOpenNote(linkedNote);
                        } else {
                          showToast(`Linked note "${targetTitle}" not created yet`);
                        }
                      }}
                      className="inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent-primary)] text-xs font-semibold hover:underline pressable"
                    >
                      <Link2 size={11} strokeWidth={2} />
                      {targetTitle}
                    </button>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      key={shakeTrigger}
      animate={
        validationError
          ? { x: [0, -8, 8, -6, 6, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.32 }}
      className={`liquid-card rounded-2xl border border-[var(--border-specular)] note-tint-${color} flex flex-col ${
        isModal ? 'max-h-[88vh] overflow-hidden' : 'min-h-[76vh]'
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-glass-chrome)]">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Selector */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              commitFieldChange({ category: e.target.value });
            }}
            className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            {allCategories.map((c) => (
              <option key={c.name} value={c.name} className="bg-[var(--bg-elevated)]">
                {c.name}
              </option>
            ))}
          </select>

          {/* Kanban Status Selector */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              commitFieldChange({ status: e.target.value });
            }}
            className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] focus:outline-none cursor-pointer"
          >
            <option value="todo" className="bg-[var(--bg-elevated)]">
              Status: To Do
            </option>
            <option value="in_progress" className="bg-[var(--bg-elevated)]">
              Status: In Progress
            </option>
            <option value="done" className="bg-[var(--bg-elevated)]">
              Status: Done
            </option>
          </select>

          {/* 8 Liquid Glass Tint Dots */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            {NOTE_TINTS.map((tint) => (
              <button
                key={tint.id}
                type="button"
                onClick={() => {
                  setColor(tint.id);
                  commitFieldChange({ color: tint.id });
                }}
                className={`w-4 h-4 rounded-full pressable border ${
                  color === tint.id ? 'border-white scale-125' : 'border-transparent opacity-75'
                }`}
                style={{ backgroundColor: tint.hex }}
                title={`Tint: ${tint.label}`}
              />
            ))}
          </div>
        </div>

        {/* Right Actions: Write/Preview Tabs, Pin, Lock, Save, Close */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center p-0.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setEditorTab('write')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold pressable ${
                editorTab === 'write'
                  ? 'btn-accent text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setEditorTab('preview')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold pressable ${
                editorTab === 'preview'
                  ? 'btn-accent text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setEditorTab('split')}
              className={`hidden sm:inline-flex px-2 py-1 rounded-lg text-[11px] font-semibold pressable ${
                editorTab === 'split'
                  ? 'btn-accent text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Split
            </button>
          </div>

          <button
            type="button"
            onClick={() => togglePin(note.id)}
            className={`p-2 rounded-xl border border-[var(--border-subtle)] pressable ${
              note.isPinned
                ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
            }`}
            title={note.isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin size={15} strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (note.isLocked) {
                removeNoteLock(note.id);
              } else {
                setLockModalState({
                  open: true,
                  mode: 'set',
                  note,
                  onSuccess: null
                });
              }
            }}
            className={`p-2 rounded-xl border border-[var(--border-subtle)] pressable ${
              note.isLocked
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
            }`}
            title={note.isLocked ? 'Remove Privacy Lock' : 'Lock Note with PIN / Biometrics'}
          >
            {note.isLocked ? (
              <Lock size={15} strokeWidth={1.75} />
            ) : (
              <Unlock size={15} strokeWidth={1.75} />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSave(isModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-accent text-xs font-semibold pressable"
          >
            <Save size={14} strokeWidth={2} />
            <span>Save</span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-rose-500/20 text-[var(--text-secondary)] hover:text-rose-400 pressable"
              aria-label="Close editor"
            >
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Inline Empty-Note Validation Banner */}
      {validationError && (
        <div className="mx-4 mt-3 px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle size={15} strokeWidth={2} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Multi-Modal Capture Ribbon (Progressive Disclosure) */}
      <div className="px-4 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2 flex-wrap bg-[var(--bg-subtle)]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={toggleDictation}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold pressable ${
              isDictating
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isDictating ? (
              <MicOff size={13} strokeWidth={2} />
            ) : (
              <Mic size={13} strokeWidth={1.75} />
            )}
            <span>{isDictating ? 'Stop Dictation' : 'Dictate'}</span>
          </button>

          <button
            type="button"
            onClick={toggleVoiceMemoRecording}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold pressable ${
              isRecordingMemo
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isRecordingMemo ? (
              <>
                <Square size={12} strokeWidth={2} />
                <span>Stop Memo ({recordingSeconds}s)</span>
              </>
            ) : (
              <>
                <AudioLines size={13} strokeWidth={1.75} />
                <span>Voice Memo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSketchTargetNoteId(note.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
          >
            <PenTool size={13} strokeWidth={1.75} />
            <span>Sketch Pad</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
          >
            <Camera size={13} strokeWidth={1.75} />
            <span>Photo</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageFileSelect}
            className="hidden"
          />
        </div>

        {/* Right Power Drawers: AI Assistant, Study Flashcards, History, Share/Export */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'ai' ? null : 'ai')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold pressable ${
              activeDrawer === 'ai'
                ? 'btn-accent text-white'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles size={13} strokeWidth={1.75} />
            <span>AI Assist</span>
          </button>

          <button
            type="button"
            onClick={() => setStudyDeckNote({ ...note, title, content, checklist })}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
          >
            <Layers size={13} strokeWidth={1.75} />
            <span className="hidden sm:inline">Study Deck</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveDrawer(activeDrawer === 'history' ? null : 'history')
            }
            className={`p-1.5 rounded-lg pressable ${
              activeDrawer === 'history'
                ? 'btn-accent text-white'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
            }`}
            title="Version History"
          >
            <History size={14} strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={() => setShareCardNote({ ...note, title, content, category, tags })}
            className="p-1.5 rounded-lg bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
            title="Share as Social Card or Export"
          >
            <Share2 size={14} strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={() => exportService.exportAsMarkdown({ ...note, title, content, checklist, tags })}
            className="p-1.5 rounded-lg bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
            title="Export as Markdown (.md)"
          >
            <Download size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Progressive Disclosure Drawer: AI Assistant */}
      {activeDrawer === 'ai' && (
        <div className="mx-4 mt-3 p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-specular)] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              <Sparkles size={14} strokeWidth={2} className="text-[var(--accent-primary)]" />
              Ambient AI Note Assistant
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleAiSummarize}
                disabled={aiLoading}
                className="px-2.5 py-1 rounded-lg btn-accent text-[11px] font-semibold pressable"
              >
                {aiLoading ? 'Summarizing...' : 'Summarize (TL;DR)'}
              </button>
              <button
                type="button"
                onClick={handleAiExtractTasks}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] font-semibold pressable"
              >
                Extract Checklist
              </button>
              <button
                type="button"
                onClick={handleAiAutoTag}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] font-semibold pressable"
              >
                Auto-Categorize & Tag
              </button>
              <button
                type="button"
                onClick={() => setShowKeyConfig((v) => !v)}
                className="p-1 rounded-lg bg-[var(--bg-card)] text-[var(--text-secondary)] pressable"
                title="Configure Optional Gemini API Key"
              >
                <KeyRound size={13} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {showKeyConfig && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKeyState(e.target.value)}
                placeholder="Optional: Paste Google Gemini API Key for Cloud LLM..."
                className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
              />
              <button
                type="button"
                onClick={() => {
                  setGeminiApiKey(geminiKey);
                  setShowKeyConfig(false);
                  showToast('Gemini API Key saved');
                }}
                className="px-2.5 py-1 rounded-lg btn-accent text-xs font-semibold pressable"
              >
                Save Key
              </button>
            </div>
          )}

          {aiOutput && (
            <div className="p-2.5 rounded-lg bg-[var(--bg-card)] text-xs text-[var(--text-primary)] whitespace-pre-line border border-[var(--border-subtle)]">
              {aiOutput}
            </div>
          )}
        </div>
      )}

      {/* Progressive Disclosure Drawer: Version History */}
      {activeDrawer === 'history' && (
        <div className="mx-4 mt-3 p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2 max-h-48 overflow-y-auto">
          <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <History size={14} strokeWidth={2} className="text-[var(--accent-primary)]" />
            Version History ({note.versionHistory?.length || 0} Snapshots)
          </div>
          {!note.versionHistory || note.versionHistory.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              Snapshots are recorded automatically each time you click Save.
            </p>
          ) : (
            note.versionHistory.map((snap, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-card)] text-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="font-semibold truncate">{snap.title}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    {new Date(snap.updatedAt).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTitle(snap.title);
                    setContent(snap.content);
                    commitFieldChange({ title: snap.title, content: snap.content });
                    showToast('Restored note snapshot');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)] font-semibold pressable"
                >
                  <RotateCcw size={12} strokeWidth={2} />
                  Restore
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Main Scrollable Writing & Multi-Modal Body */}
      <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (validationError) setValidationError('');
            commitFieldChange({ title: e.target.value });
          }}
          placeholder="Note Title..."
          className="w-full bg-transparent type-editor-title text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />

        {/* Rich Markdown Formatting Toolbar (for instant 1-tap mobile & desktop styling) */}
        {(editorTab === 'write' || editorTab === 'split') && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-x-auto no-scrollbar flex-wrap">
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**', 'bold text')}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] pressable"
              title="Bold (**text**)"
            >
              <Bold size={13} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown('*', '*', 'italic text')}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] pressable"
              title="Italic (*text*)"
            >
              <Italic size={13} strokeWidth={2.2} />
            </button>

            <div className="w-[1px] h-3.5 bg-[var(--border-subtle)] mx-0.5" />

            <button
              type="button"
              onClick={() => insertMarkdown('\n# ', '\n', 'Heading 1')}
              className="px-1.5 py-1 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] pressable"
              title="Heading 1"
            >
              H1
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown('\n## ', '\n', 'Heading 2')}
              className="px-1.5 py-1 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] pressable"
              title="Heading 2"
            >
              H2
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown('\n### ', '\n', 'Heading 3')}
              className="px-1.5 py-1 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] pressable"
              title="Heading 3"
            >
              H3
            </button>

            <div className="w-[1px] h-3.5 bg-[var(--border-subtle)] mx-0.5" />

            <button
              type="button"
              onClick={() => insertMarkdown('\n- ', '', 'List item')}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] pressable"
              title="Bullet List (- item)"
            >
              <List size={13} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown('\n1. ', '', 'Step item')}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] pressable"
              title="Numbered List (1. item)"
            >
              <ListOrdered size={13} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown('\n> ', '', 'Quote text')}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] pressable"
              title="Blockquote (> quote)"
            >
              <Quote size={13} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown('\n```\n', '\n```\n', '// code snippet')}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] pressable"
              title="Code Block (```)"
            >
              <Code size={13} strokeWidth={2} />
            </button>

            <div className="w-[1px] h-3.5 bg-[var(--border-subtle)] mx-0.5" />

            <button
              type="button"
              onClick={() => insertMarkdown('[[', ']]', 'Linked Note Title')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] pressable"
              title="Insert Wiki-Link [[Note Title]]"
            >
              <Link2 size={12} strokeWidth={2} />
              <span>Wiki-Link</span>
            </button>

            <button
              type="button"
              onClick={() => insertMarkdown('\n', ' :: Definition', 'Term')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/10 pressable"
              title="Create 3D Study Flashcard (Term :: Definition)"
            >
              <span>:: Flashcard</span>
            </button>

            <button
              type="button"
              onClick={() =>
                insertMarkdown(
                  new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                )
              }
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] pressable ml-auto"
              title="Insert Today's Date"
            >
              <CalendarDays size={12} strokeWidth={1.8} />
              <span className="hidden sm:inline">Date</span>
            </button>
          </div>
        )}

        {/* Write / Preview / Split Content Area */}
        <div
          className={
            editorTab === 'split'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
              : 'block'
          }
        >
          {(editorTab === 'write' || editorTab === 'split') && (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (validationError) setValidationError('');
                commitFieldChange({ content: e.target.value });
              }}
              rows={10}
              placeholder="Write in Markdown... Use [[Note Title]] to link notes, or Term :: Definition to auto-build 3D Study Flashcards."
              className="w-full bg-transparent type-body text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-y min-h-[210px]"
            />
          )}

          {(editorTab === 'preview' || editorTab === 'split') && (
            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] min-h-[210px]">
              {renderFormattedPreview()}
            </div>
          )}
        </div>

        {/* Interactive Checklist Section */}
        <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              <CheckSquare size={14} strokeWidth={2} className="text-[var(--accent-primary)]" />
              Interactive Checklist ({checklist.filter((c) => c.completed).length}/
              {checklist.length})
            </span>
          </div>

          <div className="space-y-1.5">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]"
              >
                <label className="flex items-center gap-2.5 flex-1 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(item.completed)}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="rounded accent-[var(--accent-primary)] w-4 h-4 cursor-pointer"
                  />
                  <span
                    className={
                      item.completed
                        ? 'line-through text-[var(--text-muted)]'
                        : 'text-[var(--text-primary)]'
                    }
                  >
                    {item.text}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => deleteChecklistItem(item.id)}
                  className="p-1 rounded hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-400 pressable"
                >
                  <Trash2 size={13} strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddChecklistItem} className="flex gap-2">
            <input
              type="text"
              value={newCheckItem}
              onChange={(e) => setNewCheckItem(e.target.value)}
              placeholder="Add a checklist task and press Enter..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg btn-accent text-xs font-semibold pressable"
            >
              Add Task
            </button>
          </form>
        </div>

        {/* Attachments Gallery: Sketches, Photos & Voice Memos */}
        {attachments.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Attachments ({attachments.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-1 rounded hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-400 pressable"
                    >
                      <Trash2 size={13} strokeWidth={1.75} />
                    </button>
                  </div>

                  {att.type === 'audio' ? (
                    <audio controls src={att.dataUrl} className="w-full h-9" />
                  ) : (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-full max-h-48 object-contain rounded-lg bg-black/20"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags & Reminder Metadata Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border-subtle)]">
          {/* Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-xs font-medium text-[var(--text-primary)]"
                >
                  <Hash size={11} strokeWidth={2} />
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="ml-1 hover:text-rose-400"
                  >
                    <X size={11} strokeWidth={2} />
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-1.5">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add #tag..."
                className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] text-xs font-semibold pressable"
              >
                + Tag
              </button>
            </form>
          </div>

          {/* Reminder Datetime & Delete Note */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
              <Bell size={13} strokeWidth={1.75} className="text-amber-400" />
              <input
                type="datetime-local"
                value={reminderAt}
                onChange={(e) => {
                  setReminderAt(e.target.value);
                  commitFieldChange({
                    reminderAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null
                  });
                }}
                className="bg-transparent text-xs text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => moveToTrash(note.id)}
              className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 pressable"
              title="Move note to Trash"
            >
              <Trash2 size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Automatic Backlinks Section (F-12) */}
        {backlinks.length > 0 && (
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Link2 size={13} strokeWidth={2} className="text-[var(--accent-primary)]" />
              Linked From ({backlinks.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {backlinks.map((bn) => (
                <button
                  key={bn.id}
                  type="button"
                  onClick={() => requestOpenNote(bn)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-xs font-semibold text-[var(--text-primary)] pressable"
                >
                  {bn.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
