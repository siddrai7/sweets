'use client';

import { formatMoney } from '@/lib/money';
import type { Product } from '@sweets/types';
import { Sheet } from '@/components/ui/sheet';
import { useCart } from '@/lib/cart';
import { isAvailable, percentOff, perKg } from '@/lib/pricing';
import { AddButton } from './add-button';
import { ProductImage } from './product-image';

/** Pick a pack size and add it, without leaving the listing. */
export function VariantSheet({
  product,
  open,
  selectedId,
  onSelect,
  onClose,
}: {
  product: Product;
  open: boolean;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const { count, subtotal, openCart } = useCart();

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <ProductImage
            name={product.name}
            slug={product.slug}
            src={product.images[0]}
            sizes="48px"
            className="h-12 w-12 shrink-0 rounded-xl"
          />
          <span>
            {product.name}
            <span className="block font-sans text-xs font-medium text-cocoa-soft">
              Choose a pack size
            </span>
          </span>
        </span>
      }
      footer={
        count > 0 ? (
          <button
            onClick={() => {
              onClose();
              openCart();
            }}
            className="btn-primary w-full justify-between rounded-2xl"
          >
            <span>
              {count} item{count > 1 ? 's' : ''} · {formatMoney(subtotal)}
            </span>
            <span>View cart →</span>
          </button>
        ) : undefined
      }
    >
      <ul className="space-y-2.5">
        {product.variants.map((v) => {
          const unit = perKg(v);
          const off = percentOff(v);
          const selected = v.id === selectedId;
          return (
            <li
              key={v.id}
              onClick={() => isAvailable(v) && onSelect(v.id)}
              className={`flex items-center gap-3 rounded-2xl border bg-white p-3.5 transition ${
                selected ? 'border-cocoa ring-1 ring-cocoa' : 'border-brand-200'
              } ${isAvailable(v) ? 'cursor-pointer' : 'opacity-60'}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{v.label}</p>
                <p className="mt-0.5 text-sm tabular-nums">
                  <span className="font-bold">{formatMoney(v.price)}</span>
                  {off > 0 && (
                    <>
                      <span className="ml-1.5 text-xs text-cocoa-soft line-through">
                        {formatMoney(v.mrp!)}
                      </span>
                      <span className="ml-1.5 text-xs font-bold text-pista-600">{off}% off</span>
                    </>
                  )}
                </p>
                {unit && (
                  <p className="mt-0.5 text-xs text-cocoa-soft">{formatMoney(unit)} per kg</p>
                )}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <AddButton product={product} variant={v} />
              </div>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
