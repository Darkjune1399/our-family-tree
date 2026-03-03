import { useRef, useState, useCallback, useEffect } from 'react';
import { Tables } from '@/integrations/supabase/types';
import { TreeNode, NODE_WIDTH, NODE_HEIGHT, SPOUSE_GAP, V_GAP, getTreeBounds } from '@/lib/family-tree-layout';
import { User, Heart } from 'lucide-react';

type FamilyMember = Tables<'family_members'>;

type Props = {
  trees: TreeNode[];
};

export function FamilyTreeCanvas({ trees }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

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
      const nextX = touch.clientX - touchState.offsetX;
      const nextY = touch.clientY - touchState.offsetY;
      setTransform(prev => ({ ...prev, x: nextX, y: nextY }));
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
      if (!rect) {
        touchRef.current = { mode: 'pinch', lastDist: dist };
        return;
      }

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

  const renderConnections = (node: TreeNode): JSX.Element[] => {
    const lines: JSX.Element[] = [];
    const parentCenterX = node.x + node.width / 2;
    const parentBottomY = node.y + NODE_HEIGHT;

    if (node.children.length > 0) {
      const midY = parentBottomY + V_GAP / 2;

      // Vertical line from parent down
      lines.push(
        <line key={`v-${node.id}`} x1={parentCenterX} y1={parentBottomY} x2={parentCenterX} y2={midY}
          className="stroke-border" strokeWidth={2} />
      );

      // Horizontal line spanning children
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      const leftX = firstChild.x + firstChild.width / 2;
      const rightX = lastChild.x + lastChild.width / 2;

      if (node.children.length > 1) {
        lines.push(
          <line key={`h-${node.id}`} x1={leftX} y1={midY} x2={rightX} y2={midY}
            className="stroke-border" strokeWidth={2} />
        );
      }

      // Vertical lines to each child
      node.children.forEach(child => {
        const childCenterX = child.x + child.width / 2;
        lines.push(
          <line key={`vc-${child.id}`} x1={childCenterX} y1={midY} x2={childCenterX} y2={child.y}
            className="stroke-border" strokeWidth={2} />
        );
        lines.push(...renderConnections(child));
      });
    }

    return lines;
  };

  const renderNode = (node: TreeNode): JSX.Element[] => {
    const elements: JSX.Element[] = [];

    // Main member card
    elements.push(
      <g key={`node-${node.id}`} onClick={(e) => { e.stopPropagation(); setSelectedMember(node.member); }} className="cursor-pointer">
        <rect x={node.x} y={node.y} width={NODE_WIDTH} height={NODE_HEIGHT} rx={12}
          className="fill-card stroke-border hover:stroke-primary transition-colors" strokeWidth={1.5} />
        {node.member.photo_url ? (
          <clipPath id={`clip-${node.id}`}>
            <circle cx={node.x + 28} cy={node.y + NODE_HEIGHT / 2} r={14} />
          </clipPath>
        ) : null}
        {node.member.photo_url ? (
          <>
            <clipPath id={`clip-${node.id}`}><circle cx={node.x + 28} cy={node.y + NODE_HEIGHT / 2} r={14} /></clipPath>
            <image href={node.member.photo_url} x={node.x + 14} y={node.y + NODE_HEIGHT / 2 - 14} width={28} height={28}
              clipPath={`url(#clip-${node.id})`} preserveAspectRatio="xMidYMid slice" />
          </>
        ) : (
          <circle cx={node.x + 28} cy={node.y + NODE_HEIGHT / 2} r={14}
            className={node.member.gender === 'male' ? 'fill-primary/10' : 'fill-destructive/10'} />
        )}
        <text x={node.x + 50} y={node.y + NODE_HEIGHT / 2 - 6} className="fill-foreground text-[11px] font-medium" dominantBaseline="middle">
          {node.member.full_name.length > 14 ? node.member.full_name.slice(0, 14) + '…' : node.member.full_name}
        </text>
        <text x={node.x + 50} y={node.y + NODE_HEIGHT / 2 + 10} className="fill-muted-foreground text-[9px]" dominantBaseline="middle">
          {node.member.gender === 'male' ? '♂' : '♀'} {node.member.birth_date ? new Date(node.member.birth_date).getFullYear() : ''}
          {node.member.death_date ? ` — ${new Date(node.member.death_date).getFullYear()}` : ''}
        </text>
      </g>
    );

    // Spouse cards
    node.spouses.forEach((spouse, i) => {
      const sx = node.x + NODE_WIDTH + SPOUSE_GAP + i * (NODE_WIDTH + SPOUSE_GAP);
      const sy = node.y;

      // Marriage line
      elements.push(
        <line key={`mar-${spouse.marriageId}`}
          x1={node.x + NODE_WIDTH} y1={node.y + NODE_HEIGHT / 2}
          x2={sx} y2={sy + NODE_HEIGHT / 2}
          className="stroke-primary" strokeWidth={2} strokeDasharray="6 3" />
      );
      elements.push(
        <circle key={`mheart-${spouse.marriageId}`}
          cx={(node.x + NODE_WIDTH + sx) / 2} cy={sy + NODE_HEIGHT / 2} r={8}
          className="fill-primary/10 stroke-primary" strokeWidth={1} />
      );
      elements.push(
        <text key={`mh-text-${spouse.marriageId}`}
          x={(node.x + NODE_WIDTH + sx) / 2} y={sy + NODE_HEIGHT / 2 + 1}
          textAnchor="middle" dominantBaseline="middle" className="fill-primary text-[8px]">♥</text>
      );

      // Spouse card
      elements.push(
        <g key={`spouse-${spouse.member.id}`} onClick={(e) => { e.stopPropagation(); setSelectedMember(spouse.member); }} className="cursor-pointer">
          <rect x={sx} y={sy} width={NODE_WIDTH} height={NODE_HEIGHT} rx={12}
            className="fill-card stroke-border hover:stroke-primary transition-colors" strokeWidth={1.5} />
          {spouse.member.photo_url ? (
            <>
              <clipPath id={`clip-s-${spouse.member.id}`}><circle cx={sx + 28} cy={sy + NODE_HEIGHT / 2} r={14} /></clipPath>
              <image href={spouse.member.photo_url} x={sx + 14} y={sy + NODE_HEIGHT / 2 - 14} width={28} height={28}
                clipPath={`url(#clip-s-${spouse.member.id})`} preserveAspectRatio="xMidYMid slice" />
            </>
          ) : (
            <circle cx={sx + 28} cy={sy + NODE_HEIGHT / 2} r={14}
              className={spouse.member.gender === 'male' ? 'fill-primary/10' : 'fill-destructive/10'} />
          )}
          <text x={sx + 50} y={sy + NODE_HEIGHT / 2 - 6} className="fill-foreground text-[11px] font-medium" dominantBaseline="middle">
            {spouse.member.full_name.length > 14 ? spouse.member.full_name.slice(0, 14) + '…' : spouse.member.full_name}
          </text>
          <text x={sx + 50} y={sy + NODE_HEIGHT / 2 + 10} className="fill-muted-foreground text-[9px]" dominantBaseline="middle">
            {spouse.member.gender === 'male' ? '♂' : '♀'} {spouse.member.birth_date ? new Date(spouse.member.birth_date).getFullYear() : ''}
            {spouse.member.death_date ? ` — ${new Date(spouse.member.death_date).getFullYear()}` : ''}
          </text>
        </g>
      );
    });

    // Render children nodes
    node.children.forEach(child => {
      elements.push(...renderNode(child));
    });

    return elements;
  };

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
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Connections first (behind nodes) */}
          {trees.map(tree => renderConnections(tree))}
          {/* Nodes on top */}
          {trees.map(tree => renderNode(tree))}
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
        </div>
      )}
    </div>
  );
}
