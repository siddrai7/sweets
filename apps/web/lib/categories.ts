import type { Category } from '@sweets/types';

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

/** Turn the flat category list from the API into a sorted tree. */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>(
    categories.map((c) => [c.id, { ...c, children: [] }]),
  );
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sort = (list: CategoryNode[]) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

/** Path from the root down to the given category, e.g. [Desi Sweets, Ladoo]. */
export function categoryTrail(categories: Category[], id: string | undefined): Category[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const trail: Category[] = [];
  let current = id ? byId.get(id) : undefined;
  while (current) {
    trail.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return trail;
}
