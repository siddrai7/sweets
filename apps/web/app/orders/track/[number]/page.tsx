'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { OrderDetail } from '@/components/account/order-detail';

function Page() {
  const { number } = useParams<{ number: string }>();
  const params = useSearchParams();
  return (
    <OrderDetail
      number={number}
      placed={params.get('placed') === '1'}
      guestToken={params.get('t') ?? ''}
    />
  );
}

export default function GuestOrderPage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
