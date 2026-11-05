'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Badge, Empty, PageHeader, Table, Tabs, Td, fmtDate } from '@/components/ui';
import { useAuth } from '@/lib/auth';

/** What customers search for, and especially what they search for and don't find. */
export default function SearchReportPage() {
  const { api } = useAuth();
  const [tab, setTab] = useState<'zero' | 'all'>('zero');
  const report = useQuery({
    queryKey: ['search-report', tab],
    queryFn: () => api.catalog.searchReport(tab === 'zero'),
  });

  return (
    <>
      <PageHeader title="Customer searches" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-slate-500">
        Searches that found nothing are sweets customers want but can’t find. Add the word to a
        product’s <strong>Other names</strong> (e.g. a local spelling), or consider stocking it.
      </p>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'zero', label: 'Found nothing' },
          { value: 'all', label: 'All searches' },
        ]}
      />
      {report.error ? (
        <Empty>Couldn’t load the report: {report.error.message}</Empty>
      ) : !report.data?.length ? (
        <Empty>
          {report.isLoading
            ? 'Loading…'
            : tab === 'zero'
              ? 'Every search found something. 🎉'
              : 'No searches yet.'}
        </Empty>
      ) : (
        <Table
          head={['Search', 'Times searched', 'Found nothing', 'Last results', 'Last searched', '']}
        >
          {report.data.map((t) => (
            <tr key={t.term}>
              <Td className="font-medium">{t.term}</Td>
              <Td>{t.searches}</Td>
              <Td>
                {t.zeroResults ? (
                  <Badge tone="red">{t.zeroResults}×</Badge>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </Td>
              <Td>{t.lastResults}</Td>
              <Td className="text-slate-500">{fmtDate(t.lastSearchedAt)}</Td>
              <Td className="text-right">
                <Link
                  href={`/products?search=${encodeURIComponent(t.term)}`}
                  className="text-sm text-brand-700 hover:underline"
                >
                  Find products
                </Link>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
