'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { formatMoney } from '@sweets/api-client';
import type { Product, ProductInput } from '@sweets/types';
import { Button, Card, Field, inputCls } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { COLLECTIONS, categoryOptions, slugify } from '@/lib/catalog';

interface VariantDraft {
  key: string;
  id?: string;
  label: string;
  weightGrams: string;
  sku: string;
  skuTouched: boolean;
  price: string;
  mrp: string;
  lowStockThreshold: string;
  isActive: boolean;
  /** Read-only: sellable stock right now. */
  available?: number;
}

interface Draft {
  name: string;
  slug: string;
  slugTouched: boolean;
  categoryId: string;
  description: string;
  images: string[];
  tags: string[];
  searchAliases: string[];
  isVeg: boolean;
  isFeatured: boolean;
  shelfLifeDays: string;
  ingredients: string;
  allergens: string;
  storageInstructions: string;
  taxRatePercent: string;
  hsnCode: string;
  metaTitle: string;
  metaDescription: string;
  variants: VariantDraft[];
}

const PRESETS = [
  { label: '250 g', grams: 250 },
  { label: '500 g', grams: 500 },
  { label: '1 kg', grams: 1000 },
];

let keySeq = 0;
const newKey = () => `v${++keySeq}`;

function emptyVariant(partial: Partial<VariantDraft> = {}): VariantDraft {
  return {
    key: newKey(),
    label: '',
    weightGrams: '',
    sku: '',
    skuTouched: false,
    price: '',
    mrp: '',
    lowStockThreshold: '5',
    isActive: true,
    ...partial,
  };
}

function fromProduct(p?: Product): Draft {
  return {
    name: p?.name ?? '',
    slug: p?.slug ?? '',
    slugTouched: !!p,
    categoryId: p?.categoryId ?? '',
    description: p?.description ?? '',
    images: p?.images ?? [],
    tags: p?.tags ?? [],
    searchAliases: p?.searchAliases ?? [],
    isVeg: p?.isVeg ?? true,
    isFeatured: p?.isFeatured ?? false,
    shelfLifeDays: p?.shelfLifeDays?.toString() ?? '',
    ingredients: p?.ingredients ?? '',
    allergens: p?.allergens ?? '',
    storageInstructions: p?.storageInstructions ?? '',
    taxRatePercent: p ? String(Number(p.taxRatePercent)) : '5',
    hsnCode: p?.hsnCode ?? '',
    metaTitle: p?.metaTitle ?? '',
    metaDescription: p?.metaDescription ?? '',
    variants: p
      ? p.variants.map((v) =>
          emptyVariant({
            id: v.id,
            label: v.label,
            weightGrams: v.weightGrams?.toString() ?? '',
            sku: v.sku,
            skuTouched: true,
            price: String(Number(v.price)),
            mrp: v.mrp ? String(Number(v.mrp)) : '',
            lowStockThreshold: String(v.lowStockThreshold ?? 5),
            isActive: v.isActive,
            available: v.available,
          }),
        )
      : [emptyVariant()],
  };
}

/** "Kesar Pista Barfi" + "500 g" → "KPB-500G" */
function suggestSku(name: string, label: string) {
  const prefix =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4) || 'SKU';
  const suffix = label.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return suffix ? `${prefix}-${suffix}` : prefix;
}

const orNull = (s: string) => (s.trim() ? s.trim() : null);
const intOrNull = (s: string) => (s.trim() ? Math.round(Number(s)) : null);

function toPayload(d: Draft): Omit<ProductInput, 'isActive'> {
  return {
    name: d.name.trim(),
    slug: d.slug,
    categoryId: d.categoryId,
    description: orNull(d.description),
    images: d.images,
    tags: d.tags,
    searchAliases: d.searchAliases,
    isVeg: d.isVeg,
    isFeatured: d.isFeatured,
    shelfLifeDays: intOrNull(d.shelfLifeDays),
    ingredients: orNull(d.ingredients),
    allergens: orNull(d.allergens),
    storageInstructions: orNull(d.storageInstructions),
    taxRatePercent: d.taxRatePercent || '0',
    hsnCode: orNull(d.hsnCode),
    metaTitle: orNull(d.metaTitle),
    metaDescription: orNull(d.metaDescription),
    variants: d.variants.map((v, i) => ({
      id: v.id,
      label: v.label.trim(),
      sku: v.sku.trim(),
      weightGrams: intOrNull(v.weightGrams),
      price: v.price,
      mrp: orNull(v.mrp),
      lowStockThreshold: v.lowStockThreshold.trim() ? Number(v.lowStockThreshold) : undefined,
      isActive: v.isActive,
      sortOrder: i,
    })),
  };
}

/** Strips read-only and UI-only fields so "unsaved changes" compares what would be saved. */
const snapshot = (d: Draft) => JSON.stringify(toPayload(d));

export function ProductForm({ product }: { product?: Product }) {
  const { api } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [draft, setDraft] = useState(() => fromProduct(product));
  const [saved, setSaved] = useState(() => snapshot(fromProduct(product)));
  const [justSaved, setJustSaved] = useState(false);
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.catalog.categories(),
  });
  const options = useMemo(() => categoryOptions(categories.data ?? []), [categories.data]);
  const dirty = snapshot(draft) !== saved;

  // Re-seed when the product is refetched after a save.
  useEffect(() => {
    if (!product) return;
    const next = fromProduct(product);
    setDraft(next);
    setSaved(snapshot(next));
  }, [product]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const save = useMutation({
    mutationFn: () => {
      const payload = toPayload(draft);
      return product
        ? api.catalog.updateProduct(product.id, payload)
        : api.catalog.createProduct({ ...payload, isActive: true });
    },
    onSuccess: (p) => {
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['categories'] });
      setSaved(snapshot(draft));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      if (!product) router.replace(`/products/${p.id}?created=1`);
    },
  });

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const setName = (name: string) =>
    setDraft((d) => ({
      ...d,
      name,
      slug: d.slugTouched ? d.slug : slugify(name),
      variants: d.variants.map((v) =>
        v.skuTouched ? v : { ...v, sku: suggestSku(name, v.label) },
      ),
    }));

  const setVariant = (key: string, patch: Partial<VariantDraft>) =>
    setDraft((d) => ({
      ...d,
      variants: d.variants.map((v) => {
        if (v.key !== key) return v;
        const next = { ...v, ...patch };
        // Keep the suggested SKU in step with the label until someone edits the SKU.
        if (!next.skuTouched && 'label' in patch) next.sku = suggestSku(d.name, next.label);
        return next;
      }),
    }));

  const addVariant = (preset?: { label: string; grams: number }) =>
    setDraft((d) => {
      // Price a new weight from the per-kg rate of an existing weighed size, if there is one.
      const ref = d.variants.find((v) => Number(v.weightGrams) > 0 && Number(v.price) > 0);
      const price =
        preset && ref
          ? String(Math.round((Number(ref.price) / Number(ref.weightGrams)) * preset.grams))
          : '';
      return {
        ...d,
        variants: [
          ...d.variants,
          emptyVariant({
            label: preset?.label ?? '',
            weightGrams: preset ? String(preset.grams) : '',
            sku: suggestSku(d.name, preset?.label ?? ''),
            price,
          }),
        ],
      };
    });

  const moveVariant = (key: string, dir: -1 | 1) =>
    setDraft((d) => {
      const i = d.variants.findIndex((v) => v.key === key);
      const j = i + dir;
      if (j < 0 || j >= d.variants.length) return d;
      const variants = [...d.variants];
      [variants[i], variants[j]] = [variants[j]!, variants[i]!];
      return { ...d, variants };
    });

  const toggleTag = (tag: string) =>
    set(
      'tags',
      draft.tags.includes(tag) ? draft.tags.filter((t) => t !== tag) : [...draft.tags, tag],
    );

  const customTags = draft.tags.filter((t) => !COLLECTIONS.some((c) => c.tag === t));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-6 pb-24"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Section title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name">
                <input
                  required
                  maxLength={150}
                  autoFocus={!product}
                  value={draft.name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kesar Pista Barfi"
                  className={inputCls}
                />
              </Field>
              <Field label="Category">
                <select
                  required
                  value={draft.categoryId}
                  onChange={(e) => set('categoryId', e.target.value)}
                  className={inputCls}
                >
                  <option value="">
                    {categories.isLoading ? 'Loading…' : 'Choose a category…'}
                  </option>
                  {options.map(({ category: c, depth }) => (
                    <option key={c.id} value={c.id}>
                      {depth ? '   — ' : ''}
                      {c.name}
                      {!c.isActive ? ' (hidden)' : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              label="Web address"
              hint={
                product && draft.slug !== product.slug
                  ? 'Changing this breaks old links to the product, including ones shared on WhatsApp.'
                  : 'Lowercase letters, numbers and hyphens. Filled in from the name.'
              }
            >
              <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
                <span className="pl-3 text-sm text-slate-500">/products/</span>
                <input
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={draft.slug}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, slug: slugify(e.target.value), slugTouched: true }))
                  }
                  className="w-full rounded-r-lg bg-white px-2 py-2 text-sm focus:outline-none"
                />
              </div>
            </Field>
            <Field label="Description" hint="Shown at the top of the product page.">
              <textarea
                rows={4}
                maxLength={5000}
                value={draft.description}
                onChange={(e) => set('description', e.target.value)}
                className={inputCls}
              />
            </Field>
          </Section>

          <Section
            title="Pack sizes & prices"
            description="Each size is sold separately with its own price and stock. Prices include GST."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="w-8" />
                    <th className="pb-2 pr-2 font-medium">Label shown to customers</th>
                    <th className="pb-2 pr-2 font-medium">Weight (g)</th>
                    <th className="pb-2 pr-2 font-medium">Price ₹</th>
                    <th className="pb-2 pr-2 font-medium">MRP ₹</th>
                    <th className="pb-2 pr-2 font-medium">SKU</th>
                    <th className="pb-2 pr-2 font-medium" title="Alert when stock falls to this">
                      Low at
                    </th>
                    <th className="pb-2 font-medium">On sale</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.variants.map((v, i) => {
                    const perKg =
                      Number(v.weightGrams) > 0 && Number(v.price) > 0
                        ? (Number(v.price) / Number(v.weightGrams)) * 1000
                        : null;
                    const off =
                      Number(v.mrp) > Number(v.price) && Number(v.price) > 0
                        ? Math.round((1 - Number(v.price) / Number(v.mrp)) * 100)
                        : 0;
                    return (
                      <tr key={v.key} className={`align-top ${v.isActive ? '' : 'opacity-50'}`}>
                        <td className="pr-1 pt-1.5">
                          <div className="flex flex-col text-slate-400">
                            <button
                              type="button"
                              aria-label="Move up"
                              disabled={i === 0}
                              onClick={() => moveVariant(v.key, -1)}
                              className="leading-none hover:text-slate-700 disabled:opacity-30"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              aria-label="Move down"
                              disabled={i === draft.variants.length - 1}
                              onClick={() => moveVariant(v.key, 1)}
                              className="leading-none hover:text-slate-700 disabled:opacity-30"
                            >
                              ▼
                            </button>
                          </div>
                        </td>
                        <td className="py-1 pr-2">
                          <input
                            required
                            maxLength={50}
                            placeholder="500 g"
                            value={v.label}
                            onChange={(e) => setVariant(v.key, { label: e.target.value })}
                            className={inputCls}
                          />
                          {v.available !== undefined && (
                            <span
                              className={`mt-1 block text-xs ${v.available > Number(v.lowStockThreshold || 0) ? 'text-slate-500' : 'text-red-700'}`}
                            >
                              {v.available} in stock
                            </span>
                          )}
                        </td>
                        <td className="w-24 py-1 pr-2">
                          <input
                            type="number"
                            min={1}
                            inputMode="numeric"
                            value={v.weightGrams}
                            onChange={(e) => setVariant(v.key, { weightGrams: e.target.value })}
                            className={inputCls}
                          />
                        </td>
                        <td className="w-28 py-1 pr-2">
                          <input
                            required
                            type="number"
                            min={0}
                            step="0.01"
                            inputMode="decimal"
                            value={v.price}
                            onChange={(e) => setVariant(v.key, { price: e.target.value })}
                            className={inputCls}
                          />
                          {perKg && (
                            <span className="mt-1 block text-xs text-slate-500">
                              {formatMoney(perKg).replace('.00', '')}/kg
                            </span>
                          )}
                        </td>
                        <td className="w-28 py-1 pr-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            inputMode="decimal"
                            placeholder="—"
                            value={v.mrp}
                            onChange={(e) => setVariant(v.key, { mrp: e.target.value })}
                            className={`${inputCls} ${v.mrp && Number(v.mrp) < Number(v.price) ? 'border-red-400' : ''}`}
                          />
                          {off > 0 && (
                            <span className="mt-1 block text-xs font-medium text-green-700">
                              Shows {off}% off
                            </span>
                          )}
                          {v.mrp && Number(v.mrp) < Number(v.price) && (
                            <span className="mt-1 block text-xs text-red-700">Below price</span>
                          )}
                        </td>
                        <td className="w-36 py-1 pr-2">
                          <input
                            required
                            maxLength={64}
                            value={v.sku}
                            onChange={(e) =>
                              setVariant(v.key, {
                                sku: e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, ''),
                                skuTouched: true,
                              })
                            }
                            className={`${inputCls} font-mono text-xs`}
                          />
                        </td>
                        <td className="w-20 py-1 pr-2">
                          <input
                            type="number"
                            min={0}
                            value={v.lowStockThreshold}
                            onChange={(e) =>
                              setVariant(v.key, { lowStockThreshold: e.target.value })
                            }
                            className={inputCls}
                          />
                        </td>
                        <td className="py-1 pt-2.5">
                          {v.id ? (
                            <input
                              type="checkbox"
                              checked={v.isActive}
                              onChange={(e) => setVariant(v.key, { isActive: e.target.checked })}
                              className="h-4 w-4 accent-brand-600"
                              aria-label={`${v.label || 'Size'} on sale`}
                              title="Untick to stop selling this size. It stays on past orders."
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setDraft((d) => ({
                                  ...d,
                                  variants: d.variants.filter((x) => x.key !== v.key),
                                }))
                              }
                              disabled={draft.variants.length === 1}
                              className="text-xs text-red-700 hover:underline disabled:opacity-30"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => addVariant()}>
                + Add size
              </Button>
              <span className="text-xs text-slate-500">Quick add:</span>
              {PRESETS.filter(
                (p) => !draft.variants.some((v) => Number(v.weightGrams) === p.grams),
              ).map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  variant="secondary"
                  onClick={() => addVariant(p)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            {product && (
              <p className="text-xs text-slate-500">
                Sizes that have been ordered can’t be deleted. Untick “On sale” to stop selling one.
              </p>
            )}
          </Section>

          <Section
            title="Product page details"
            description="Shown to customers under the price. Leave blank to hide a section."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ingredients">
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={draft.ingredients}
                  onChange={(e) => set('ingredients', e.target.value)}
                  placeholder="Cashews, sugar, pure ghee, cardamom"
                  className={inputCls}
                />
              </Field>
              <Field label="Allergen information">
                <textarea
                  rows={3}
                  maxLength={500}
                  value={draft.allergens}
                  onChange={(e) => set('allergens', e.target.value)}
                  placeholder="Contains milk and tree nuts."
                  className={inputCls}
                />
              </Field>
              <Field
                label="Shelf life (days)"
                hint="Also sets the expiry date on new stock batches."
              >
                <input
                  type="number"
                  min={1}
                  value={draft.shelfLifeDays}
                  onChange={(e) => set('shelfLifeDays', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Storage instructions">
                <input
                  maxLength={500}
                  value={draft.storageInstructions}
                  onChange={(e) => set('storageInstructions', e.target.value)}
                  placeholder="Store in a cool, dry place"
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Search engine listing"
            description="How this product appears on Google. Leave blank to use the name and description."
          >
            <Field label="Page title" hint={`${draft.metaTitle.length}/70`}>
              <input
                maxLength={70}
                value={draft.metaTitle}
                onChange={(e) => set('metaTitle', e.target.value)}
                placeholder={draft.name ? `${draft.name}: buy online` : ''}
                className={inputCls}
              />
            </Field>
            <Field label="Meta description" hint={`${draft.metaDescription.length}/160`}>
              <textarea
                rows={2}
                maxLength={160}
                value={draft.metaDescription}
                onChange={(e) => set('metaDescription', e.target.value)}
                placeholder={draft.description.slice(0, 160)}
                className={inputCls}
              />
            </Field>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Preview</p>
              <p className="mt-1 truncate text-lg text-[#1a0dab]">
                {draft.metaTitle || (draft.name ? `${draft.name}: buy online` : 'Product name')}
              </p>
              <p className="truncate text-xs text-green-800">
                …/products/{draft.slug || 'web-address'}
              </p>
              <p className="line-clamp-2 text-sm text-slate-600">
                {draft.metaDescription || draft.description.slice(0, 160) || 'Description'}
              </p>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Photos" description="The first photo is the cover on product cards.">
            <ImageList images={draft.images} onChange={(images) => set('images', images)} />
          </Section>

          <Section title="Shop placement">
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-slate-700">
                Homepage collections
              </legend>
              {COLLECTIONS.map((c) => (
                <label key={c.tag} className="flex cursor-pointer gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.tags.includes(c.tag)}
                    onChange={() => toggleTag(c.tag)}
                    className="mt-0.5 h-4 w-4 accent-brand-600"
                  />
                  <span>
                    {c.label}
                    <span className="block text-xs text-slate-500">{c.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="flex cursor-pointer gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={draft.isFeatured}
                onChange={(e) => set('isFeatured', e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-600"
              />
              <span>
                Featured
                <span className="block text-xs text-slate-500">
                  Listed first when customers sort by “Recommended”.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={draft.isVeg}
                onChange={(e) => set('isVeg', e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-600"
              />
              <span>
                Vegetarian
                <span className="block text-xs text-slate-500">Shows the green veg mark.</span>
              </span>
            </label>
            <TagInput
              tags={customTags}
              onChange={(t) =>
                set('tags', [...draft.tags.filter((x) => !customTags.includes(x)), ...t])
              }
            />
            <TagInput
              label="Other names"
              hint="Spellings and local names, e.g. laddu, motichoor laddoo. Search finds them too."
              placeholder="Add a name"
              max={40}
              tags={draft.searchAliases}
              onChange={(t) => set('searchAliases', t.slice(0, 20))}
            />
          </Section>

          <Section title="Tax">
            <div className="grid grid-cols-2 gap-3">
              <Field label="GST %">
                <select
                  value={draft.taxRatePercent}
                  onChange={(e) => set('taxRatePercent', e.target.value)}
                  className={inputCls}
                >
                  {['0', '5', '12', '18', '28'].map((r) => (
                    <option key={r} value={r}>
                      {r}%
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="HSN code">
                <input
                  maxLength={10}
                  value={draft.hsnCode}
                  onChange={(e) => set('hsnCode', e.target.value)}
                  placeholder="1704"
                  className={inputCls}
                />
              </Field>
            </div>
            <p className="text-xs text-slate-500">
              Prices are tax-inclusive; the GST share is worked out per order line for invoices.
            </p>
          </Section>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:left-56">
        <div className="flex items-center justify-end gap-3 px-8 py-3">
          {save.error && (
            <p className="mr-auto text-sm text-red-700" role="alert">
              {save.error.message}
            </p>
          )}
          {!save.error && (
            <p className="mr-auto text-sm text-slate-500">
              {justSaved ? (
                <span className="font-medium text-green-700">
                  Saved ✓ Changes appear on the shop within a minute.
                </span>
              ) : dirty ? (
                'You have unsaved changes'
              ) : product ? (
                'All changes saved'
              ) : (
                ''
              )}
            </p>
          )}
          <Link href="/products" className="text-sm text-slate-600 hover:text-slate-900">
            {dirty ? 'Discard' : 'Back to products'}
          </Link>
          <Button disabled={save.isPending || (!!product && !dirty)} className="px-5 py-2">
            {save.isPending ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

/** Photo URLs with previews. Upload to storage comes later; paste hosted image links for now. */
function ImageList({ images, onChange }: { images: string[]; onChange: (v: string[]) => void }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  function add() {
    try {
      const u = new URL(url.trim());
      if (u.protocol !== 'https:') throw new Error();
      if (images.includes(u.toString())) return setError('Already added');
      onChange([...images, u.toString()]);
      setUrl('');
      setError(null);
    } catch {
      setError('Paste a full https:// image link');
    }
  }

  return (
    <div className="space-y-3">
      {images.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {images.map((src, i) => (
            <li
              key={src}
              className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-white/90 px-1.5 text-[0.65rem] font-semibold">
                  Cover
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-slate-900/60 p-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                {i > 0 ? (
                  <button
                    type="button"
                    onClick={() => onChange([src, ...images.filter((x) => x !== src)])}
                    className="text-[0.65rem] font-medium text-white"
                  >
                    Make cover
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => onChange(images.filter((x) => x !== src))}
                  className="text-[0.65rem] font-medium text-white"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
          No photos yet. The shop shows an illustration until you add one.
        </p>
      )}
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://…/photo.jpg"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          className={inputCls}
        />
        <Button type="button" variant="secondary" onClick={add} disabled={!url.trim()}>
          Add
        </Button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
      <p className="text-xs text-slate-500">
        Direct uploads are coming soon. Square photos look best.
      </p>
    </div>
  );
}

function TagInput({
  tags,
  onChange,
  label = 'Search tags',
  hint = 'Extra words customers might search for, e.g. diwali, gifting.',
  placeholder,
  max = 30,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  max?: number;
}) {
  const [value, setValue] = useState('');
  const commit = () => {
    const t = value.trim().toLowerCase().slice(0, max);
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setValue('');
  };
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-300 bg-white p-1.5 focus-within:border-brand-600">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs"
          >
            {t}
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Backspace' && !value && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          className="min-w-24 flex-1 px-1 text-sm focus:outline-none"
        />
      </div>
    </Field>
  );
}
