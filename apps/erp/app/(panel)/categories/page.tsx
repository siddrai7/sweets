'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Category } from '@sweets/types';
import {
  Badge,
  Button,
  Empty,
  Field,
  Modal,
  PageHeader,
  Table,
  Td,
  inputCls,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { STOREFRONT_URL, categoryOptions, slugify } from '@/lib/catalog';

export default function CategoriesPage() {
  const { api } = useAuth();
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.catalog.categories(),
  });
  const rows = useMemo(() => categoryOptions(categories.data ?? []), [categories.data]);
  const [editing, setEditing] = useState<Category | 'new' | null>(null);

  return (
    <>
      <PageHeader
        title="Categories"
        actions={<Button onClick={() => setEditing('new')}>+ New category</Button>}
      />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        How the shop is organised: top-level categories appear in the menu, with sub-categories
        under them. Lower sort numbers come first.
      </p>

      {!rows.length ? (
        <Empty>{categories.isLoading ? 'Loading…' : 'No categories yet.'}</Empty>
      ) : (
        <Table head={['Category', 'Web address', 'Products', 'Sort', 'Status', '']}>
          {rows.map(({ category: c, depth }) => {
            const children = rows.filter((r) => r.category.parentId === c.id);
            const total =
              (c.productCount ?? 0) +
              children.reduce((n, r) => n + (r.category.productCount ?? 0), 0);
            return (
              <tr key={c.id} className={c.isActive ? '' : 'text-slate-400'}>
                <Td>
                  <span className={depth ? 'pl-6 text-slate-400' : ''}>{depth ? '└ ' : ''}</span>
                  <span className={depth ? '' : 'font-semibold'}>{c.name}</span>
                </Td>
                <Td className="text-xs">
                  {c.isActive ? (
                    <a
                      href={`${STOREFRONT_URL}/shop/${c.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 hover:text-brand-700"
                    >
                      /shop/{c.slug} ↗
                    </a>
                  ) : (
                    <span>/shop/{c.slug}</span>
                  )}
                </Td>
                <Td>
                  <Link
                    href={`/products?category=${c.slug}`}
                    className="hover:text-brand-700"
                    title={children.length ? 'Including sub-categories' : undefined}
                  >
                    {total}
                  </Link>
                </Td>
                <Td className="text-slate-500">{c.sortOrder}</Td>
                <Td>
                  <Badge tone={c.isActive ? 'green' : 'slate'}>
                    {c.isActive ? 'Visible' : 'Hidden'}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <Button variant="secondary" onClick={() => setEditing(c)}>
                    Edit
                  </Button>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}

      {editing && (
        <CategoryDialog
          category={editing === 'new' ? undefined : editing}
          all={categories.data ?? []}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function CategoryDialog({
  category,
  all,
  onClose,
}: {
  category?: Category;
  all: Category[];
  onClose: () => void;
}) {
  const { api } = useAuth();
  const qc = useQueryClient();
  const hasChildren = !!category && all.some((c) => c.parentId === category.id);
  const parents = all.filter((c) => !c.parentId && c.id !== category?.id);
  const [form, setForm] = useState({
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    slugTouched: !!category,
    parentId: category?.parentId ?? '',
    description: category?.description ?? '',
    imageUrl: category?.imageUrl ?? '',
    sortOrder: String(category?.sortOrder ?? 0),
    isActive: category?.isActive ?? true,
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        slug: form.slug,
        parentId: form.parentId || null,
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      return category
        ? api.catalog.updateCategory(category.id, payload)
        : api.catalog.createCategory(payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      title={category ? `Edit ${category.name}` : 'New category'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="category-form" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : category ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <form
        id="category-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Field label="Name">
          <input
            required
            autoFocus
            maxLength={100}
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                name: e.target.value,
                slug: f.slugTouched ? f.slug : slugify(e.target.value),
              }))
            }
            className={inputCls}
          />
        </Field>
        <Field
          label="Web address"
          hint={
            category && form.slug !== category.slug
              ? 'Changing this breaks existing links to the category.'
              : undefined
          }
        >
          <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 focus-within:border-brand-600">
            <span className="pl-3 text-sm text-slate-500">/shop/</span>
            <input
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: slugify(e.target.value), slugTouched: true }))
              }
              className="w-full rounded-r-lg bg-white px-2 py-2 text-sm focus:outline-none"
            />
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Field
            label="Sits under"
            hint={hasChildren ? 'It has sub-categories, so it stays top-level.' : undefined}
          >
            <select
              value={form.parentId}
              disabled={hasChildren}
              onChange={(e) => set('parentId', e.target.value)}
              className={inputCls}
            >
              <option value="">Nothing (top-level, shown in the menu)</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sort order">
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Description" hint="Shown at the top of the category page.">
          <textarea
            rows={2}
            maxLength={2000}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field
          label="Image link"
          hint="Optional. Used on category tiles; an illustration is shown otherwise."
        >
          <input
            type="url"
            placeholder="https://…"
            value={form.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
            className={inputCls}
          />
        </Field>
        <label className="flex cursor-pointer gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-600"
          />
          <span>
            Visible on the shop
            <span className="block text-xs text-slate-500">
              Hiding removes it from menus and its page. Its products stay on sale and in search.
            </span>
          </span>
        </label>
        {save.error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {save.error.message}
          </p>
        )}
      </form>
    </Modal>
  );
}
