import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';

export default function PwaInstallPrompt() {
  const { deferredPwaPrompt } = useNotes();
  const [visible, setVisible] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Never show if running in standalone PWA / installed mode
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://'));

    if (isStandalone) {
      return;
    }

    // 2. Check if already dismissed or already marked installed
    const dismissed = localStorage.getItem('kadjelo_pwa_dismissed') === 'true';
    const installed = localStorage.getItem('kadjelo_pwa_installed') === 'true';

    if (dismissed || installed) {
      return;
    }

    // 3. Delay prompt slightly so page settles and user gets an immediate smooth experience
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2400);

    const handleAppInstalled = () => {
      localStorage.setItem('kadjelo_pwa_installed', 'true');
      setVisible(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('kadjelo_pwa_dismissed', 'true');
    setVisible(false);
  };

  const handleInstallClick = async () => {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      const { outcome } = await deferredPwaPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('kadjelo_pwa_installed', 'true');
        setVisible(false);
      }
    } else {
      // Browser doesn't support beforeinstallprompt (e.g. iOS Safari)
      setShowIosGuide(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 p-3.5 rounded-2xl liquid-glass-heavy border border-[var(--border-specular)] shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <img
                src="/icon.svg"
                alt="Kadjelo Notes"
                className="w-10 h-10 rounded-xl shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                  Install Kadjelo Notes
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                  Add to Home Screen for fast offline notes
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-accent text-xs font-semibold pressable shadow-xs"
                >
                  <Download size={13} strokeWidth={2} />
                  <span>Install</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] pressable"
                  aria-label="Dismiss install banner"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Safari Add to Home Screen Modal Guide */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl liquid-glass-heavy p-5 space-y-4 border border-[var(--border-specular)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icon.svg"
                  alt="Kadjelo"
                  className="w-8 h-8 rounded-xl shadow-xs shrink-0"
                />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Add to Home Screen
                </h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] pressable"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[var(--text-secondary)]">
              <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
                <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Share2 size={13} strokeWidth={2} className="text-[var(--accent-primary)]" />
                  Step 1: Tap Share Icon
                </div>
                <p>In Safari, tap the Share button in the bottom menu bar.</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
                <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <PlusSquare size={13} strokeWidth={2} className="text-[var(--accent-primary)]" />
                  Step 2: Add to Home Screen
                </div>
                <p>Scroll down and choose &ldquo;Add to Home Screen&rdquo;.</p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosGuide(false);
                handleDismiss();
              }}
              className="w-full py-2 rounded-xl btn-accent text-xs font-semibold pressable"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
