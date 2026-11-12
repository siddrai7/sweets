import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/logo.png';
import { site } from '@/lib/site';

/** The brand badge (transparent PNG, so it sits on light and dark surfaces alike). */
export function LogoBadge({
  size = 48,
  fluid = false,
  priority,
  className = '',
}: {
  /** Rendered height in pixels; the badge is slightly taller than it is wide. */
  size?: number;
  /** Fill the parent's height instead (`size` then only picks the image resolution). */
  fluid?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={logo}
      alt=""
      aria-hidden
      priority={priority}
      sizes={`${size}px`}
      style={{ height: fluid ? '100%' : size, width: 'auto' }}
      className={`shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={`${site.name} home`}>
      <LogoBadge
        size={compact ? 46 : 58}
        priority
        className="transition duration-500 group-hover:scale-105"
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-medium tracking-tight text-brand-800 ${compact ? 'text-[1.3rem]' : 'text-[1.55rem]'}`}
        >
          {site.name}
        </span>
        <span
          aria-hidden
          className="mt-1 text-[0.55rem] font-bold uppercase tracking-[0.32em] text-saffron-600"
        >
          {site.descriptor}
        </span>
      </span>
    </Link>
  );
}
