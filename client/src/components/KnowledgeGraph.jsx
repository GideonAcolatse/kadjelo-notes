import React, { useEffect, useRef, useState } from 'react';
import { Network, Sparkles, Link2 } from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';

export default function KnowledgeGraph() {
  const { filteredNotes, requestOpenNote } = useNotes();
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);

  useEffect(() => {
    const activeNotes = filteredNotes.filter((n) => !n.isTrashed);
    const width = canvasRef.current?.clientWidth || 800;
    const height = 520;

    const nodes = activeNotes.map((note, idx) => {
      const angle = (idx / Math.max(1, activeNotes.length)) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.3;
      return {
        id: note.id,
        title: note.title || 'Untitled',
        category: note.category || 'Personal',
        isPinned: note.isPinned,
        note,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });

    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      const source = nodes[i];
      const wikiMatches = Array.from(
        (source.note.content || '').matchAll(/\[\[([^\]]+)\]\]/g)
      ).map((m) => m[1].toLowerCase().trim());

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const target = nodes[j];
        if (wikiMatches.includes(target.title.toLowerCase().trim())) {
          edges.push({
            source: source.id,
            target: target.id,
            type: 'wiki'
          });
        } else if (
          i < j &&
          source.category === target.category
        ) {
          edges.push({
            source: source.id,
            target: target.id,
            type: 'category'
          });
        }
      }
    }

    nodesRef.current = nodes;
    edgesRef.current = edges;

    let animationFrameId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;

      // Simple spring relaxation physics
      for (let i = 0; i < currentNodes.length; i++) {
        const a = currentNodes[i];
        // Pull gently to center
        a.vx += (rect.width / 2 - a.x) * 0.0012;
        a.vy += (rect.height / 2 - a.y) * 0.0012;

        for (let j = i + 1; j < currentNodes.length; j++) {
          const b = currentNodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.max(20, Math.hypot(dx, dy));
          const repulse = 1400 / (dist * dist);
          const fx = (dx / dist) * repulse;
          const fy = (dy / dist) * repulse;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      currentEdges.forEach((edge) => {
        const s = currentNodes.find((n) => n.id === edge.source);
        const t = currentNodes.find((n) => n.id === edge.target);
        if (!s || !t) return;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const targetDist = edge.type === 'wiki' ? 140 : 210;
        const force = (dist - targetDist) * 0.003;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        s.vx += fx;
        s.vy += fy;
        t.vx -= fx;
        t.vy -= fy;
      });

      currentNodes.forEach((n) => {
        n.vx *= 0.84;
        n.vy *= 0.84;
        n.x = Math.max(60, Math.min(rect.width - 60, n.x + n.vx));
        n.y = Math.max(50, Math.min(rect.height - 50, n.y + n.vy));
      });

      // Draw Edges
      currentEdges.forEach((edge) => {
        const s = currentNodes.find((n) => n.id === edge.source);
        const t = currentNodes.find((n) => n.id === edge.target);
        if (!s || !t) return;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        if (edge.type === 'wiki') {
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.65)';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      });

      // Draw Nodes
      currentNodes.forEach((n) => {
        const isHovered = hoveredNode?.id === n.id;
        const r = n.isPinned ? 13 : 10;

        // Glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + (isHovered ? 8 : 4), 0, Math.PI * 2);
        ctx.fillStyle = isHovered
          ? 'rgba(99, 102, 241, 0.35)'
          : 'rgba(99, 102, 241, 0.14)';
        ctx.fill();

        // Core Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.isPinned ? '#6366f1' : '#8b5cf6';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Label
        ctx.font = '600 12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        const label =
          n.title.length > 24 ? `${n.title.slice(0, 22)}...` : n.title;
        ctx.fillText(label, n.x, n.y + r + 16);
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [filteredNotes, hoveredNode]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = nodesRef.current.find(
      (n) => Math.hypot(n.x - x, n.y - y) < 22
    );
    if (hit) {
      requestOpenNote(hit.note);
    }
  };

  const handleCanvasMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = nodesRef.current.find(
      (n) => Math.hypot(n.x - x, n.y - y) < 22
    );
    setHoveredNode(hit || null);
  };

  return (
    <div className="liquid-card rounded-2xl p-4 border border-[var(--border-specular)] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
            <Network size={18} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Second-Brain Knowledge Graph
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Click any node to open the note. Solid indigo lines connect{' '}
              <code className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)]">
                [[Wiki-Links]]
              </code>
              ; subtle lines group shared categories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <Link2 size={13} strokeWidth={2} className="text-indigo-400" />
            Wiki-Link Connection
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={13} strokeWidth={2} className="text-violet-400" />
            {filteredNotes.length} Active Nodes
          </span>
        </div>
      </div>

      <div className="relative w-full h-[500px] rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMove}
          className="w-full h-full cursor-pointer"
        />
      </div>
    </div>
  );
}
