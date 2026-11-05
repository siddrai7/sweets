import Image from 'next/image';
import { ArtImage } from '@/components/art/art-image';

interface Props {
  name: string;
  slug: string;
  src?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Product photo, or an illustrated placeholder until real photography exists.
 * The placeholder is pure SVG, so it is crisp at any size and costs nothing to load.
 */
export function ProductImage({
  name,
  slug,
  src,
  sizes = '(min-width: 1024px) 25vw, 50vw',
  priority,
  className = '',
}: Props) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-brand-100 ${className}`}>
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} role="img" aria-label={name}>
      <ArtImage
        hints={[slug, name]}
        priority={priority}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
