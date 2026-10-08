export type CategoryTreeInput = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  parentId?: string | null;
  isActive?: boolean;
};

export type CategoryTreeNode = CategoryTreeInput & {
  children: CategoryTreeNode[];
};

export function buildCategoryTree(categories: CategoryTreeInput[]) {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const category of categories) {
    map.set(category.id, {
      ...category,
      children: [],
    });
  }

  for (const category of [...categories].sort((a, b) => a.name.localeCompare(b.name, "ar"))) {
    const node = map.get(category.id);
    if (!node) {
      continue;
    }

    if (category.parentId) {
      const parent = map.get(category.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
      continue;
    }

    roots.push(node);
  }

  const dedupedRoots = roots.filter(
    (root, index, list) => list.findIndex((item) => item.id === root.id) === index,
  );

  for (const root of dedupedRoots) {
    root.children.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }

  return dedupedRoots;
}
