'use client';

import { HeartIcon } from '@/components/ui/icons';
import { useWishlist } from '@/lib/wishlist';

export function WishlistButton({
  productId,
  name,
  className = '',
  size = 20,
}: {
  productId: string;
  name: string;
  className?: string;
  size?: number;
}) {
  const { has, toggle } = useWishlist();
  const on = has(productId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(productId);
      }}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={`flex items-center justify-center rounded-full transition active:scale-90 ${on ? 'text-brand-600' : 'text-cocoa-soft hover:text-brand-600'} ${className}`}
    >
      <HeartIcon size={size} filled={on} />
    </button>
  );
}
