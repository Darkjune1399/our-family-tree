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
  const memberMap = new Map<string, FamilyMember>();
  members.forEach(m => memberMap.set(m.id, m));

  // Build parent→children index
  const childrenOf = new Map<string, Set<string>>();
  members.forEach(m => {
    if (m.father_id) {
      if (!childrenOf.has(m.father_id)) childrenOf.set(m.father_id, new Set());
      childrenOf.get(m.father_id)!.add(m.id);
    }
    if (m.mother_id) {
      if (!childrenOf.has(m.mother_id)) childrenOf.set(m.mother_id, new Set());
      childrenOf.get(m.mother_id)!.add(m.id);
    }
  });

  // Find true ancestors: walk up parent chain to find topmost ancestors
  function getAncestors(id: string, seen: Set<string> = new Set()): string[] {
    if (seen.has(id)) return [id];
    seen.add(id);
    const m = memberMap.get(id);
    if (!m) return [id];

    const parents: string[] = [];
    if (m.father_id && memberMap.has(m.father_id)) parents.push(...getAncestors(m.father_id, seen));
    if (m.mother_id && memberMap.has(m.mother_id)) parents.push(...getAncestors(m.mother_id, seen));

    // If no parents found in our data, this person is a root
    if (parents.length === 0) return [id];
    return parents;
  }

  // Find all root ancestors
  const rootSet = new Set<string>();
  members.forEach(m => {
    const ancestors = getAncestors(m.id);
    ancestors.forEach(a => rootSet.add(a));
  });

  // Deduplicate: if two roots are married, keep one as primary
  const spouseOfRoot = new Set<string>();
  marriages.forEach(mar => {
    if (rootSet.has(mar.spouse1_id) && rootSet.has(mar.spouse2_id)) {
      const m1 = memberMap.get(mar.spouse1_id);
      const m2 = memberMap.get(mar.spouse2_id);
      if (m1 && m2) {
        if (m1.gender === 'male') spouseOfRoot.add(m2.id);
        else spouseOfRoot.add(m1.id);
      }
    }
  });

  // Also deduplicate roots that are parents: if root A has father_id/mother_id pointing to root B, 
  // B is the true root, not A. But we already handled this via getAncestors.
  // Additional: if a root is listed as someone's mother/father but that someone's other parent is also a root,
  // mark the mother as spouse if they share children
  const rootArray = [...rootSet].filter(id => !spouseOfRoot.has(id));

  const visited = new Set<string>();

  function buildNode(member: FamilyMember): TreeNode {
    visited.add(member.id);

    // Find spouses via marriages table
    const memberMarriages = marriages.filter(
      m => m.spouse1_id === member.id || m.spouse2_id === member.id
    );
    const spouses: { member: FamilyMember; marriageId: string }[] = [];
    memberMarriages.forEach(m => {
      const spouseId = m.spouse1_id === member.id ? m.spouse2_id : m.spouse1_id;
      const spouse = memberMap.get(spouseId);
      if (spouse && !visited.has(spouse.id)) {
        spouses.push({ member: spouse, marriageId: m.id });
        visited.add(spouse.id);
      }
    });

    // Also find implicit spouses: people who share children with this member but have no marriage record
    const myChildIds = childrenOf.get(member.id) || new Set();
    myChildIds.forEach(childId => {
      const child = memberMap.get(childId);
      if (!child) return;
      // The other parent
      const otherParentId = child.father_id === member.id ? child.mother_id : child.father_id;
      if (otherParentId && !visited.has(otherParentId)) {
        const otherParent = memberMap.get(otherParentId);
        if (otherParent) {
          // Check not already in spouses
          if (!spouses.find(s => s.member.id === otherParentId)) {
            spouses.push({ member: otherParent, marriageId: `implicit-${member.id}-${otherParentId}` });
            visited.add(otherParentId);
          }
        }
      }
    });

    // Collect all children of this member + all spouses
    const allParentIds = new Set([member.id, ...spouses.map(s => s.member.id)]);
    const childIdSet = new Set<string>();
    allParentIds.forEach(pid => {
      const kids = childrenOf.get(pid);
      if (kids) kids.forEach(k => childIdSet.add(k));
    });

    const children: TreeNode[] = [];
    childIdSet.forEach(childId => {
      if (!visited.has(childId)) {
        const child = memberMap.get(childId);
        if (child) children.push(buildNode(child));
      }
    });

    // Sort children by birth_date
    children.sort((a, b) => {
      const da = a.member.birth_date || '';
      const db = b.member.birth_date || '';
      return da.localeCompare(db);
    });

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

  // Build trees from roots
  const trees: TreeNode[] = [];
  rootArray.forEach(rootId => {
    if (!visited.has(rootId)) {
      const m = memberMap.get(rootId);
      if (m) trees.push(buildNode(m));
    }
  });

  // Add any orphan members not yet visited
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

  let childX = startX;
  node.children.forEach(child => {
    layoutTree(child, depth + 1, childX);
    childX = getTreeRight(child) + H_GAP;
  });

  const firstChild = node.children[0];
  const lastChild = node.children[node.children.length - 1];
  const childrenCenter = (firstChild.x + lastChild.x + lastChild.width) / 2;
  node.x = childrenCenter - node.width / 2;

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
