import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share2, PlusSquare, X, Monitor, Smartphone, CheckCircle2, MoreVertical, Sparkles } from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';

export default function PwaInstallPrompt() {
  const { deferredPwaPrompt, isPwaGuideOpen, setIsPwaGuideOpen, showToast } = useNotes();
  const [bannerVisible, setBannerVisible] = useState(false);
  const [platform, setPlatform] = useState('unknown'); // 'ios' | 'android' | 'desktop'
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect Standalone / Installed PWA mode
    const standaloneMode =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://'));
    setIsStandalone(standaloneMode);

    if (standaloneMode) {
      return;
    }

    // Detect Platform
    const ua = navigator.userAgent || '';
    const isIos = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    if (isIos) setPlatform('ios');
    else if (isAndroid) setPlatform('android');
    else setPlatform('desktop');

    // Auto-banner: check 24-hour snooze
    const snoozedUntil = parseInt(localStorage.getItem('kadjelo_pwa_snooze') || '0', 10);
    const installed = localStorage.getItem('kadjelo_pwa_installed') === 'true';

    if (!installed && Date.now() > snoozedUntil) {
      const timer = setTimeout(() => {
        setBannerVisible(true);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for native appinstalled event
  useEffect(() => {
    const handleAppInstalled = () => {
      localStorage.setItem('kadjelo_pwa_installed', 'true');
      setBannerVisible(false);
      setIsPwaGuideOpen(false);
      showToast('KadjeloNote installed successfully! Enjoy your offline second brain.');
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [setIsPwaGuideOpen, showToast]);

  const handleSnoozeBanner = () => {
    // Snooze banner for 24 hours
    localStorage.setItem('kadjelo_pwa_snooze', String(Date.now() + 86400000));
    setBannerVisible(false);
  };

  const handlePrimaryInstall = async () => {
    if (deferredPwaPrompt) {
      try {
        deferredPwaPrompt.prompt();
        const { outcome } = await deferredPwaPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('kadjelo_pwa_installed', 'true');
          setBannerVisible(false);
          setIsPwaGuideOpen(false);
          showToast('KadjeloNote is installing to your home screen...');
        }
      } catch (err) {
        console.warn('Native PWA prompt failed:', err);
        setIsPwaGuideOpen(true);
      }
    } else {
      // Open comprehensive guide modal tailored to the user's device
      setIsPwaGuideOpen(true);
      setBannerVisible(false);
    }
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Install Banner */}
      <AnimatePresence>
        {bannerVisible && (
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="fixed bottom-20 md:bottom-6 left-3.5 right-3.5 md:left-auto md:right-6 md:w-[410px] z-40 p-4 rounded-2xl liquid-glass-heavy border border-[var(--border-specular)] shadow-2xl"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <img
                  src="/icon-192.png"
                  alt="KadjeloNote Icon"
                  className="w-12 h-12 rounded-xl shadow-md border border-[var(--border-specular)] object-cover"
                />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-canvas)]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                    Install KadjeloNote
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] border border-[var(--border-specular)] shrink-0">
                    PWA
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                  Offline-ready app · 1-tap launch from home screen
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handlePrimaryInstall}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-accent text-xs font-semibold pressable shadow-xs"
                >
                  <Download size={13} strokeWidth={2.2} />
                  <span>Install</span>
                </button>
                <button
                  onClick={handleSnoozeBanner}
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] pressable"
                  aria-label="Dismiss banner for now"
                  title="Dismiss for 24 hours"
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal Multi-Platform Installation Guide Modal */}
      <AnimatePresence>
        {isPwaGuideOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsPwaGuideOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
              className="w-full max-w-md rounded-2xl liquid-glass-heavy p-5 sm:p-6 space-y-4 border border-[var(--border-specular)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <img
                    src="/icon-192.png"
                    alt="KadjeloNote"
                    className="w-10 h-10 rounded-xl shadow-md border border-[var(--border-specular)] shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      Install KadjeloNote
                      <Sparkles size={14} className="text-[var(--accent-primary)]" />
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Your second brain for notes, ideas &amp; a smarter tomorrow
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPwaGuideOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] pressable"
                  aria-label="Close installation guide"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {/* If browser supports 1-tap install prompt */}
              {deferredPwaPrompt ? (
                <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--border-specular)] space-y-3 text-center">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    Direct 1-Tap Installation Available
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Your browser supports instant installation. Tap the button below to add KadjeloNote to your device home screen or app launcher.
                  </p>
                  <button
                    onClick={handlePrimaryInstall}
                    className="w-full py-2.5 rounded-xl btn-accent text-xs font-bold flex items-center justify-center gap-2 pressable shadow-md"
                  >
                    <Download size={15} strokeWidth={2.2} />
                    <span>Install to Device Now</span>
                  </button>
                </div>
              ) : null}

              {/* Platform Specific Step-by-Step Instructions */}
              <div className="space-y-2.5">
                {/* iOS Instructions */}
                {(platform === 'ios' || (!deferredPwaPrompt && platform !== 'android' && platform !== 'desktop')) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-primary)] px-1">
                      <Smartphone size={14} />
                      <span>On iPhone or iPad (Safari):</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs">
                      <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] text-[10px] font-bold">
                          1
                        </span>
                        Tap the Share button <Share2 size={13} className="text-[var(--accent-primary)] inline" />
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] pl-7">
                        In Safari's bottom toolbar (or top right on iPad), tap the Share icon.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs">
                      <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] text-[10px] font-bold">
                          2
                        </span>
                        Choose &ldquo;Add to Home Screen&rdquo; <PlusSquare size={13} className="text-[var(--accent-primary)] inline" />
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] pl-7">
                        Scroll down the menu list and tap &ldquo;Add to Home Screen&rdquo;, then tap &ldquo;Add&rdquo; in the top-right.
                      </p>
                    </div>
                  </div>
                )}

                {/* Android Instructions (if deferredPrompt not immediately available) */}
                {(platform === 'android' || !deferredPwaPrompt) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-primary)] px-1">
                      <Smartphone size={14} />
                      <span>On Android (Chrome / Brave / Samsung):</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs">
                      <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] text-[10px] font-bold">
                          1
                        </span>
                        Tap the 3-dots Menu <MoreVertical size={13} className="text-[var(--accent-primary)] inline" />
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] pl-7">
                        Tap the three vertical dots in the top-right corner of Chrome.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs">
                      <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] text-[10px] font-bold">
                          2
                        </span>
                        Select &ldquo;Install App&rdquo; or &ldquo;Add to Home Screen&rdquo;
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] pl-7">
                        Tap &ldquo;Install app&rdquo; to download the native standalone WebAPK to your launcher.
                      </p>
                    </div>
                  </div>
                )}

                {/* Desktop Instructions */}
                {(platform === 'desktop' || !deferredPwaPrompt) && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-primary)] px-1">
                      <Monitor size={14} />
                      <span>On Desktop (Chrome, Edge, Brave, Mac/PC):</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1 text-xs">
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Click the <strong className="text-[var(--text-primary)]">Install icon (⊕)</strong> on the right side of your browser address bar, or open the browser menu <MoreVertical size={12} className="inline" /> &rarr; <strong className="text-[var(--text-primary)]">Install KadjeloNote</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Benefits list */}
              <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] grid grid-cols-2 gap-2 text-[11px] text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Works 100% Offline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Fast Full-Screen UI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Zero App Store Hassle</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Auto Neon Cloud Sync</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsPwaGuideOpen(false);
                  handleSnoozeBanner();
                }}
                className="w-full py-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-xs font-semibold text-[var(--text-primary)] pressable border border-[var(--border-subtle)]"
              >
                Got It, Thanks!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
