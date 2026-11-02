import type { Category } from '@sweets/types';

/** Storefront base URL, for "View on shop" links. */
export const STOREFRONT_URL = (
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

/** "Kesar Pista Barfi!" → "kesar-pista-barfi" (matches the API's slug rule). */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/** Categories in menu order: each top-level category followed by its sub-categories. */
export function categoryOptions(categories: Category[]) {
  const sort = (a: Category, b: Category) =>
    a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  const roots = categories.filter((c) => !c.parentId).sort(sort);
  return roots.flatMap((root) => [
    { category: root, depth: 0 },
    ...categories
      .filter((c) => c.parentId === root.id)
      .sort(sort)
      .map((category) => ({ category, depth: 1 })),
  ]);
}

/** Curated collections that drive the storefront homepage rows. */
export const COLLECTIONS = [
  {
    tag: 'bestseller',
    label: 'Bestseller',
    hint: 'Homepage “Bestsellers” row and a badge on the card',
  },
  { tag: 'favourite', label: 'All-time favourite', hint: 'Homepage “All-time favourites” row' },
  { tag: 'classic', label: 'Classic', hint: 'Homepage “The classics” row' },
] as const;
