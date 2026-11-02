'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge, Empty, PageHeader, Table, Td } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function VendorsPage() {
  const { api } = useAuth();
  const vendors = useQuery({ queryKey: ['vendors'], queryFn: api.vendors.list });
  const materials = useQuery({ queryKey: ['raw-materials'], queryFn: api.vendors.rawMaterials });

  return (
    <>
      <PageHeader title="Vendors" />
      {!vendors.data?.length ? (
        <Empty>{vendors.isLoading ? 'Loading…' : 'No vendors yet.'}</Empty>
      ) : (
        <Table head={['Vendor', 'Contact', 'GSTIN', 'Status']}>
          {vendors.data.map((v) => (
            <tr key={v.id}>
              <Td className="font-medium">{v.name}</Td>
              <Td>
                {v.contactName}
                <div className="text-xs text-slate-500">
                  {[v.phone, v.email].filter(Boolean).join(' · ')}
                </div>
              </Td>
              <Td className="font-mono text-xs">{v.gstin ?? '—'}</Td>
              <Td>
                <Badge tone={v.isActive ? 'green' : 'slate'}>
                  {v.isActive ? 'active' : 'inactive'}
                </Badge>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <h2 className="mb-3 mt-8 font-medium">Raw materials</h2>
      <Table head={['Material', 'In stock', 'Reorder at']}>
        {materials.data?.map((m) => (
          <tr key={m.id}>
            <Td>{m.name}</Td>
            <Td>
              <Badge tone={Number(m.currentStock) <= Number(m.reorderLevel) ? 'red' : 'green'}>
                {m.currentStock} {m.unit.toLowerCase()}
              </Badge>
            </Td>
            <Td className="text-slate-500">
              {m.reorderLevel} {m.unit.toLowerCase()}
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
