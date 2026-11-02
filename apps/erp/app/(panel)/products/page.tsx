'use client';

import { useQuery } from '@tanstack/react-query';
import { formatMoney } from '@sweets/api-client';
import { Badge, Empty, PageHeader, Table, Td } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function ProductsPage() {
  const { api } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => api.catalog.products({ includeInactive: true, pageSize: 100 }),
  });

  return (
    <>
      {/* Product create/edit forms come next: POST/PATCH /products already exist in the API. */}
      <PageHeader title="Products" />
      {isLoading ? (
        <Empty>Loading…</Empty>
      ) : !data?.items.length ? (
        <Empty>No products yet.</Empty>
      ) : (
        <Table head={['Product', 'Category', 'Variants', 'Status']}>
          {data.items.map((p) => (
            <tr key={p.id}>
              <Td>
                <span className="font-medium">{p.name}</span>
                <div className="text-xs text-slate-500">/{p.slug}</div>
              </Td>
              <Td>{p.category?.name}</Td>
              <Td className="text-xs">
                {p.variants.map((v) => (
                  <div key={v.id} className={v.isActive ? '' : 'text-slate-400 line-through'}>
                    <span className="font-mono">{v.sku}</span> · {v.label} · {formatMoney(v.price)}{' '}
                    ·{' '}
                    <span className={(v.available ?? 0) > 0 ? 'text-green-700' : 'text-red-700'}>
                      {v.available ?? 0} in stock
                    </span>
                  </div>
                ))}
              </Td>
              <Td>
                <div className="flex gap-1">
                  <Badge tone={p.isActive ? 'green' : 'slate'}>
                    {p.isActive ? 'active' : 'archived'}
                  </Badge>
                  {p.isFeatured && <Badge tone="amber">featured</Badge>}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
