import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiService, getStoredUser, getStoredToken, clearAuthSession } from '../services/api.js';
import { hashPin } from '../services/biometricService.js';

const NotesContext = createContext(null);

const STORAGE_NOTES_KEY = 'kadjelo_notes_v1';
const STORAGE_THEME_KEY = 'kadjelo_theme_id';
const STORAGE_MODE_KEY = 'kadjelo_color_mode';
const STORAGE_VIEW_KEY = 'kadjelo_view_mode';
const STORAGE_CATEGORIES_KEY = 'kadjelo_categories_v1';

export const DEFAULT_CATEGORIES = [
  { name: 'Work', icon: 'Briefcase' },
  { name: 'Personal', icon: 'User' },
  { name: 'Study', icon: 'GraduationCap' },
  { name: 'Ideas', icon: 'Lightbulb' },
  { name: 'Shopping', icon: 'ShoppingBag' },
  { name: 'Travel', icon: 'Compass' }
];

export const THEME_OPTIONS = [
  {
    id: 'kadjelo',
    name: 'KadjeloTech Imperial & Amber',
    subtitle: 'Signature Purple #371840 & Amber #F59E0B',
    primary: '#371840',
    secondary: '#f59e0b'
  },
  {
    id: 'indigo',
    name: 'Obsidian & Indigo Glass',
    subtitle: 'Electric Indigo & Violet',
    primary: '#6366f1',
    secondary: '#8b5cf6'
  },
  {
    id: 'emerald',
    name: 'Emerald & Slate Studio',
    subtitle: 'Forest Emerald & Teal',
    primary: '#10b981',
    secondary: '#14b8a6'
  },
  {
    id: 'amber',
    name: 'Amber & Warm Titanium',
    subtitle: 'Apple Notes Heritage Gold',
    primary: '#f59e0b',
    secondary: '#ea580c'
  },
  {
    id: 'rose',
    name: 'Cyber Rose & Midnight',
    subtitle: 'Coral Rose & Neon Cyan',
    primary: '#f43f5e',
    secondary: '#06b6d4'
  }
];

export const NOTE_TINTS = [
  { id: 'default', label: 'Glass Default', hex: '#64748b' },
  { id: 'indigo', label: 'Indigo', hex: '#6366f1' },
  { id: 'emerald', label: 'Emerald', hex: '#10b981' },
  { id: 'amber', label: 'Amber', hex: '#f59e0b' },
  { id: 'rose', label: 'Rose', hex: '#f43f5e' },
  { id: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { id: 'violet', label: 'Violet', hex: '#a855f7' },
  { id: 'slate', label: 'Slate', hex: '#475569' }
];

export const NOTE_TEMPLATES = [
  {
    id: 'tpl_meeting',
    name: 'Executive Meeting Brief',
    icon: 'Users',
    category: 'Work',
    color: 'indigo',
    title: 'Meeting Brief — Product Sync',
    content: `## Objective\nAlign on Q4 product milestones and engineering deliverables.\n\n## Key Decisions\n- Finalized Neon PostgreSQL schema and Vercel serverless routing\n- Adopted Liquid Glass material hierarchy across mobile and desktop\n\n## Related Notes\nSee [[Kadjelo Notes Architecture Spec]] for technical details.`,
    checklist: [
      { id: 'm1', text: 'Share pre-read architecture deck with team', completed: true },
      { id: 'm2', text: 'Finalize API rate limiting and JWT expiry rules', completed: false },
      { id: 'm3', text: 'Schedule mobile PWA dogfooding session', completed: false }
    ],
    tags: ['meeting', 'roadmap', 'q4']
  },
  {
    id: 'tpl_journal',
    name: 'Daily Reflection & Focus',
    icon: 'BookMarked',
    category: 'Personal',
    color: 'amber',
    title: `Daily Reflection — ${new Date().toISOString().slice(0, 10)}`,
    content: `## Top 3 Priorities Today\n1. Ship high-leverage engineering work before noon\n2. 45-minute deep focus block without notifications\n3. Evening review and knowledge graph gardening\n\n## Gratitude & Wins\n- Clear momentum on the new mobile-first workflow.`,
    checklist: [
      { id: 'j1', text: 'Morning hydration and 15m planning review', completed: true },
      { id: 'j2', text: 'Complete 2 Pomodoro deep work sessions', completed: false }
    ],
    tags: ['journal', 'daily', 'focus']
  },
  {
    id: 'tpl_flashcards',
    name: 'Study Flashcard Deck',
    icon: 'Layers',
    category: 'Study',
    color: 'emerald',
    title: 'Distributed Systems & Database Study Deck',
    content: `Use double colons (::) to automatically generate interactive 3D Study Flashcards:\n\nCAP Theorem :: A distributed data store can simultaneously provide only two of three guarantees: Consistency, Availability, and Partition Tolerance.\nConnection Pooling :: Reusing active database connections in serverless functions to eliminate TCP/TLS handshake latency.\nOptimistic UI :: Updating the user interface immediately on pointer-down before awaiting server confirmation.\nWebAuthn :: W3C standard for passwordless hardware biometric authentication using public-key cryptography.`,
    checklist: [
      { id: 's1', text: 'Review all 4 flashcards in 3D Study Mode', completed: false },
      { id: 's2', text: 'Complete one 25-minute Pomodoro session', completed: false }
    ],
    tags: ['study', 'flashcards', 'architecture']
  },
  {
    id: 'tpl_grocery',
    name: 'Smart Grocery & Provision List',
    icon: 'ListChecks',
    category: 'Shopping',
    color: 'cyan',
    title: 'Weekly Provision & Grocery Run',
    content: `## Store Notes\nPick up fresh produce and pantry essentials for the week.`,
    checklist: [
      { id: 'g1', text: 'Organic oat milk & Greek yogurt', completed: true },
      { id: 'g2', text: 'Avocados, spinach, and cherry tomatoes', completed: false },
      { id: 'g3', text: 'Whole grain sourdough bread & pasture eggs', completed: false },
      { id: 'g4', text: 'Roasted coffee beans (medium roast)', completed: false }
    ],
    tags: ['shopping', 'weekly', 'essentials']
  },
  {
    id: 'tpl_budget',
    name: 'Expense & SaaS Budget Tracker',
    icon: 'Wallet',
    category: 'Personal',
    color: 'violet',
    title: 'Cloud Infrastructure & Personal Budget Log',
    content: `## Monthly Recurring Allocations\n- **Vercel Pro Hosting**: $20.00 / mo\n- **Neon Serverless Postgres**: $0.00 (Free Tier / Autoscaling)\n- **Domain Renewal**: $12.00 / yr\n\n## Optimization Notes\nKeep serverless cold-start payloads lean and cache static assets via Service Worker.`,
    checklist: [
      { id: 'b1', text: 'Audit monthly cloud billing alerts', completed: true },
      { id: 'b2', text: 'Export Q3 expense summary to PDF', completed: false }
    ],
    tags: ['finance', 'budget', 'cloud']
  },
  {
    id: 'tpl_code',
    name: 'Code Architecture Snippet',
    icon: 'Code2',
    category: 'Work',
    color: 'slate',
    title: 'Neon Serverless SQL Connection Pattern',
    content: `## Serverless Connection Snippet\n\`\`\`js\nimport { neon } from '@neondatabase/serverless';\nconst sql = neon(process.env.DATABASE_URL);\nconst notes = await sql\`SELECT * FROM notes WHERE user_id = \${userId}\`;\n\`\`\`\n\nLinked reference: [[Kadjelo Notes Architecture Spec]]`,
    checklist: [
      { id: 'c1', text: 'Verify SSL mode requirement on Neon connection string', completed: true }
    ],
    tags: ['code', 'neon', 'postgres']
  }
];

const INITIAL_SHOWCASE_NOTES = [
  {
    id: 'note_arch_spec',
    title: 'Kadjelo Notes Architecture Spec',
    content: `## Welcome to Kadjelo Notes\nBuilt with **Apple Liquid Glass** materiality, interruptible spring physics, and a **Hybrid Local-First + Neon PostgreSQL** sync engine.\n\n### Core Capabilities\n- Switch between **Bento Grid**, **Split-Pane Focus**, **Kanban Board**, and **Knowledge Graph** views in the top bar.\n- Connect ideas together using Wiki-Links like [[Distributed Systems & Flashcard Study]] and [[Q4 Mobile PWA Launch Roadmap]].\n- Press **Ctrl+K** (or **Cmd+K**) anytime to open the instant Command Palette.`,
    category: 'Work',
    status: 'in_progress',
    tags: ['architecture', 'pwa', 'liquid-glass'],
    checklist: [
      { id: 'c_1', text: 'Explore the 4 workspace views in the TopBar', completed: true },
      { id: 'c_2', text: 'Test the Sketch Pad and Voice Memo recorder inside the editor', completed: false },
      { id: 'c_3', text: 'Try switching color themes in the Appearance menu', completed: false }
    ],
    attachments: [],
    flashcards: [],
    focusMinutes: 50,
    color: 'indigo',
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    isLocked: false,
    lockPinHash: null,
    biometricEnabled: false,
    reminderAt: null,
    versionHistory: [],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'note_study_deck',
    title: 'Distributed Systems & Flashcard Study',
    content: `Click the **Study Deck** button on this note to practice with interactive 3D flip-cards!\n\nApple Spring Physics :: Critically damped springs (damping 1.0) settle smoothly without overshoot; momentum springs (damping 0.8) carry gesture velocity.\nNeon Serverless Postgres :: Separates compute from storage and connects over HTTP/WebSockets for sub-second serverless scaling.\nProgressive Web App (PWA) :: Uses a Web App Manifest and Service Worker to install natively on iOS, Android, and Desktop with full offline resilience.\nLiquid Glass Hierarchy :: Translucent floating layers with backdrop blur and specular top edges that let content scroll visibly underneath.\n\nRelated to [[Kadjelo Notes Architecture Spec]].`,
    category: 'Study',
    status: 'todo',
    tags: ['study', 'flashcards', 'systems'],
    checklist: [
      { id: 'st_1', text: 'Flip through all 4 cards in 3D Study Mode', completed: false },
      { id: 'st_2', text: 'Run a 25m Pomodoro focus timer session', completed: false }
    ],
    attachments: [],
    flashcards: [],
    focusMinutes: 25,
    color: 'emerald',
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    isLocked: false,
    lockPinHash: null,
    biometricEnabled: false,
    reminderAt: null,
    versionHistory: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'note_roadmap',
    title: 'Q4 Mobile PWA Launch Roadmap',
    content: `## Mobile-First Priorities\nEnsure every touch target meets the **44x44px Apple HIG standard** and cards support direct 1:1 horizontal swipe gestures on touch screens.\n\n- Swipe right on a card to **Pin / Unpin**\n- Swipe left on a card to move to **Trash**\n- Linked spec: [[Kadjelo Notes Architecture Spec]]`,
    category: 'Ideas',
    status: 'todo',
    tags: ['mobile', 'roadmap', 'ux'],
    checklist: [
      { id: 'rm_1', text: 'Verify manifest.webmanifest standalone launch on phone', completed: true },
      { id: 'rm_2', text: 'Generate branded Social Share PNG card', completed: false }
    ],
    attachments: [],
    flashcards: [],
    focusMinutes: 15,
    color: 'amber',
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    isLocked: false,
    lockPinHash: null,
    biometricEnabled: false,
    reminderAt: new Date(Date.now() + 86400000).toISOString(),
    versionHistory: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'note_shopping',
    title: 'Studio Desk Setup & Essentials',
    content: `Items to pick up for the home engineering studio workspace.`,
    category: 'Shopping',
    status: 'done',
    tags: ['studio', 'hardware', 'shopping'],
    checklist: [
      { id: 'sh_1', text: 'Low-profile mechanical keyboard switches', completed: true },
      { id: 'sh_2', text: 'Thunderbolt 4 braided host cable', completed: true },
      { id: 'sh_3', text: 'Matte desk pad & monitor light bar', completed: false }
    ],
    attachments: [],
    flashcards: [],
    focusMinutes: 0,
    color: 'cyan',
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    isLocked: false,
    lockPinHash: null,
    biometricEnabled: false,
    reminderAt: null,
    versionHistory: [],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 28800000).toISOString()
  }
];

export function NotesProvider({ children }) {
  // Theme & Appearance
  const [themeId, setThemeId] = useState(
    () => localStorage.getItem(STORAGE_THEME_KEY) || 'kadjelo'
  );
  const [colorMode, setColorMode] = useState(
    () => localStorage.getItem(STORAGE_MODE_KEY) || 'dark'
  );
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem(STORAGE_VIEW_KEY) || 'grid'
  );

  // Notes & Categories
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NOTES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to showcase notes
    }
    return INITIAL_SHOWCASE_NOTES;
  });

  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CATEGORIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filters & Navigation
  const [activeNav, setActiveNav] = useState('all'); // 'all' | 'pinned' | 'reminders' | 'locked' | 'archive' | 'trash'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedColor, setSelectedColor] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'created' | 'title' | 'focus'

  // Active Note & Modals
  const [activeNoteId, setActiveNoteId] = useState(INITIAL_SHOWCASE_NOTES[0].id);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [unlockedNoteIds, setUnlockedNoteIds] = useState(() => new Set());
  const [lockModalState, setLockModalState] = useState({
    open: false,
    mode: 'unlock', // 'unlock' | 'set'
    note: null,
    onSuccess: null
  });
  const [studyDeckNote, setStudyDeckNote] = useState(null);
  const [shareCardNote, setShareCardNote] = useState(null);
  const [sketchTargetNoteId, setSketchTargetNoteId] = useState(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    onConfirm: null
  });

  // Cloud & Auth State
  const [user, setUser] = useState(() => getStoredUser());
  const [cloudStatus, setCloudStatus] = useState({
    connected: false,
    mode: 'local-first',
    syncing: false,
    message: 'Local-First Offline Ready'
  });

  // Toast & Undo Queue
  const [toast, setToast] = useState(null);

  // PWA Install Prompt
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState(null);
  const [isPwaGuideOpen, setIsPwaGuideOpen] = useState(false);

  // Apply Theme & Mode to root HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
    document.documentElement.setAttribute('data-mode', colorMode);
    localStorage.setItem(STORAGE_THEME_KEY, themeId);
    localStorage.setItem(STORAGE_MODE_KEY, colorMode);
  }, [themeId, colorMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_VIEW_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
    } catch {
      // Ignore storage quota warning on large base64 attachments
    }
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(customCategories));
  }, [customCategories]);

  // Capture PWA beforeinstallprompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const showToast = useCallback((message, undoAction = null, type = 'info') => {
    const id = Date.now();
    setToast({ id, message, undoAction, type });
    setTimeout(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    }, 5200);
  }, []);

  // Check Backend / Neon DB Health & Seamless Sync on Mount
  useEffect(() => {
    let mounted = true;
    async function initCloud() {
      try {
        const health = await apiService.checkHealth();
        if (!mounted) return;
        const isDbConnected = Boolean(health.connected);

        setCloudStatus((prev) => ({
          ...prev,
          connected: isDbConnected,
          mode: health.mode || 'local-first',
          message: health.message || (isDbConnected ? 'Connected to Neon PostgreSQL' : 'Local Storage Mode')
        }));

        if (isDbConnected) {
          let token = getStoredToken();
          if (!token) {
            let deviceId = localStorage.getItem('kadjelo_device_id');
            if (!deviceId) {
              deviceId = 'dev_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
              localStorage.setItem('kadjelo_device_id', deviceId);
            }
            try {
              const sessionRes = await apiService.getOrCreateAnonymousSession(deviceId);
              if (sessionRes?.user) {
                setUser(sessionRes.user);
              }
              token = sessionRes?.token;
            } catch (err) {
              console.warn('Anonymous Neon DB session init:', err);
            }
          }

          if (token && mounted) {
            try {
              const remoteNotes = await apiService.fetchNotes();
              if (mounted && Array.isArray(remoteNotes) && remoteNotes.length > 0) {
                setNotes(remoteNotes);
              } else if (mounted) {
                // If remote is empty, push initial showcase or local notes to Neon Cloud
                const saved = localStorage.getItem(STORAGE_NOTES_KEY);
                const currentNotes = saved ? JSON.parse(saved) : INITIAL_SHOWCASE_NOTES;
                if (currentNotes?.length > 0) {
                  await apiService.syncLocalToCloud(currentNotes);
                }
              }
            } catch {
              // Graceful fallback to local notes
            }
          }
        }
      } catch (err) {
        console.warn('Backend connection notice:', err);
      }
    }
    initCloud();
    return () => {
      mounted = false;
    };
  }, []);

  const triggerHaptic = useCallback((ms = 12) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Ignore on unsupported browsers
      }
    }
  }, []);

  // CRUD Operations
  const createNote = useCallback(
    async (partial = {}) => {
      const now = new Date().toISOString();
      const newNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: partial.title ?? '',
        content: partial.content ?? '',
        category:
          partial.category ??
          (selectedCategory !== 'All' ? selectedCategory : 'Personal'),
        status: partial.status ?? 'todo',
        tags: partial.tags ?? [],
        checklist: partial.checklist ?? [],
        attachments: partial.attachments ?? [],
        flashcards: partial.flashcards ?? [],
        focusMinutes: partial.focusMinutes ?? 0,
        color: partial.color ?? 'default',
        isPinned: Boolean(partial.isPinned),
        isArchived: false,
        isTrashed: false,
        isLocked: Boolean(partial.isLocked),
        lockPinHash: partial.lockPinHash ?? null,
        biometricEnabled: Boolean(partial.biometricEnabled),
        reminderAt: partial.reminderAt ?? null,
        versionHistory: [],
        createdAt: now,
        updatedAt: now
      };

      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      triggerHaptic(10);

      if (user && getStoredToken() && (newNote.title.trim() || newNote.content.trim())) {
        try {
          const createdRemote = await apiService.createNote(newNote);
          if (createdRemote?.id) {
            setNotes((prev) =>
              prev.map((n) => (n.id === newNote.id ? createdRemote : n))
            );
            setActiveNoteId(createdRemote.id);
            return createdRemote;
          }
        } catch {
          // Queued locally
        }
      }
      return newNote;
    },
    [selectedCategory, triggerHaptic, user]
  );

  const updateNote = useCallback(
    async (id, updates, options = { recordHistory: false }) => {
      const now = new Date().toISOString();
      let updatedSnapshot = null;

      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== id) return note;
          let nextHistory = note.versionHistory || [];
          if (
            options.recordHistory &&
            (updates.content !== undefined || updates.title !== undefined) &&
            (note.title || note.content)
          ) {
            const snapshot = {
              updatedAt: note.updatedAt || now,
              title: note.title,
              content: note.content
            };
            nextHistory = [snapshot, ...nextHistory].slice(0, 15);
          }

          updatedSnapshot = {
            ...note,
            ...updates,
            versionHistory: nextHistory,
            updatedAt: now
          };
          return updatedSnapshot;
        })
      );

      if (user && getStoredToken() && updatedSnapshot) {
        try {
          await apiService.updateNote(id, updatedSnapshot);
        } catch {
          // Local state already updated optimistically
        }
      }
    },
    [user]
  );

  const togglePin = useCallback(
    (id) => {
      const target = notes.find((n) => n.id === id);
      if (!target) return;
      triggerHaptic(14);
      updateNote(id, { isPinned: !target.isPinned, isArchived: false });
      showToast(target.isPinned ? 'Note unpinned' : 'Note pinned to top');
    },
    [notes, triggerHaptic, updateNote, showToast]
  );

  const toggleArchive = useCallback(
    (id) => {
      const target = notes.find((n) => n.id === id);
      if (!target) return;
      const nextArchived = !target.isArchived;
      triggerHaptic(14);
      updateNote(id, { isArchived: nextArchived, isPinned: false });
      showToast(
        nextArchived ? 'Note archived' : 'Note restored from Archive',
        () => updateNote(id, { isArchived: !nextArchived })
      );
    },
    [notes, triggerHaptic, updateNote, showToast]
  );

  const moveToTrash = useCallback(
    (id) => {
      const target = notes.find((n) => n.id === id);
      if (!target) return;
      triggerHaptic(18);
      const prevPinned = target.isPinned;
      const prevArchived = target.isArchived;
      updateNote(id, { isTrashed: true, isPinned: false });
      if (activeNoteId === id) {
        setIsEditorModalOpen(false);
      }
      showToast('Moved note to Trash', () => {
        updateNote(id, {
          isTrashed: false,
          isPinned: prevPinned,
          isArchived: prevArchived
        });
      });
    },
    [notes, activeNoteId, triggerHaptic, updateNote, showToast]
  );

  const restoreFromTrash = useCallback(
    (id) => {
      triggerHaptic(12);
      updateNote(id, { isTrashed: false });
      showToast('Note restored');
    },
    [triggerHaptic, updateNote, showToast]
  );

  const permanentlyDeleteNote = useCallback(
    (id) => {
      const target = notes.find((n) => n.id === id);
      setConfirmState({
        open: true,
        title: 'Delete Note Permanently?',
        message: `"${
          target?.title || 'Untitled Note'
        }" will be permanently erased from this device and Neon Cloud. This action cannot be undone.`,
        confirmLabel: 'Delete Forever',
        onConfirm: async () => {
          setNotes((prev) => prev.filter((n) => n.id !== id));
          if (activeNoteId === id) {
            setActiveNoteId(null);
            setIsEditorModalOpen(false);
          }
          if (user && getStoredToken()) {
            try {
              await apiService.deleteNote(id);
            } catch {
              // Ignore
            }
          }
          showToast('Note permanently deleted');
        }
      });
    },
    [notes, activeNoteId, user, showToast]
  );

  const emptyTrash = useCallback(() => {
    const trashed = notes.filter((n) => n.isTrashed);
    if (trashed.length === 0) return;
    setConfirmState({
      open: true,
      title: `Empty Trash (${trashed.length} ${trashed.length === 1 ? 'Note' : 'Notes'})?`,
      message:
        'All notes in the Trash Bin will be permanently erased. This action cannot be undone.',
      confirmLabel: 'Empty Trash',
      onConfirm: async () => {
        setNotes((prev) => prev.filter((n) => !n.isTrashed));
        if (user && getStoredToken()) {
          for (const item of trashed) {
            try {
              await apiService.deleteNote(item.id);
            } catch {
              // Ignore
            }
          }
        }
        showToast('Trash Bin emptied');
      }
    });
  }, [notes, user, showToast]);

  // 1-Tap Daily Scratchpad
  const openDailyScratchpad = useCallback(async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dailyTitle = `Daily Scratchpad — ${todayStr}`;
    const existing = notes.find(
      (n) => !n.isTrashed && n.title.toLowerCase() === dailyTitle.toLowerCase()
    );

    if (existing) {
      setActiveNoteId(existing.id);
      if (viewMode !== 'split') setIsEditorModalOpen(true);
      showToast(`Opened ${dailyTitle}`);
      return existing;
    }

    const created = await createNote({
      title: dailyTitle,
      category: 'Personal',
      color: 'indigo',
      content: `## Focus & Capture (${todayStr})\n- Quick thoughts, links, and meeting takeaways for today.\n`,
      checklist: [
        { id: `d_${Date.now()}_1`, text: 'Define top priority for today', completed: false },
        { id: `d_${Date.now()}_2`, text: 'Review open action items', completed: false }
      ],
      tags: ['daily', todayStr]
    });
    if (viewMode !== 'split') setIsEditorModalOpen(true);
    showToast(`Created ${dailyTitle}`);
    return created;
  }, [notes, viewMode, createNote, showToast]);

  // Spawn from Template
  const createFromTemplate = useCallback(
    async (template) => {
      const created = await createNote({
        title: template.title,
        content: template.content,
        category: template.category,
        color: template.color,
        checklist: (template.checklist || []).map((c, idx) => ({
          ...c,
          id: `tpl_chk_${Date.now()}_${idx}`
        })),
        tags: [...(template.tags || [])]
      });
      if (viewMode !== 'split') setIsEditorModalOpen(true);
      showToast(`Created note from "${template.name}"`);
      return created;
    },
    [createNote, viewMode, showToast]
  );

  // Lock & Unlock Notes
  const requestOpenNote = useCallback(
    (note) => {
      if (!note) return;
      if (note.isLocked && !unlockedNoteIds.has(note.id)) {
        setLockModalState({
          open: true,
          mode: 'unlock',
          note,
          onSuccess: () => {
            setUnlockedNoteIds((prev) => new Set([...prev, note.id]));
            setActiveNoteId(note.id);
            if (viewMode !== 'split') setIsEditorModalOpen(true);
          }
        });
        return;
      }
      setActiveNoteId(note.id);
      if (viewMode !== 'split') setIsEditorModalOpen(true);
    },
    [unlockedNoteIds, viewMode]
  );

  const lockNoteWithPin = useCallback(
    async (noteId, rawPin, enableBiometric = true) => {
      const pinHash = await hashPin(rawPin);
      await updateNote(noteId, {
        isLocked: true,
        lockPinHash: pinHash,
        biometricEnabled: enableBiometric
      });
      setUnlockedNoteIds((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      showToast('Note locked in Privacy Vault');
    },
    [updateNote, showToast]
  );

  const removeNoteLock = useCallback(
    async (noteId) => {
      await updateNote(noteId, {
        isLocked: false,
        lockPinHash: null,
        biometricEnabled: false
      });
      showToast('Privacy lock removed from note');
    },
    [updateNote, showToast]
  );

  // Add Custom Category
  const addCustomCategory = useCallback(
    (name) => {
      const clean = name.trim();
      if (!clean) return;
      const allExisting = [
        ...DEFAULT_CATEGORIES.map((c) => c.name.toLowerCase()),
        ...customCategories.map((c) => c.name.toLowerCase())
      ];
      if (allExisting.includes(clean.toLowerCase())) {
        setSelectedCategory(clean);
        return;
      }
      setCustomCategories((prev) => [...prev, { name: clean, icon: 'Folder' }]);
      setSelectedCategory(clean);
      showToast(`Category "${clean}" created`);
    },
    [customCategories, showToast]
  );

  // Sync Local Notes with Neon DB
  const syncWithNeonCloud = useCallback(async () => {
    if (!getStoredToken()) {
      setIsAuthModalOpen(true);
      return;
    }
    setCloudStatus((prev) => ({ ...prev, syncing: true }));
    try {
      const merged = await apiService.syncLocalToCloud(notes);
      if (merged.length > 0) {
        setNotes(merged);
      }
      setCloudStatus({
        connected: true,
        mode: 'neon-cloud',
        syncing: false,
        message: 'Synced with Neon Serverless PostgreSQL'
      });
      showToast('All notes synchronized with Neon Cloud');
    } catch (err) {
      setCloudStatus((prev) => ({ ...prev, syncing: false }));
      showToast(err.message || 'Cloud sync failed — saved locally');
    }
  }, [notes, showToast]);

  const logoutUser = useCallback(() => {
    clearAuthSession();
    setUser(null);
    showToast('Signed out of Neon Cloud — Local-First mode active');
  }, [showToast]);

  // Trigger PWA Install
  const triggerPwaInstall = useCallback(async () => {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      const { outcome } = await deferredPwaPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPwaPrompt(null);
        showToast('Kadjelo Notes installed to your device');
      }
    } else {
      setIsPwaGuideOpen(true);
    }
  }, [deferredPwaPrompt, showToast]);

  // All Categories & All Tags
  const allCategories = useMemo(
    () => [...DEFAULT_CATEGORIES, ...customCategories],
    [customCategories]
  );

  const allTags = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => {
      if (!n.isTrashed && Array.isArray(n.tags)) {
        n.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [notes]);

  // Filtered & Sorted Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        if (activeNav === 'trash') return note.isTrashed;
        if (note.isTrashed) return false;

        if (activeNav === 'archive') return note.isArchived;
        if (note.isArchived && activeNav !== 'archive') return false;

        if (activeNav === 'pinned' && !note.isPinned) return false;
        if (activeNav === 'reminders' && !note.reminderAt) return false;
        if (activeNav === 'locked' && !note.isLocked) return false;

        if (
          selectedCategory !== 'All' &&
          note.category.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }

        if (selectedTag && !(note.tags || []).includes(selectedTag)) {
          return false;
        }

        if (selectedColor !== 'all' && note.color !== selectedColor) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const inTitle = (note.title || '').toLowerCase().includes(q);
          const inContent =
            !note.isLocked && (note.content || '').toLowerCase().includes(q);
          const inCategory = (note.category || '').toLowerCase().includes(q);
          const inTags = (note.tags || []).some((t) => t.toLowerCase().includes(q));
          const inChecklist =
            !note.isLocked &&
            (note.checklist || []).some((c) => c.text.toLowerCase().includes(q));
          return inTitle || inContent || inCategory || inTags || inChecklist;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        if (sortBy === 'created') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (sortBy === 'focus') {
          return (b.focusMinutes || 0) - (a.focusMinutes || 0);
        }
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
  }, [
    notes,
    activeNav,
    selectedCategory,
    selectedTag,
    selectedColor,
    searchQuery,
    sortBy
  ]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) || filteredNotes[0] || null,
    [notes, activeNoteId, filteredNotes]
  );

  // Compute Backlinks for a Given Note Title
  const getBacklinksForNote = useCallback(
    (targetNote) => {
      if (!targetNote || !targetNote.title) return [];
      const needle = `[[${targetNote.title.toLowerCase()}]]`;
      return notes.filter(
        (n) =>
          n.id !== targetNote.id &&
          !n.isTrashed &&
          (n.content || '').toLowerCase().includes(needle)
      );
    },
    [notes]
  );

  const value = {
    themeId,
    setThemeId,
    colorMode,
    setColorMode,
    viewMode,
    setViewMode,
    notes,
    filteredNotes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    isEditorModalOpen,
    setIsEditorModalOpen,
    activeNav,
    setActiveNav,
    selectedCategory,
    setSelectedCategory,
    selectedTag,
    setSelectedTag,
    selectedColor,
    setSelectedColor,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    allCategories,
    allTags,
    addCustomCategory,
    createNote,
    updateNote,
    togglePin,
    toggleArchive,
    moveToTrash,
    restoreFromTrash,
    permanentlyDeleteNote,
    emptyTrash,
    openDailyScratchpad,
    createFromTemplate,
    unlockedNoteIds,
    setUnlockedNoteIds,
    requestOpenNote,
    lockNoteWithPin,
    removeNoteLock,
    lockModalState,
    setLockModalState,
    studyDeckNote,
    setStudyDeckNote,
    shareCardNote,
    setShareCardNote,
    sketchTargetNoteId,
    setSketchTargetNoteId,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    confirmState,
    setConfirmState,
    user,
    setUser,
    cloudStatus,
    syncWithNeonCloud,
    logoutUser,
    toast,
    setToast,
    showToast,
    triggerPwaInstall,
    deferredPwaPrompt,
    isPwaGuideOpen,
    setIsPwaGuideOpen,
    getBacklinksForNote
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used inside NotesProvider');
  return ctx;
}
