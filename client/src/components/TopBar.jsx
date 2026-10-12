import React, { useState } from 'react';
import {
  Search,
  Plus,
  LayoutGrid,
  Columns,
  Kanban,
  Network,
  Palette,
  Sun,
  Moon,
  Command,
  ArrowUpDown,
  Menu,
  Download,
  FilePlus2,
  Check,
  Trash2,
  X
} from 'lucide-react';
import {
  useNotes,
  THEME_OPTIONS,
  NOTE_TINTS,
  NOTE_TEMPLATES
} from '../context/NotesContext.jsx';
import { exportService } from '../services/exportService.js';

export default function TopBar({ onOpenMobileMenu }) {
  const {
    themeId,
    setThemeId,
    colorMode,
    setColorMode,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedColor,
    setSelectedColor,
    activeNav,
    notes,
    createNote,
    createFromTemplate,
    setIsEditorModalOpen,
    setIsCommandPaletteOpen,
    emptyTrash
  } = useNotes();

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const viewModes = [
    { id: 'grid', label: 'Grid', icon: LayoutGrid },
    { id: 'split', label: 'Split', icon: Columns },
    { id: 'kanban', label: 'Board', icon: Kanban },
    { id: 'graph', label: 'Graph', icon: Network }
  ];

  const handleNewNote = async () => {
    await createNote({});
    if (viewMode !== 'split') {
      setIsEditorModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 liquid-glass border-b border-[var(--border-subtle)] px-4 md:px-6 py-2.5 md:py-3">
      {/* MOBILE HEADER (< md): Prominent Hamburger Button + Brand + Actions + Search */}
      <div className="md:hidden flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Mobile Left: Dedicated Prominent Hamburger Button & Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onOpenMobileMenu}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] pressable shadow-xs shrink-0"
              aria-label="Open navigation sidebar"
            >
              <Menu size={20} strokeWidth={2} />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <img
                src="/icon.svg"
                alt="Kadjelo Notes"
                className="w-7 h-7 rounded-lg shadow-xs shrink-0"
              />
              <span className="font-bold text-sm tracking-tight text-[var(--text-primary)] truncate">
                Kadjelo Notes
              </span>
            </div>
          </div>

          {/* Mobile Right: Theme Switcher & Quick New Note */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setShowThemeMenu((v) => !v);
                setShowTemplateMenu(false);
              }}
              className="p-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] pressable"
              title="Appearance & Theme"
              aria-label="Theme settings"
            >
              <Palette size={16} strokeWidth={1.75} />
            </button>

            {activeNav === 'trash' ? (
              <button
                onClick={emptyTrash}
                className="p-2 rounded-xl bg-rose-500/20 text-rose-300 pressable"
                title="Empty Trash"
              >
                <Trash2 size={16} strokeWidth={1.75} />
              </button>
            ) : (
              <button
                onClick={handleNewNote}
                className="flex items-center justify-center w-8 h-8 rounded-xl btn-accent pressable shadow-sm"
                aria-label="Create note"
                title="Create new note"
              >
                <Plus size={18} strokeWidth={2.25} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Row */}
        <div className="relative w-full">
          <Search
            size={15}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, #tags, checklists..."
            className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Clear search"
            >
              <X size={13} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP HEADER (>= md): Single Streamlined Horizontal Bar */}
      <div className="hidden md:flex items-center justify-between gap-3">
        {/* Left: Search Input + Command Palette Shortcut */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[220px] max-w-xl">
          <div className="relative flex-1">
            <Search
              size={16}
              strokeWidth={1.75}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search titles, keywords, #tags, checklists..."
              className="w-full pl-9 pr-20 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Clear search"
              >
                <X size={14} strokeWidth={2} />
              </button>
            ) : (
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden sm:inline-flex items-center gap-1 absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-secondary)] pressable"
                title="Open Command Palette (Ctrl+K)"
              >
                <Command size={11} strokeWidth={2} />
                <span>K</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: 4-Mode Switcher, Sort, Theme Popover, Templates & New Note CTA */}
        <div className="flex items-center gap-2">
          {/* 4-View Segmented Control */}
          <div
            role="group"
            aria-label="Workspace layout mode"
            className="hidden sm:flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]"
          >
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              const active = viewMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold pressable ${
                    active
                      ? 'btn-accent text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.75} />
                  <span className="hidden lg:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            <ArrowUpDown size={14} strokeWidth={1.75} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort notes by"
              className="bg-transparent text-xs font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="updated" className="bg-[var(--bg-elevated)]">
                Sort: Updated
              </option>
              <option value="created" className="bg-[var(--bg-elevated)]">
                Sort: Created
              </option>
              <option value="title" className="bg-[var(--bg-elevated)]">
                Sort: Title A-Z
              </option>
              <option value="focus" className="bg-[var(--bg-elevated)]">
                Sort: Focus Time
              </option>
            </select>
          </div>

          {/* Multi-Theme & Appearance Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowThemeMenu((v) => !v);
                setShowTemplateMenu(false);
              }}
              className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
              title="Appearance & Multi-Theme Switcher"
            >
              <Palette size={17} strokeWidth={1.75} />
            </button>

            {showThemeMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowThemeMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-2xl liquid-glass-heavy p-3.5 z-50 origin-top-right space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Appearance & Theme
                    </span>
                    <button
                      onClick={() =>
                        setColorMode(colorMode === 'dark' ? 'light' : 'dark')
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-semibold pressable"
                    >
                      {colorMode === 'dark' ? (
                        <>
                          <Sun size={13} strokeWidth={1.75} className="text-amber-400" />
                          <span>Light Mode</span>
                        </>
                      ) : (
                        <>
                          <Moon size={13} strokeWidth={1.75} className="text-indigo-500" />
                          <span>Dark Mode</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {THEME_OPTIONS.map((t) => {
                      const selected = themeId === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setThemeId(t.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl border text-left pressable ${
                            selected
                              ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)]'
                              : 'bg-[var(--bg-subtle)] border-transparent hover:border-[var(--border-subtle)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-5 h-5 rounded-full border border-white/25 shrink-0"
                              style={{
                                background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`
                              }}
                            />
                            <div>
                              <div className="text-xs font-semibold text-[var(--text-primary)]">
                                {t.name}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)]">
                                {t.subtitle}
                              </div>
                            </div>
                          </div>
                          {selected && (
                            <Check
                              size={15}
                              strokeWidth={2.2}
                              className="text-[var(--accent-primary)]"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Color Filter Row */}
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                      Filter by Note Tint
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setSelectedColor('all')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold pressable ${
                          selectedColor === 'all'
                            ? 'btn-accent text-white'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                        }`}
                      >
                        All
                      </button>
                      {NOTE_TINTS.filter((c) => c.id !== 'default').map((tint) => (
                        <button
                          key={tint.id}
                          onClick={() =>
                            setSelectedColor(
                              selectedColor === tint.id ? 'all' : tint.id
                            )
                          }
                          className={`w-5 h-5 rounded-full pressable border-2 ${
                            selectedColor === tint.id
                              ? 'border-white scale-110'
                              : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: tint.hex }}
                          title={`Filter by ${tint.label}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Backup All Notes JSON */}
                  <button
                    onClick={() => {
                      exportService.exportAllAsJson(notes);
                      setShowThemeMenu(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-xs font-semibold pressable"
                  >
                    <Download size={14} strokeWidth={1.75} />
                    Export Full JSON Backup
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Templates Dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => {
                setShowTemplateMenu((v) => !v);
                setShowThemeMenu(false);
              }}
              className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] pressable"
              title="Create from Template"
            >
              <FilePlus2 size={17} strokeWidth={1.75} />
            </button>

            {showTemplateMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTemplateMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl liquid-glass-heavy p-2.5 z-50 origin-top-right space-y-1">
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Starter Templates
                  </div>
                  {NOTE_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        createFromTemplate(tpl);
                        setShowTemplateMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--accent-soft)] text-left pressable"
                    >
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {tpl.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                        {tpl.category}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Trash Bin Empty Action OR New Note Button */}
          {activeNav === 'trash' ? (
            <button
              onClick={emptyTrash}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold pressable"
            >
              <Trash2 size={15} strokeWidth={1.75} />
              <span>Empty Trash</span>
            </button>
          ) : (
            <button
              onClick={handleNewNote}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-accent text-xs font-semibold pressable"
            >
              <Plus size={16} strokeWidth={2.2} />
              <span>New Note</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
