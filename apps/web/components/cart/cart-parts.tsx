'use client';

import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { ProductImage } from '@/components/product/product-image';
import { MinusIcon, PlusIcon, TrashIcon, TruckIcon } from '@/components/ui/icons';
import { useCart, type CartLine } from '@/lib/cart';
import { deliveryFeeFor } from '@/lib/pricing';
import { site } from '@/lib/site';

export function CartLineItem({ line, size = 'md' }: { line: CartLine; size?: 'md' | 'lg' }) {
  const { setQuantity } = useCart();
  const href = `/products/${line.productSlug}`;
  const total = Number(line.unitPrice) * line.quantity;
  const mrpTotal = line.mrp ? Number(line.mrp) * line.quantity : 0;
  const big = size === 'lg';

  return (
    <li className="flex gap-3.5 py-4">
      <Link href={href} className="shrink-0">
        <ProductImage
          name={line.productName}
          slug={line.productSlug}
          src={line.image}
          sizes={big ? '96px' : '72px'}
          className={`${big ? 'h-24 w-24' : 'h-[4.5rem] w-[4.5rem]'} rounded-2xl border border-brand-100`}
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={href}
          className={`line-clamp-2 font-semibold leading-snug transition hover:text-brand-600 ${big ? 'text-base' : 'text-sm'}`}
        >
          {line.productName}
        </Link>
        <span className="mt-0.5 text-xs text-cocoa-soft">{line.variantLabel}</span>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex h-8 items-center rounded-lg border border-brand-200 bg-white">
            <button
              onClick={() => setQuantity(line.variantId, line.quantity - 1)}
              className="flex h-full w-8 items-center justify-center text-cocoa-soft transition hover:text-brand-600"
              aria-label={line.quantity === 1 ? `Remove ${line.productName}` : 'Decrease quantity'}
            >
              {line.quantity === 1 ? <TrashIcon size={14} /> : <MinusIcon size={14} />}
            </button>
            <span className="w-6 text-center text-sm font-bold tabular-nums">{line.quantity}</span>
            <button
              onClick={() => setQuantity(line.variantId, line.quantity + 1)}
              disabled={line.maxQuantity !== undefined && line.quantity >= line.maxQuantity}
              className="flex h-full w-8 items-center justify-center text-cocoa-soft transition hover:text-brand-600 disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <PlusIcon size={14} />
            </button>
          </div>
          <div className="text-right leading-tight">
            <p className="font-bold tabular-nums">{formatMoney(total)}</p>
            {mrpTotal > total && (
              <p className="text-xs text-cocoa-soft line-through tabular-nums">
                {formatMoney(mrpTotal)}
              </p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/** Progress towards free delivery. */
export function FreeDeliveryMeter({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, site.freeDeliveryAbove - subtotal);
  const progress = Math.min(100, (subtotal / site.freeDeliveryAbove) * 100);
  return (
    <div className="rounded-2xl bg-white p-3.5 ring-1 ring-brand-200">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${remaining > 0 ? 'bg-saffron-100 text-saffron-600' : 'bg-pista-100 text-pista-600'}`}
        >
          <TruckIcon size={18} />
        </span>
        <p className="text-sm leading-snug">
          {remaining > 0 ? (
            <>
              Add <strong className="tabular-nums">{formatMoney(remaining)}</strong> more for{' '}
              <strong>free delivery</strong>
            </>
          ) : (
            <span className="font-semibold text-pista-600">
              Yay! You&apos;ve unlocked free delivery
            </span>
          )}
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${remaining > 0 ? 'bg-gradient-to-r from-saffron-400 to-saffron-500' : 'bg-pista-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/** Itemised bill, mirroring how the API prices the order. */
export function BillDetails({
  subtotal,
  savings,
  fulfillment = 'DELIVERY',
}: {
  subtotal: number;
  savings: number;
  fulfillment?: 'DELIVERY' | 'PICKUP';
}) {
  const fee = deliveryFeeFor(subtotal, fulfillment);
  const total = subtotal + fee;
  const freeDeliveryApplied = fulfillment === 'DELIVERY' && fee === 0;

  return (
    <div className="space-y-2.5 text-sm">
      <h3 className="font-sans text-sm font-bold">Bill details</h3>
      <Row label="Item total" value={formatMoney(subtotal + savings)} />
      {savings > 0 && (
        <Row label="Discount" value={`− ${formatMoney(savings)}`} className="text-pista-600" />
      )}
      <Row
        label={fulfillment === 'PICKUP' ? 'Store pickup' : 'Delivery fee'}
        value={
          fee > 0 ? (
            formatMoney(fee)
          ) : (
            <span className="font-semibold text-pista-600">
              {freeDeliveryApplied && (
                <span className="mr-1.5 text-cocoa-soft line-through">
                  {formatMoney(site.deliveryFee)}
                </span>
              )}
              FREE
            </span>
          )
        }
      />
      <div className="flex items-baseline justify-between border-t border-dashed border-brand-300 pt-3 text-base font-extrabold">
        <span>To pay</span>
        <span className="tabular-nums">{formatMoney(total)}</span>
      </div>
      {savings + (freeDeliveryApplied ? site.deliveryFee : 0) > 0 && (
        <p className="rounded-xl bg-pista-50 px-3 py-2 text-center text-xs font-bold text-pista-600">
          You&apos;re saving {formatMoney(savings + (freeDeliveryApplied ? site.deliveryFee : 0))}{' '}
          on this order
        </p>
      )}
      <p className="text-xs text-cocoa-soft">Prices are inclusive of all taxes (GST).</p>
    </div>
  );
}

function Row({
  label,
  value,
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline justify-between ${className}`}>
      <span className="text-cocoa-soft">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
