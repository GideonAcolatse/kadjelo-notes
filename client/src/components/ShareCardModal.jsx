import React, { useRef, useEffect } from 'react';
import {
  Share2,
  Download,
  FileText,
  Printer,
  X
} from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';
import { exportService } from '../services/exportService.js';

export default function ShareCardModal() {
  const { shareCardNote, setShareCardNote, showToast } = useNotes();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!shareCardNote || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const w = 1080;
    const h = 680;
    canvas.width = w;
    canvas.height = h;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#090a0f');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#311042');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Inner Card Glass Frame
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(64, 64, w - 128, h - 128, 36);
    ctx.fill();
    ctx.stroke();

    // Category Pill
    ctx.fillStyle = '#6366f1';
    ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(
      (shareCardNote.category || 'PERSONAL').toUpperCase(),
      116,
      140
    );

    // Note Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 44px -apple-system, BlinkMacSystemFont, sans-serif';
    const titleText = (shareCardNote.title || 'Untitled Note').slice(0, 48);
    ctx.fillText(titleText, 116, 210);

    // Note Excerpt Lines
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '400 28px -apple-system, BlinkMacSystemFont, sans-serif';
    const rawBody = (shareCardNote.content || '')
      .replace(/[#*`>-]/g, '')
      .trim();
    const words = rawBody.split(/\s+/);
    let line = '';
    let y = 285;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      if (ctx.measureText(testLine).width > w - 240) {
        ctx.fillText(line, 116, y);
        line = words[i] + ' ';
        y += 44;
        if (y > 480) {
          line += '...';
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, 116, y);

    // Footer Brand Watermark
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(
      'Kadjelo Notes — Capture at the Speed of Thought',
      116,
      h - 110
    );
  }, [shareCardNote]);

  if (!shareCardNote) return null;

  const handleDownloadPng = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${(shareCardNote.title || 'kadjelo-note')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-card.png`;
    link.click();
    showToast('Downloaded Kadjelo Social Card PNG');
  };

  const handleNativeShare = async () => {
    const shared = await exportService.shareNative(shareCardNote);
    showToast(
      shared ? 'Shared via device Share Sheet' : 'Note text copied to clipboard'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl liquid-glass-heavy p-5 space-y-4 border border-[var(--border-specular)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 size={18} strokeWidth={1.75} className="text-[var(--accent-primary)]" />
            <h3 className="text-sm font-bold">
              Share & Export — {shareCardNote.title || 'Note'}
            </h3>
          </div>
          <button
            onClick={() => setShareCardNote(null)}
            className="p-1.5 rounded-xl bg-[var(--bg-subtle)] pressable"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Social Card Canvas Preview */}
        <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-black/30">
          <canvas ref={canvasRef} className="w-full h-auto block" />
        </div>

        {/* Export & Share Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={handleDownloadPng}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl btn-accent text-xs font-semibold pressable"
          >
            <Download size={14} strokeWidth={2} />
            PNG Card
          </button>

          <button
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-xs font-semibold pressable"
          >
            <Share2 size={14} strokeWidth={1.75} />
            Share Sheet
          </button>

          <button
            onClick={() => exportService.exportAsMarkdown(shareCardNote)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-xs font-semibold pressable"
          >
            <FileText size={14} strokeWidth={1.75} />
            Markdown
          </button>

          <button
            onClick={() => exportService.exportNoteToPdf(shareCardNote)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-xs font-semibold pressable"
          >
            <Printer size={14} strokeWidth={1.75} />
            Print / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
