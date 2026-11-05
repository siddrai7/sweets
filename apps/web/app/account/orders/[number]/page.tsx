'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { OrderDetail } from '@/components/account/order-detail';

function Page() {
  const { number } = useParams<{ number: string }>();
  const placed = useSearchParams().get('placed') === '1';
  return <OrderDetail number={number} placed={placed} />;
}

export default function OrderPage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
