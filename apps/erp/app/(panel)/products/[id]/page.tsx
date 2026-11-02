'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ProductForm } from '@/components/product-form';
import { Badge, Button, Empty, Modal, PageHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { STOREFRONT_URL } from '@/lib/catalog';

function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const created = useSearchParams().get('created');
  const { api, user } = useAuth();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const product = useQuery({ queryKey: ['products', id], queryFn: () => api.catalog.product(id) });

  const toggle = useMutation({
    mutationFn: () =>
      product.data!.isActive ? api.catalog.archiveProduct(id) : api.catalog.restoreProduct(id),
    onSuccess: () => {
      setConfirm(false);
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
  });

  if (product.error) return <Empty>Couldn’t load this product: {product.error.message}</Empty>;
  if (!product.data) return <Empty>Loading…</Empty>;
  const p = product.data;

  return (
    <>
      <Link href="/products" className="text-sm text-slate-500 hover:text-slate-800">
        ← Products
      </Link>
      <PageHeader
        title={p.name}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={p.isActive ? 'green' : 'slate'}>
              {p.isActive ? 'Live on shop' : 'Archived'}
            </Badge>
            {p.isActive && (
              <a
                href={`${STOREFRONT_URL}/products/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
              >
                View on shop ↗
              </a>
            )}
            {user?.role === 'ADMIN' && (
              <Button
                variant={p.isActive ? 'danger' : 'secondary'}
                onClick={() => setConfirm(true)}
              >
                {p.isActive ? 'Archive' : 'Restore'}
              </Button>
            )}
          </div>
        }
      />
      {created && (
        <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          Product created and live on the shop. Add stock on the Inventory page so customers can
          order it.
        </p>
      )}
      {!p.isActive && (
        <p className="mb-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
          This product is archived: it’s hidden from the shop but kept for past orders.
        </p>
      )}
      <ProductForm product={p} />

      {confirm && (
        <Modal
          title={p.isActive ? `Archive ${p.name}?` : `Restore ${p.name}?`}
          width="max-w-md"
          onClose={() => setConfirm(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant={p.isActive ? 'danger' : 'primary'}
                disabled={toggle.isPending}
                onClick={() => toggle.mutate()}
              >
                {p.isActive ? 'Archive' : 'Restore'}
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            {p.isActive
              ? 'It disappears from the shop, search and homepage within a minute. Past orders and stock records are kept, and you can restore it any time.'
              : 'It goes back on the shop with its current prices and stock.'}
          </p>
          {toggle.error && <p className="mt-3 text-sm text-red-700">{toggle.error.message}</p>}
        </Modal>
      )}
    </>
  );
}

export default function EditProductPage() {
  return (
    <Suspense>
      <EditProduct />
    </Suspense>
  );
}
