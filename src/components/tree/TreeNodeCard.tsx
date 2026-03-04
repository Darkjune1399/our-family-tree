import { Tables } from '@/integrations/supabase/types';
import { TreeNode, NODE_WIDTH, NODE_HEIGHT, SPOUSE_GAP } from '@/lib/family-tree-layout';

type FamilyMember = Tables<'family_members'>;

type Props = {
  node: TreeNode;
  onNodeClick: (member: FamilyMember, x: number, y: number, width: number) => void;
};

function MemberRect({ member, x, y, onClick }: { member: FamilyMember; x: number; y: number; onClick: () => void }) {
  const clipId = `clip-${member.id}-${x}`;
  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(); }} className="cursor-pointer">
      <rect x={x} y={y} width={NODE_WIDTH} height={NODE_HEIGHT} rx={12}
        className="fill-card stroke-border hover:stroke-primary transition-colors" strokeWidth={1.5} />
      {member.photo_url ? (
        <>
          <clipPath id={clipId}><circle cx={x + 28} cy={y + NODE_HEIGHT / 2} r={14} /></clipPath>
          <image href={member.photo_url} x={x + 14} y={y + NODE_HEIGHT / 2 - 14} width={28} height={28}
            clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" />
        </>
      ) : (
        <circle cx={x + 28} cy={y + NODE_HEIGHT / 2} r={14}
          className={member.gender === 'male' ? 'fill-primary/10' : 'fill-destructive/10'} />
      )}
      <text x={x + 50} y={y + NODE_HEIGHT / 2 - 6} className="fill-foreground text-[11px] font-medium" dominantBaseline="middle">
        {member.full_name.length > 14 ? member.full_name.slice(0, 14) + '…' : member.full_name}
      </text>
      <text x={x + 50} y={y + NODE_HEIGHT / 2 + 10} className="fill-muted-foreground text-[9px]" dominantBaseline="middle">
        {member.gender === 'male' ? '♂' : '♀'} {member.birth_date ? new Date(member.birth_date).getFullYear() : ''}
        {member.death_date ? ` — ${new Date(member.death_date).getFullYear()}` : ''}
      </text>
    </g>
  );
}

export function TreeNodeCard({ node, onNodeClick }: Props) {
  const elements: JSX.Element[] = [];

  elements.push(
    <MemberRect key={`m-${node.id}`} member={node.member} x={node.x} y={node.y}
      onClick={() => onNodeClick(node.member, node.x, node.y, node.width)} />
  );

  node.spouses.forEach((spouse, i) => {
    const sx = node.x + NODE_WIDTH + SPOUSE_GAP + i * (NODE_WIDTH + SPOUSE_GAP);
    const sy = node.y;

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
    elements.push(
      <MemberRect key={`s-${spouse.member.id}`} member={spouse.member} x={sx} y={sy}
        onClick={() => onNodeClick(spouse.member, sx, sy, NODE_WIDTH)} />
    );
  });

  node.children.forEach(child => {
    elements.push(<TreeNodeCard key={`child-${child.id}`} node={child} onNodeClick={onNodeClick} />);
  });

  return <>{elements}</>;
}
