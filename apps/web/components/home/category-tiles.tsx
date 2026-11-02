import Link from 'next/link';
import Image from 'next/image';
import { SweetArt } from '@/components/art/sweet-art';
import { SectionHeading } from '@/components/ui/section-heading';
import { artFor } from '@/lib/art';
import type { CategoryNode } from '@/lib/categories';

/** Leaf categories as a dense, tappable grid, the way quick-commerce apps lay them out. */
export function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  const tiles = categories.flatMap((c) => (c.children.length ? c.children : [c]));
  if (!tiles.length) return null;

  return (
    <section className="container-page py-8 sm:py-12">
      <SectionHeading
        eyebrow="Explore"
        title="Shop by category"
        href="/categories"
        action="All categories"
      />
      <ul className="grid grid-cols-5 gap-x-2 gap-y-4 sm:gap-y-5 sm:gap-x-4 lg:grid-cols-10">
        {tiles.map((c) => (
          <li key={c.id}>
            <CategoryTile category={c} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CategoryTile({
  category: c,
}: {
  category: CategoryNode | Omit<CategoryNode, 'children'>;
}) {
  const spec = artFor(c.slug, c.name);
  return (
    <Link href={`/shop/${c.slug}`} className="group flex flex-col items-center text-center">
      <span
        className="relative block aspect-square w-full overflow-hidden rounded-[1.1rem] ring-1 ring-black/[0.04] transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card"
        style={{ backgroundColor: spec.tone.bg }}
      >
        {c.imageUrl ? (
          <Image src={c.imageUrl} alt="" fill sizes="120px" className="object-cover" />
        ) : (
          <SweetArt
            spec={spec}
            background={false}
            className="absolute inset-0 h-full w-full scale-110 transition duration-500 group-hover:scale-[1.18]"
          />
        )}
      </span>
      <span className="mt-2 line-clamp-2 text-[0.66rem] font-bold leading-tight sm:text-[0.82rem]">
        {c.name}
      </span>
    </Link>
  );
}
