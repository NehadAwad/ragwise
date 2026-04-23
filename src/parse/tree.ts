import type { Section } from "../types.js";
import type { TreeNode } from "../types.js";

export function buildTree(sections: Section[]): TreeNode[] {
  const root: TreeNode[] = [];
  const stack: TreeNode[] = [];

  for (const sec of sections) {
    const node: TreeNode = {
      id: sec.id,
      title: sec.title,
      level: sec.level,
      startLine: sec.startLine,
      endLine: sec.endLine,
      chunkIds: [],
      children: [],
    };

    while (stack.length > 0) {
      const parent = stack[stack.length - 1]!;
      if (parent.level < sec.level) {
        break;
      }
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1]!.children.push(node);
    }
    stack.push(node);
  }

  return root;
}
