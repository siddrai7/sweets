'use client';

import { useState } from 'react';
import { ProductImage } from './product-image';

export function ProductGallery({
  name,
  slug,
  images,
  badge,
}: {
  name: string;
  slug: string;
  images: string[];
  badge?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  // With no photos yet we still render one placeholder so the layout is stable.
  const sources: (string | undefined)[] = images.length ? images : [undefined];

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {sources.length > 1 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto lg:w-20 lg:flex-col">
          {sources.map((src, i) => (
            <button
              key={src ?? i}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`shrink-0 overflow-hidden rounded-xl ring-2 transition ${i === active ? 'ring-cocoa' : 'opacity-70 ring-transparent hover:opacity-100'}`}
            >
              <ProductImage name={name} slug={slug} src={src} sizes="80px" className="h-20 w-20" />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex-1">
        <ProductImage
          name={name}
          slug={slug}
          src={sources[active]}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-square rounded-[2rem] ring-1 ring-brand-200"
        />
        {badge && <div className="absolute left-4 top-4">{badge}</div>}
      </div>
    </div>
  );
}
