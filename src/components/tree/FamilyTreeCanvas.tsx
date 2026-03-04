import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tables } from '@/integrations/supabase/types';
import { TreeNode, NODE_WIDTH, NODE_HEIGHT, SPOUSE_GAP, V_GAP, getTreeBounds } from '@/lib/family-tree-layout';
import { User } from 'lucide-react';
import { TreeNodeCard } from './TreeNodeCard';
import { TreeConnections } from './TreeConnections';

type FamilyMember = Tables<'family_members'>;

type Props = {
  trees: TreeNode[];
  focusMemberId?: string | null;
};

export function FamilyTreeCanvas({ trees, focusMemberId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [animating, setAnimating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const navigate = useNavigate();

  const focusOnNode = useCallback((nx: number, ny: number, nw: number) => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const scale = transform.scale;
    const x = cw / 2 - (nx + nw / 2) * scale;
    const y = ch / 2 - (ny + NODE_HEIGHT / 2) * scale;
    setAnimating(true);
    setTransform(prev => ({ ...prev, x, y }));
    setTimeout(() => setAnimating(false), 400);
  }, [transform.scale]);

  // Center tree on mount
  useEffect(() => {
    if (trees.length === 0 || !containerRef.current) return;
    const bounds = getTreeBounds(trees);
    const container = containerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const tw = bounds.maxX - bounds.minX + 100;
    const th = bounds.maxY - bounds.minY + 100;
    const scale = Math.min(cw / tw, ch / th, 1);
    const x = (cw - tw * scale) / 2 - bounds.minX * scale + 50 * scale;
    const y = 40;
    setTransform({ x, y, scale });
  }, [trees]);

  // Focus on member if focusMemberId is set
  useEffect(() => {
    if (!focusMemberId || trees.length === 0) return;
    const findNode = (nodes: TreeNode[]): TreeNode | null => {
      for (const n of nodes) {
        if (n.id === focusMemberId) return n;
        for (const s of n.spouses) {
          if (s.member.id === focusMemberId) return n; // focus on the node pair
        }
        const found = findNode(n.children);
        if (found) return found;
      }
      return null;
    };
    const node = findNode(trees);
    if (node) {
      setTimeout(() => focusOnNode(node.x, node.y, node.width), 500);
    }
  }, [focusMemberId, trees, focusOnNode]);

  const handleNodeClick = useCallback((member: FamilyMember, nx: number, ny: number, nw: number) => {
    setSelectedMember(member);
    focusOnNode(nx, ny, nw);
  }, [focusOnNode]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => {
      const newScale = Math.max(0.1, Math.min(3, prev.scale * delta));
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { ...prev, scale: newScale };
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      return {
        scale: newScale,
        x: mx - (mx - prev.x) * (newScale / prev.scale),
        y: my - (my - prev.y) * (newScale / prev.scale),
      };
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setAnimating(false);
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Touch support
  type TouchState =
    | { mode: 'pan'; offsetX: number; offsetY: number }
    | { mode: 'pinch'; lastDist: number };

  const touchRef = useRef<TouchState | null>(null);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setAnimating(false);
    if (e.touches.length === 1) {
      touchRef.current = {
        mode: 'pan',
        offsetX: e.touches[0].clientX - transform.x,
        offsetY: e.touches[0].clientY - transform.y,
      };
    } else if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      touchRef.current = { mode: 'pinch', lastDist: dist || 1 };
    }
  }, [transform]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touchState = touchRef.current;
    if (!touchState) return;

    if (e.touches.length === 1 && touchState.mode === 'pan') {
      const touch = e.touches[0];
      setTransform(prev => ({ ...prev, x: touch.clientX - touchState.offsetX, y: touch.clientY - touchState.offsetY }));
      return;
    }

    if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      const prevDist = touchState.mode === 'pinch' ? touchState.lastDist : 0;
      if (!Number.isFinite(dist) || dist <= 0 || prevDist <= 0) {
        touchRef.current = { mode: 'pinch', lastDist: dist || 1 };
        return;
      }
      const scaleFactor = dist / prevDist;
      if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) {
        touchRef.current = { mode: 'pinch', lastDist: dist };
        return;
      }
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) { touchRef.current = { mode: 'pinch', lastDist: dist }; return; }
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      setTransform(prev => {
        const newScale = Math.max(0.1, Math.min(3, prev.scale * scaleFactor));
        return {
          scale: newScale,
          x: centerX - (centerX - prev.x) * (newScale / prev.scale),
          y: centerY - (centerY - prev.y) * (newScale / prev.scale),
        };
      });
      touchRef.current = { mode: 'pinch', lastDist: dist };
    }
  }, []);

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
          className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-accent transition-colors text-lg font-bold">+</button>
        <button onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.1, prev.scale / 1.2) }))}
          className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-accent transition-colors text-lg font-bold">−</button>
        <button onClick={() => {
          if (!containerRef.current) return;
          const bounds = getTreeBounds(trees);
          const cw = containerRef.current.clientWidth;
          const ch = containerRef.current.clientHeight;
          const tw = bounds.maxX - bounds.minX + 100;
          const th = bounds.maxY - bounds.minY + 100;
          const scale = Math.min(cw / tw, ch / th, 1);
          setTransform({ x: (cw - tw * scale) / 2 - bounds.minX * scale + 50 * scale, y: 40, scale });
        }} className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-accent transition-colors text-xs">⊡</button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-muted-foreground bg-card/80 px-2 py-1 rounded border border-border">
        {Math.round(transform.scale * 100)}%
      </div>

      <svg
        ref={svgRef}
        className="w-full h-full select-none"
        style={{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          if (e.touches.length === 1) {
            touchRef.current = {
              mode: 'pan',
              offsetX: e.touches[0].clientX - transform.x,
              offsetY: e.touches[0].clientY - transform.y,
            };
            return;
          }
          touchRef.current = null;
        }}
      >
        <g
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
          style={animating ? { transition: 'transform 0.4s ease-out' } : undefined}
        >
          {trees.map(tree => (
            <TreeConnections key={`conn-${tree.id}`} node={tree} />
          ))}
          {trees.map(tree => (
            <TreeNodeCard key={`node-${tree.id}`} node={tree} onNodeClick={handleNodeClick} />
          ))}
        </g>
      </svg>

      {/* Member detail popup */}
      {selectedMember && (
        <div className="absolute bottom-4 right-4 z-20 w-72 bg-card border border-border rounded-xl shadow-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {selectedMember.photo_url ? (
                  <img src={selectedMember.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-display font-semibold text-foreground text-sm">{selectedMember.full_name}</p>
                <p className="text-xs text-muted-foreground">{selectedMember.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</p>
              </div>
            </div>
            <button onClick={() => setSelectedMember(null)} className="text-muted-foreground hover:text-foreground text-lg">×</button>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {selectedMember.birth_place && <p>📍 {selectedMember.birth_place}</p>}
            {selectedMember.birth_date && <p>🎂 {new Date(selectedMember.birth_date).toLocaleDateString('id-ID')}</p>}
            {selectedMember.death_date && <p>✝️ {new Date(selectedMember.death_date).toLocaleDateString('id-ID')}</p>}
            {selectedMember.phone && <p>📞 {selectedMember.phone}</p>}
            {selectedMember.bio && <p className="mt-2 text-foreground/70">{selectedMember.bio}</p>}
          </div>
          <button
            onClick={() => navigate(`/member/${selectedMember.id}`)}
            className="mt-3 w-full text-center text-xs text-primary hover:underline font-medium"
          >
            Lihat Profil Lengkap →
          </button>
        </div>
      )}
    </div>
  );
}
