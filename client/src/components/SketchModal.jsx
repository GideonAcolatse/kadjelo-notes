import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Eraser,
  RotateCcw,
  Check,
  X
} from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';

const STROKE_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#06b6d4',
  '#ffffff'
];

export default function SketchModal() {
  const {
    sketchTargetNoteId,
    setSketchTargetNoteId,
    notes,
    updateNote,
    showToast
  } = useNotes();

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#6366f1');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'

  const targetNote = notes.find((n) => n.id === sketchTargetNoteId);

  useEffect(() => {
    if (!sketchTargetNoteId || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [sketchTargetNoteId]);

  if (!sketchTargetNoteId || !targetNote) return null;

  const getPointerPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = getPointerPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = getPointerPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = tool === 'eraser' ? strokeWidth * 4 : strokeWidth;
    ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : strokeColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveSketch = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const newSketch = {
      id: `att_sketch_${Date.now()}`,
      type: 'sketch',
      name: `Freehand Sketch (${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })})`,
      dataUrl,
      createdAt: new Date().toISOString()
    };
    const nextAttachments = [...(targetNote.attachments || []), newSketch];
    updateNote(targetNote.id, { attachments: nextAttachments });
    setSketchTargetNoteId(null);
    showToast('Sketch saved to note');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl liquid-glass-heavy p-4 space-y-3 border border-[var(--border-specular)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool size={18} strokeWidth={1.75} className="text-[var(--accent-primary)]" />
            <h3 className="text-sm font-bold">
              Finger & Stylus Sketch Pad — {targetNote.title || 'Note'}
            </h3>
          </div>
          <button
            onClick={() => setSketchTargetNoteId(null)}
            className="p-1.5 rounded-xl bg-[var(--bg-subtle)] pressable"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Drawing Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--bg-subtle)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTool('pen')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold pressable ${
                tool === 'pen' ? 'btn-accent text-white' : 'bg-[var(--bg-card)]'
              }`}
            >
              <PenTool size={13} strokeWidth={1.75} />
              Pen
            </button>
            <button
              type="button"
              onClick={() => setTool('eraser')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold pressable ${
                tool === 'eraser' ? 'btn-accent text-white' : 'bg-[var(--bg-card)]'
              }`}
            >
              <Eraser size={13} strokeWidth={1.75} />
              Eraser
            </button>

            <div className="flex items-center gap-1.5 ml-2">
              {STROKE_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    setStrokeColor(hex);
                    setTool('pen');
                  }}
                  className={`w-5 h-5 rounded-full border-2 pressable ${
                    strokeColor === hex && tool === 'pen'
                      ? 'border-white scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="2"
              max="14"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20 accent-[var(--accent-primary)]"
              title="Brush thickness"
            />
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] text-xs font-semibold pressable"
            >
              <RotateCcw size={13} strokeWidth={1.75} />
              Clear
            </button>
          </div>
        </div>

        {/* Touch-Captured HTML5 Canvas */}
        <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[#0f172a] touch-none">
          <canvas
            ref={canvasRef}
            width={800}
            height={440}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-[320px] sm:h-[380px] cursor-crosshair touch-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setSketchTargetNoteId(null)}
            className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] text-xs font-semibold pressable"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSketch}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-accent text-xs font-semibold pressable"
          >
            <Check size={15} strokeWidth={2} />
            Attach Sketch to Note
          </button>
        </div>
      </div>
    </div>
  );
}
