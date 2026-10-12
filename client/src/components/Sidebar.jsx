import React, { useState } from 'react';
import {
  FileText,
  Pin,
  Bell,
  Lock,
  Archive,
  Trash2,
  Briefcase,
  User,
  GraduationCap,
  Lightbulb,
  ShoppingBag,
  Compass,
  Folder,
  Hash,
  Plus,
  Cloud,
  RefreshCw,
  Calendar,
  Layers,
  X,
  Search,
  Network,
  Menu
} from 'lucide-react';
import { useNotes, NOTE_TEMPLATES } from '../context/NotesContext.jsx';

const CATEGORY_ICON_MAP = {
  Briefcase,
  User,
  GraduationCap,
  Lightbulb,
  ShoppingBag,
  Compass,
  Folder
};

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const {
    notes,
    activeNav,
    setActiveNav,
    selectedCategory,
    setSelectedCategory,
    selectedTag,
    setSelectedTag,
    allCategories,
    allTags,
    addCustomCategory,
    openDailyScratchpad,
    createFromTemplate,
    createNote,
    setIsEditorModalOpen,
    viewMode,
    setViewMode,
    setIsCommandPaletteOpen,
    cloudStatus,
    user,
    syncWithNeonCloud
  } = useNotes();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const counts = {
    all: notes.filter((n) => !n.isTrashed && !n.isArchived).length,
    pinned: notes.filter((n) => !n.isTrashed && !n.isArchived && n.isPinned).length,
    reminders: notes.filter((n) => !n.isTrashed && !n.isArchived && n.reminderAt).length,
    locked: notes.filter((n) => !n.isTrashed && n.isLocked).length,
    archive: notes.filter((n) => !n.isTrashed && n.isArchived).length,
    trash: notes.filter((n) => n.isTrashed).length
  };

  const navItems = [
    { id: 'all', label: 'All Notes', icon: FileText, count: counts.all },
    { id: 'pinned', label: 'Pinned', icon: Pin, count: counts.pinned },
    { id: 'reminders', label: 'Reminders', icon: Bell, count: counts.reminders },
    { id: 'locked', label: 'Privacy Vault', icon: Lock, count: counts.locked },
    { id: 'archive', label: 'Archive', icon: Archive, count: counts.archive },
    { id: 'trash', label: 'Trash Bin', icon: Trash2, count: counts.trash }
  ];

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCustomCategory(newCategoryName);
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 select-none">
      <div className="space-y-6 overflow-y-auto pr-1">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <img
              src="/icon.svg"
              alt="KadjeloNote"
              className="w-9 h-9 rounded-xl shadow-md"
            />
            <div>
              <div className="font-bold text-base tracking-tight leading-none">
                KadjeloNote
              </div>
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                Your Second Brain
              </span>
            </div>
          </div>
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-2 rounded-xl hover:bg-[var(--bg-subtle)] pressable"
              aria-label="Close navigation menu"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* 1-Tap Daily Scratchpad Button */}
        <button
          onClick={() => {
            openDailyScratchpad();
            setMobileOpen(false);
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--border-specular)] text-[var(--text-primary)] pressable"
        >
          <span className="flex items-center gap-2.5 text-xs font-semibold">
            <Calendar size={16} strokeWidth={1.75} className="text-[var(--accent-primary)]" />
            Today&apos;s Scratchpad
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
            Daily
          </span>
        </button>

        {/* Primary Views */}
        <div>
          <div className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Workspace
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium pressable ${
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--text-primary)] border border-[var(--border-specular)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      size={17}
                      strokeWidth={1.75}
                      className={isActive ? 'text-[var(--accent-primary)]' : ''}
                    />
                    {item.label}
                  </span>
                  {item.count > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Categories
            </span>
            <button
              onClick={() => setShowAddCategory((v) => !v)}
              className="p-1 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] pressable"
              title="Add custom category"
            >
              <Plus size={14} strokeWidth={2} />
            </button>
          </div>

          {showAddCategory && (
            <form onSubmit={handleAddCategorySubmit} className="mb-2 flex gap-1.5 px-1">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg btn-accent pressable"
              >
                Add
              </button>
            </form>
          )}

          <div className="space-y-0.5">
            <button
              onClick={() => {
                setSelectedCategory('All');
                setActiveNav('all');
                setMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium pressable ${
                selectedCategory === 'All' && activeNav === 'all'
                  ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers size={15} strokeWidth={1.75} />
                All Categories
              </span>
            </button>

            {allCategories.map((cat) => {
              const Icon = CATEGORY_ICON_MAP[cat.icon] || Folder;
              const isSelected =
                selectedCategory.toLowerCase() === cat.name.toLowerCase();
              const catCount = notes.filter(
                (n) =>
                  !n.isTrashed &&
                  !n.isArchived &&
                  n.category.toLowerCase() === cat.name.toLowerCase()
              ).length;

              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    if (activeNav === 'trash' || activeNav === 'archive') {
                      setActiveNav('all');
                    }
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium pressable ${
                    isSelected
                      ? 'bg-[var(--accent-soft)] text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      size={15}
                      strokeWidth={1.75}
                      className={isSelected ? 'text-[var(--accent-primary)]' : ''}
                    />
                    {cat.name}
                  </span>
                  {catCount > 0 && (
                    <span className="text-[11px] text-[var(--text-muted)]">{catCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Starter Templates */}
        <div>
          <div className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Quick Templates
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {NOTE_TEMPLATES.slice(0, 4).map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  createFromTemplate(tpl);
                  setMobileOpen(false);
                }}
                className="flex flex-col items-start p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] border border-[var(--border-subtle)] text-left pressable"
              >
                <span className="text-[11px] font-semibold text-[var(--text-primary)] line-clamp-1">
                  {tpl.name.replace('Executive ', '').replace('Smart ', '')}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">{tpl.category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tags Cloud */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Tags
              </span>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-[11px] text-[var(--accent-primary)] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 px-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(selectedTag === tag ? null : tag);
                    setMobileOpen(false);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium pressable ${
                    selectedTag === tag
                      ? 'btn-accent text-white'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Hash size={11} strokeWidth={2} />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer: Quiet Neon Cloud Status */}
      <div className="pt-3 mt-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  cloudStatus.connected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  cloudStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {cloudStatus.connected ? 'Neon Cloud Connected' : 'Local Storage Mode'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] truncate">
                {user ? user.name : 'PostgreSQL Serverless'}
              </div>
            </div>
          </div>

          <button
            onClick={syncWithNeonCloud}
            className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
            title="Sync with Neon PostgreSQL"
            aria-label="Sync with Neon Cloud"
          >
            <RefreshCw
              size={14}
              strokeWidth={1.75}
              className={cloudStatus.syncing ? 'animate-spin text-[var(--accent-primary)]' : ''}
            />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Translucent Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0 liquid-glass border-r border-[var(--border-subtle)] z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full liquid-glass-heavy z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Mobile Floating Liquid Glass Bottom Tab Bar (Fitts's Law Thumb Zone) */}
      <nav
        aria-label="Mobile quick navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 liquid-glass border-t border-[var(--border-specular)] px-3 pt-2 pb-safe flex items-center justify-around"
      >
        <button
          onClick={() => {
            setActiveNav('all');
            setViewMode('grid');
          }}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] rounded-xl pressable ${
            activeNav === 'all' && viewMode === 'grid'
              ? 'text-[var(--accent-primary)]'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <FileText size={19} strokeWidth={1.75} />
          <span className="text-[10px] font-semibold mt-0.5">Notes</span>
        </button>

        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex flex-col items-center justify-center min-w-[52px] min-h-[44px] rounded-xl text-[var(--text-secondary)] pressable"
        >
          <Search size={19} strokeWidth={1.75} />
          <span className="text-[10px] font-semibold mt-0.5">Search</span>
        </button>

        <button
          onClick={async () => {
            await createNote({});
            setIsEditorModalOpen(true);
          }}
          className="flex items-center justify-center w-12 h-12 -mt-4 rounded-2xl btn-accent shadow-lg pressable"
          aria-label="Create new note"
        >
          <Plus size={22} strokeWidth={2.25} />
        </button>

        <button
          onClick={() => setViewMode(viewMode === 'graph' ? 'grid' : 'graph')}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] rounded-xl pressable ${
            viewMode === 'graph'
              ? 'text-[var(--accent-primary)]'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <Network size={19} strokeWidth={1.75} />
          <span className="text-[10px] font-semibold mt-0.5">Graph</span>
        </button>

        <button
          onClick={() => setMobileOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] rounded-xl pressable ${
            mobileOpen
              ? 'text-[var(--accent-primary)] font-semibold'
              : 'text-[var(--text-secondary)]'
          }`}
          aria-label="Open navigation menu and categories"
        >
          <Menu size={20} strokeWidth={1.75} />
          <span className="text-[10px] font-semibold mt-0.5">Menu</span>
        </button>
      </nav>
    </>
  );
}
