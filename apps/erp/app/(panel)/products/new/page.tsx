'use client';

import Link from 'next/link';
import { ProductForm } from '@/components/product-form';
import { PageHeader } from '@/components/ui';

export default function NewProductPage() {
  return (
    <>
      <Link href="/products" className="text-sm text-slate-500 hover:text-slate-800">
        ← Products
      </Link>
      <PageHeader title="New product" />
      <ProductForm />
    </>
  );
}
