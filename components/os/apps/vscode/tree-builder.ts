import type { GitHubTreeEntry } from "@/lib/github/api";

export type TreeNode = {
  name: string;
  path: string;
  kind: "file" | "dir";
  children?: TreeNode[];
};

/**
 * Convert GitHub's flat tree (`{ path, type }[]`) into a nested directory
 * structure suitable for rendering. Folders are sorted first, then files,
 * each alphabetically. Folder-only paths (those that have children) are
 * preserved even if not present as explicit "tree" entries.
 */
export function buildTree(entries: GitHubTreeEntry[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", kind: "dir", children: [] };

  for (const entry of entries) {
    const parts = entry.path.split("/");
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      const partPath = parts.slice(0, i + 1).join("/");
      cur.children ??= [];
      let next = cur.children.find((c) => c.name === part);
      if (!next) {
        next = {
          name: part,
          path: partPath,
          kind:
            isLeaf && entry.type === "blob" ? "file" : "dir",
          children:
            isLeaf && entry.type === "blob" ? undefined : [],
        };
        cur.children.push(next);
      }
      cur = next;
    }
  }

  sortNode(root);
  return root.children ?? [];
}

function sortNode(node: TreeNode) {
  if (!node.children) return;
  node.children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const c of node.children) sortNode(c);
}
