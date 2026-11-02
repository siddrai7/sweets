'use client';

import { useState } from 'react';
import { ProductImage } from './product-image';

export function ProductGallery({
  name,
  slug,
  images,
}: {
  name: string;
  slug: string;
  images: string[];
}) {
  const [active, setActive] = useState(0);
  // With no photos yet we still render one placeholder so the layout is stable.
  const sources: (string | undefined)[] = images.length ? images : [undefined];

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {sources.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto lg:w-20 lg:flex-col">
          {sources.map((src, i) => (
            <button
              key={src ?? i}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`shrink-0 overflow-hidden rounded-xl border-2 transition ${i === active ? 'border-brand-600' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <ProductImage name={name} slug={slug} src={src} sizes="80px" className="h-20 w-20" />
            </button>
          ))}
        </div>
      )}
      <ProductImage
        name={name}
        slug={slug}
        src={sources[active]}
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="aspect-square flex-1 rounded-3xl border border-brand-200"
      />
    </div>
  );
}
