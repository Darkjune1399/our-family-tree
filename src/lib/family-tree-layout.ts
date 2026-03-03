import { Tables } from '@/integrations/supabase/types';

type FamilyMember = Tables<'family_members'>;
type Marriage = Tables<'marriages'>;

export type TreeNode = {
  id: string;
  member: FamilyMember;
  spouses: { member: FamilyMember; marriageId: string }[];
  children: TreeNode[];
  x: number;
  y: number;
  width: number;
};

const NODE_WIDTH = 160;
const NODE_HEIGHT = 80;
const H_GAP = 40;
const V_GAP = 100;
const SPOUSE_GAP = 20;

export function buildFamilyTree(members: FamilyMember[], marriages: Marriage[]): TreeNode[] {
  // Find root members (no father_id and no mother_id)
  const roots = members.filter(m => !m.father_id && !m.mother_id);
  
  // Remove roots who are only spouses of another root (avoid duplicates)
  const rootIds = new Set(roots.map(r => r.id));
  const spouseOfRoot = new Set<string>();
  marriages.forEach(mar => {
    if (rootIds.has(mar.spouse1_id) && rootIds.has(mar.spouse2_id)) {
      // Keep the male or first one as primary
      const m1 = members.find(m => m.id === mar.spouse1_id);
      const m2 = members.find(m => m.id === mar.spouse2_id);
      if (m1 && m2) {
        // Keep male as root, mark female as spouse
        if (m1.gender === 'male') spouseOfRoot.add(m2.id);
        else spouseOfRoot.add(m1.id);
      }
    }
  });

  const primaryRoots = roots.filter(r => !spouseOfRoot.has(r.id));
  
  // If no roots found, use all members without parents
  const finalRoots = primaryRoots.length > 0 ? primaryRoots : (roots.length > 0 ? roots : members.slice(0, 1));

  const visited = new Set<string>();

  function buildNode(member: FamilyMember): TreeNode {
    visited.add(member.id);

    // Find spouses via marriages
    const memberMarriages = marriages.filter(
      m => m.spouse1_id === member.id || m.spouse2_id === member.id
    );
    const spouses = memberMarriages
      .map(m => {
        const spouseId = m.spouse1_id === member.id ? m.spouse2_id : m.spouse1_id;
        const spouse = members.find(x => x.id === spouseId);
        return spouse ? { member: spouse, marriageId: m.id } : null;
      })
      .filter(Boolean) as { member: FamilyMember; marriageId: string }[];

    // Mark spouses as visited
    spouses.forEach(s => visited.add(s.member.id));

    // Find children (where this member or any spouse is father/mother)
    const parentIds = [member.id, ...spouses.map(s => s.member.id)];
    const children = members
      .filter(m => 
        !visited.has(m.id) &&
        ((m.father_id && parentIds.includes(m.father_id)) || 
         (m.mother_id && parentIds.includes(m.mother_id)))
      )
      .map(child => buildNode(child));

    return {
      id: member.id,
      member,
      spouses,
      children,
      x: 0,
      y: 0,
      width: NODE_WIDTH + spouses.length * (NODE_WIDTH + SPOUSE_GAP),
    };
  }

  const trees = finalRoots.map(r => {
    if (!visited.has(r.id)) return buildNode(r);
    return null;
  }).filter(Boolean) as TreeNode[];

  // Also add orphan members not in any tree
  members.forEach(m => {
    if (!visited.has(m.id)) {
      trees.push(buildNode(m));
    }
  });

  // Layout
  let globalX = 0;
  trees.forEach(tree => {
    layoutTree(tree, 0, globalX);
    globalX = getTreeRight(tree) + H_GAP * 2;
  });

  return trees;
}

function layoutTree(node: TreeNode, depth: number, startX: number): void {
  node.y = depth * (NODE_HEIGHT + V_GAP);

  if (node.children.length === 0) {
    node.x = startX;
    return;
  }

  // Layout children first
  let childX = startX;
  node.children.forEach((child, i) => {
    layoutTree(child, depth + 1, childX);
    childX = getTreeRight(child) + H_GAP;
  });

  // Center parent over children
  const firstChild = node.children[0];
  const lastChild = node.children[node.children.length - 1];
  const childrenCenter = (firstChild.x + lastChild.x + lastChild.width) / 2;
  node.x = childrenCenter - node.width / 2;

  // If node is pushed left of startX, shift children right
  if (node.x < startX) {
    const shift = startX - node.x;
    node.x = startX;
    shiftTree(node.children, shift);
  }
}

function shiftTree(nodes: TreeNode[], shift: number): void {
  nodes.forEach(n => {
    n.x += shift;
    shiftTree(n.children, shift);
  });
}

function getTreeRight(node: TreeNode): number {
  let right = node.x + node.width;
  node.children.forEach(child => {
    right = Math.max(right, getTreeRight(child));
  });
  return right;
}

export function getTreeBounds(trees: TreeNode[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  function visit(node: TreeNode) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + NODE_HEIGHT);
    node.children.forEach(visit);
  }

  trees.forEach(visit);
  return { minX, minY, maxX, maxY };
}

export { NODE_WIDTH, NODE_HEIGHT, SPOUSE_GAP, V_GAP };
