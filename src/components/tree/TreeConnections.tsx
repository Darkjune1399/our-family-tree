import { TreeNode, NODE_HEIGHT, V_GAP } from '@/lib/family-tree-layout';

type Props = { node: TreeNode };

export function TreeConnections({ node }: Props) {
  const lines: JSX.Element[] = [];
  const parentCenterX = node.x + node.width / 2;
  const parentBottomY = node.y + NODE_HEIGHT;

  if (node.children.length > 0) {
    const midY = parentBottomY + V_GAP / 2;

    lines.push(
      <line key={`v-${node.id}`} x1={parentCenterX} y1={parentBottomY} x2={parentCenterX} y2={midY}
        className="stroke-border" strokeWidth={2} />
    );

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

    node.children.forEach(child => {
      const childCenterX = child.x + child.width / 2;
      lines.push(
        <line key={`vc-${child.id}`} x1={childCenterX} y1={midY} x2={childCenterX} y2={child.y}
          className="stroke-border" strokeWidth={2} />
      );
      lines.push(<TreeConnections key={`conn-${child.id}`} node={child} />);
    });
  }

  return <>{lines}</>;
}
